const express = require("express");
const app = express();
const nunjucks = require("nunjucks");
const queries = require ("./queries.js");

nunjucks.configure("views", {
  autoescape: true,
  express: app
});

app.set("views", __dirname + "/views");
app.set("view engine", "njk");

app.use(express.static('./images'));

const port = process.env.PORT || 3000;

app.listen(port, function () {
  console.log("Server listening on port:" + port);
});

app.get("/", function(request, result) {
  result.render("home");
});

app.get("/latitude/:lat/longitude/:long", function (request, result) {
  queries.getWeatherFromCoordinates(request.params.lat, request.params.long)
    .then(data => result.render("weather", {data: data}));
});
