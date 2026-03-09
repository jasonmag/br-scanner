import test from "node:test";
import assert from "node:assert/strict";
import { getCenterRoi } from "../../src/lib/scanner/heuristics/roi";

test("creates a centered roi", () => {
  const roi = getCenterRoi(1000, 800);

  assert.equal(roi.width, 820);
  assert.equal(roi.height, 336);
  assert.equal(roi.x, 90);
  assert.equal(roi.y, 232);
});
