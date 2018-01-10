//A refaire suite basculte nunjucks / node-fetch
const fs = require("fs");
const queries = require("./queries");

describe("Testing valueOr0", () => {
  test("valueOr0 should return 0 if passed undefined", () => {
    expect(queries.valueOr0(undefined)).toBe(0);
  });

  test("valueOr0 shoud return 0 if object.[3h] is undefined", () => {
    const myObject = {
      "3h": undefined
    };
    expect(queries.valueOr0(myObject)).toBe(0);
  });

  test("valueOr0 should return rain value", () => {
    const myObject = {
      "3h": 1
    };
    expect(queries.valueOr0(myObject)).toBe(1);
  });
});

// describe("Testing groupByDate", () => {
//   const selectedTimes = JSON.parse(fs.readFileSync("./testFiles/selectedTimes.json"));
//   const groupByDateArray = JSON.parse(fs.readFileSync("./testFiles/groupByDate.json"));
//   test("groupByDate should return groupByDate.json",() => {
//     expect(queries.groupByDate(selectedTimes)).toEqual(groupByDateArray);
//   } );
// });
//

describe("I should be able to connect to Google API", () => {
  expect.assertions(1);
  queries.getCityName(50.6793967,3.1836043)
    .then(city => {
      expect(city).toBe("Roubaix");
    });
});
