//A refaire suite basculte nunjucks / node-fetch
const fs = require("fs");
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
    };
    expect(decision.valueOr0(myObject)).toBe(1);
  });
});

describe("Testing groupByDate", () => {
  const selectedTimes = JSON.parse(fs.readFileSync("./testFiles/selectedTimes.json"));
  const groupByDateArray = JSON.parse(fs.readFileSync("./testFiles/groupByDate.json"));
  test("groupByDate should return groupByDate.json",() => {
    expect(decision.groupByDate(selectedTimes)).toEqual(groupByDateArray);
  } );
});

describe("Testing replaceDatesByDayText", () => {
  test("Check that it can transform 0 to Sunday", () => {
    const myArray = [{
      date: "2017-12-17",
      morningBike: "",
      morningExplanation: "",
      eveningBike: "",
      eveningExplanation: ""
    }];
    expect(decision.replaceDatesByDayText(myArray, "en")).toEqual([{
      date: "Sunday",
      morningBike: "",
      morningExplanation: "",
      eveningBike: "",
      eveningExplanation: ""
    }]);
  });
});