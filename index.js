const express = require("express");
const decision = require("./decision");

const app = express();

const port = process.env.PORT || 3000;
app.listen(port, function () {
  console.log("Server listening on port:" + port);
});

app.get("/", function (request, result) {
  decision.getDataFromOpenWeather(result, request.acceptsLanguages()[1]);
});
