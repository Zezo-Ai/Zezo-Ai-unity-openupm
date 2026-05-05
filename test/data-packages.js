/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const { describe, it } = require("node:test");
const spdx = require("spdx-license-list");
const yaml = require("js-yaml");
const {
  loadPackageNamesSync,
  loadPackageSync,
  loadTopicsSync,
  loadBlockedScopesSync,
  dataDir,
  packagesDir,
  isValidPackageName,
  isPackageBlockedByScope
} = require("../scripts/data-validator");

const knownInvalidNames = [];

function assertNonEmptyString(value, fieldName) {
  assert.ok(value != null, `${fieldName} is required`);
  assert.equal(typeof value, "string");
  const trimmedValue = value.trim();
  assert.ok(
    trimmedValue.length > 0,
    `${fieldName} must not be an empty string`
  );
}

describe("data/packages", function() {
  const packageNames = loadPackageNamesSync();
  const validTopics = loadTopicsSync();
  const blockedScopes = loadBlockedScopesSync();
  describe("verify packages", function() {
    for (const packageName of packageNames) {
      it("verify format: " + packageName, async function() {
        const pkg = await loadPackageSync(packageName);
        // Check required
        assert.ok(pkg != null, "yaml format should be valid");
        assertNonEmptyString(pkg.repoUrl, "repoUrl");
        assertNonEmptyString(pkg.name, "name");
        assert.ok(pkg.displayName != null, "displayName is required");
        assert.equal(typeof pkg.displayName, "string");
        assert.ok(pkg.description != null, "description is required");
        assert.equal(typeof pkg.description, "string");
        assertNonEmptyString(pkg.licenseName, "licenseName");

        assert.ok(
          Object.prototype.hasOwnProperty.call(pkg, "licenseSpdxId"),
          "licenseSpdxId is required"
        );
        const licenseSpdxTypeValid =
          pkg.licenseSpdxId === null || typeof pkg.licenseSpdxId === "string";
        assert.equal(licenseSpdxTypeValid, true, "licenseSpdxId should be null or string");
        if (typeof pkg.licenseSpdxId === "string") {
          assert.ok(
            pkg.licenseSpdxId.length > 0,
            "licenseSpdxId must not be an empty string"
          );
        }

        assert.ok(
          Object.prototype.hasOwnProperty.call(pkg, "topics"),
          "topics is required"
        );
        assert.ok(Array.isArray(pkg.topics), "topics should be an array");
        pkg.topics.forEach(topic => assert.equal(typeof topic, "string"));

        assert.ok(
          Object.prototype.hasOwnProperty.call(pkg, "hunter"),
          "hunter is required"
        );
        assertNonEmptyString(pkg.hunter, "hunter");

        assert.ok(
          Object.prototype.hasOwnProperty.call(pkg, "createdAt"),
          "createdAt is required"
        );
        assert.equal(typeof pkg.createdAt, "number");

        const [isNameValid, nameValidError] = isValidPackageName(pkg.name);
        // Ignore known invalid names
        if (!knownInvalidNames.includes(pkg.name)) {
          if (!isNameValid) throw nameValidError;
        }
        assert.equal(
          pkg.name,
          packageName,
          "pkg.name should be match with filename[.yml]"
        );
        // Check blocked scopes
        for (let scope of blockedScopes) {
          assert.ok(!isPackageBlockedByScope(pkg.name, scope), `${pkg.name} is blocked by scope ${scope}.`);
        }
        // check topics
        if (pkg.topics) {
          if (typeof pkg.topics === "string") pkg.topics = [pkg.topics];
          for (const topic of pkg.topics) {
            const found = validTopics.find(x => x.slug == topic);
            assert.ok(found != null, `topic ${topic} should be valid`);
          }
        }
        // check license
        if (pkg.licenseSpdxId) {
          assert.ok(
            spdx[pkg.licenseSpdxId] != null,
            `licenseSpdxId ${pkg.licenseSpdxId} should be valid. See full IDs at https://raw.githubusercontent.com/sindresorhus/spdx-license-list/master/spdx-simple.json`
          );
        }
        // check image
        if (pkg.image) {
          assert.ok(
            /https?:\/\//i.test(pkg.image),
            `image field should be a valid URL.`
          );
        }
      });
    }
  });
  describe("verify packages extention name", function() {
    const files = fs.readdirSync(packagesDir);
    for (const file of files) {
      it("verify extention name: " + file, function() {
        assert.ok(file.endsWith(".yml"));
      });
    }
  });
  describe("verify other YAML files", function () {
    const files = ["backers.yml", "blocked-scopes.yml", "builtin.yml", "sponsors.yml", "topics.yml"];
    for (const file of files) {
      let absPath = path.resolve(dataDir, file);
      it("verify " + file, function() {
        const result = yaml.load(fs.readFileSync(absPath, "utf8"));
        assert.notEqual(result, undefined);
      });
    }
  });
});
