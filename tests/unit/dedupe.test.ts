import test from "node:test";
import assert from "node:assert/strict";
import { shouldSuppressDuplicate } from "../../src/lib/scanner/utils/dedupe";

test("suppresses duplicate values within cooldown", () => {
  assert.equal(
    shouldSuppressDuplicate(
      { value: "123", timestamp: 1_000 },
      "123",
      1_500,
      1_200
    ),
    true
  );
});

test("allows different values", () => {
  assert.equal(
    shouldSuppressDuplicate(
      { value: "123", timestamp: 1_000 },
      "456",
      1_500,
      1_200
    ),
    false
  );
});
