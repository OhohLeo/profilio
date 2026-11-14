/**
 * Client minimal de l'API Admin Ghost (JWT HS256 depuis GHOST_ADMIN_API_KEY "<id>:<secret hex>").
 * Env : GHOST_ADMIN_URL, GHOST_ADMIN_API_KEY.
 */
import crypto from "node:crypto";

const API_VERSION = "v5.0";
const b64url = (b) => Buffer.from(b).toString("base64").replace(/=+$/, "").replace(/\+/g, "-").replace(/\//g, "_");

export function makeAdminToken(key) {
  const [id, secret] = key.split(":");
  const now = Math.floor(Date.now() / 1000);
  const head = b64url(JSON.stringify({ alg: "HS256", typ: "JWT", kid: id }));
  const body = b64url(JSON.stringify({ iat: now, exp: now + 300, aud: "/admin/" }));
  const sig = crypto.createHmac("sha256", Buffer.from(secret, "hex")).update(`${head}.${body}`).digest();
  return `${head}.${body}.${b64url(sig)}`;
}

export function ghostClient({ adminUrl, adminKey } = {}) {
  const baseUrl = (adminUrl || process.env.GHOST_ADMIN_URL || "http://localhost:2369").replace(/\/$/, "");
  const key = adminKey || process.env.GHOST_ADMIN_API_KEY;
  if (!key || !key.includes(":")) throw new Error('GHOST_ADMIN_API_KEY manquante ou mal formée (attendu "<id>:<secret>")');

  const adminFetch = async (path, method = "GET", body = null) => {
    const res = await fetch(`${baseUrl}/ghost/api/admin${path}`, {
      method,
      headers: {
        Authorization: `Ghost ${makeAdminToken(key)}`,
        "Content-Type": "application/json",
        "Accept-Version": API_VERSION,
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    const txt = await res.text();
    if (!res.ok) throw new Error(`${method} ${path} → ${res.status} ${res.statusText}\n${txt}`);
    return txt ? JSON.parse(txt) : {};
  };

  return {
    baseUrl,
    adminFetch,
    async findPostBySlug(slug) {
      try {
        const r = await adminFetch(`/posts/slug/${encodeURIComponent(slug)}/?formats=html&include=tags`);
        return r.posts?.[0] ?? null;
      } catch (e) {
        if (/ 404 /.test(e.message)) return null;
        throw e;
      }
    },
    async listPosts(filter) {
      const q = new URLSearchParams({ limit: "all", formats: "html", include: "tags", filter });
      return (await adminFetch(`/posts/?${q}`)).posts ?? [];
    },
    createPost: (post) => adminFetch("/posts/?source=html", "POST", { posts: [post] }),
    updatePost: (id, post) => adminFetch(`/posts/${id}/?source=html`, "PUT", { posts: [post] }),
  };
}
