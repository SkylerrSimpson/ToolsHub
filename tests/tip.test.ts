import assert from "node:assert/strict";
import test from "node:test";
import { calculateTip, parseDecimal } from "../src/features/tip/calculate";

test("bill and tip split reproduce the original valid calculation", () => {
  assert.deepEqual(calculateTip(100, 15, 2), { tipPerPerson: 7.5, totalPerPerson: 57.5 });
  assert.deepEqual(calculateTip(40, 0, 4), { tipPerPerson: 0, totalPerPerson: 10 });
});
test("invalid inputs never produce Infinity or NaN results", () => {
  for (const people of [0, -1, 1.5, NaN, Infinity])
    assert.equal(calculateTip(100, 15, people), null);
  assert.equal(calculateTip(-1, 10, 2), null);
  assert.equal(calculateTip(100, -10, 2), null);
  assert.equal(calculateTip(Number.MAX_VALUE, Number.MAX_VALUE, 1), null);
});
test("decimal editing and fractional percentages are valid, nondecimal forms are rejected", () => {
  assert.equal(parseDecimal("12."), 12);
  assert.equal(parseDecimal("12.50"), 12.5);
  assert.equal(parseDecimal(".5"), 0.5);
  for (const invalid of ["", ".", "-1", "Infinity", "NaN", "0x10", "1e3"])
    assert.equal(parseDecimal(invalid), null);
  assert.equal(calculateTip(80, 17.5, 2)?.tipPerPerson, 7);
});
