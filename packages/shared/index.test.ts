import assert from "node:assert/strict";
import { test } from "node:test";
import { userList } from "./index";
test("pagination validates bounds and rejects unknown keys", () => {
  assert.deepEqual(userList.parse({}), { page: 1, size: 20 });
  assert.equal(userList.safeParse({ size: 101 }).success, false);
  assert.equal(userList.safeParse({ unknown: true }).success, false);
});
