const decision = require("./decision");

describe("Testing valueOr0", () => {
  test("valueOr0 should return 0 if passed undefined", () => {
    expect(decision.valueOr0(undefined)).toBe(0);
  });

  test("valueOr0 shoud return 0 if object.[3h] is undefined", () => {
    const myObject = {
      "3h": undefined
    };
    expect(decision.valueOr0(myObject)).toBe(0);
  });

  test("valueOr0 should return rain value", () => {
    const myObject = {
      "3h": 1
    }
    expect(decision.valueOr0(myObject)).toBe(1);
  });
});
