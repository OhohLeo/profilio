import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { checkBuild } from "../scripts/security/check-build.mjs";

async function fixture(run) {
  const root = await mkdtemp(join(tmpdir(), "profilio-security-"));
  try {
    await mkdir(join(root, "dist"));
    await writeFile(join(root, "dist/index.html"), "<!doctype html><title>CV</title>");
    await run(root);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

test("autorise la clé Content API publique et le contenu du CV", () => fixture(async (root) => {
  const publicKey = "ab".repeat(13);
  await writeFile(join(root, ".env"), `VITE_GHOST_CONTENT_KEY=${publicKey}`);
  await writeFile(join(root, "dist/app.js"), `const key='${publicKey}'`);
  assert.deepEqual(await checkBuild({ root, environment: {} }), []);
}));

test("détecte une clé Admin Ghost complète ou son secret seul sans en afficher la valeur", () => fixture(async (root) => {
  const secret = "cd".repeat(32), key = `${"ab".repeat(12)}:${secret}`;
  await writeFile(join(root, ".env"), `GHOST_ADMIN_API_KEY='${key}'`);
  for (const value of [key, secret]) {
    await writeFile(join(root, "dist/app.js"), `const leak='${value}'`);
    const findings = await checkBuild({ root, environment: {} });
    assert.ok(findings.some((item) => item.reason === "local-secret"));
    assert.ok(!JSON.stringify(findings).includes(secret));
  }
}));

test("détecte les mots de passe locaux et les tokens fournis par l’environnement", () => fixture(async (root) => {
  const password = "fixture-only-password", token = "fixture-only-token";
  await writeFile(join(root, ".env.production"), `DB_PASSWORD=${password}`);
  await writeFile(join(root, "dist/app.js"), `${password} ${token}`);
  const findings = await checkBuild({ root, environment: { SERVICE_TOKEN: token } });
  assert.ok(findings.some((item) => item.variable === "DB_PASSWORD"));
  assert.ok(findings.some((item) => item.variable === "SERVICE_TOKEN"));
}));

test("refuse les dotenv et les sources maps copiés dans le build", () => fixture(async (root) => {
  await writeFile(join(root, "dist/.env"), "EXAMPLE=example");
  await writeFile(join(root, "dist/app.js.map"), "{}");
  const findings = await checkBuild({ root, environment: {} });
  assert.deepEqual(findings.filter((item) => item.reason === "private-file").map((item) => item.file).sort(), [".env", "app.js.map"]);
}));

test("autorise .well-known/security.txt mais pas les autres fichiers cachés", () => fixture(async (root) => {
  await mkdir(join(root, "dist/.well-known"));
  await writeFile(join(root, "dist/.well-known/security.txt"), "Contact: mailto:security@example.org");
  assert.deepEqual(await checkBuild({ root, environment: {} }), []);
  await writeFile(join(root, "dist/.well-known/other.txt"), "x");
  const findings = await checkBuild({ root, environment: {} });
  assert.deepEqual(findings.filter((item) => item.reason === "private-file").map((item) => item.file), [".well-known/other.txt"]);
}));
