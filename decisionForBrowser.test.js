const decision = require("./decisionForBrowser");

test("I should have user limits", () => {
  expect(decision.userLimits.rain >= 0
    && decision.userLimits.snow >= 0
    && decision.temp >= 0
    && decision.wind >= 0
  );
});
