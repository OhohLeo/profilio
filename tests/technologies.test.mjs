import assert from "node:assert/strict";
import test from "node:test";
import { technologyNames, matchesTechnologies } from "../src/technologies.ts";

test("les tags de classement Ghost ne sont jamais des technologies", () => {
  assert.deepEqual(technologyNames([
    { name: "#experience" }, { name: " #expérience " },
    { name: "experience", slug: "hash-experience" },
    { name: "projet", visibility: "internal" },
    { name: "Python" }, { name: "Go" },
  ]), ["Python", "Go"]);
  assert.deepEqual(technologyNames(), []);
});

test("sans sélection, toutes les expériences restent actives", () => {
  assert.equal(matchesTechnologies([], [], "any"), true);
  assert.equal(matchesTechnologies(["Go"], [], "all"), true);
});

test("au moins une accepte une correspondance même après la première sélection", () => {
  assert.equal(matchesTechnologies(["Python"], ["Go", "Python"], "any"), true);
  assert.equal(matchesTechnologies(["Ruby"], ["Go", "Python"], "any"), false);
});

test("toutes exige chaque technologie sélectionnée sur la même expérience", () => {
  assert.equal(matchesTechnologies(["Go"], ["Go", "Python"], "all"), false);
  assert.equal(matchesTechnologies(["Go", "Python", "Docker"], ["Go", "Python"], "all"), true);
});
