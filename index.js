const request = require("request");
const fetch = require("node-fetch");
const fs = require("fs");
const express = require("express");
const app = express();
const coordinates = require("./coordinates");

const translations = JSON.parse(fs.readFileSync("./translations.json"));
const language = "fr"; //temporaire
const appId = process.env.appId;

const port = process.env.PORT || 3000;

app.listen(port, function () {
  console.log("Server listening on port:" + port);
});

app.use(express.static('./'));

app.get("/", function (request, result) {
  result.send(`
    <!doctype html>
    <html lang="en">
    <head>
      <title>Bike or Car?</title>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
      <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/4.0.0-beta.2/css/bootstrap.min.css" integrity="sha384-PsH8R72JQ3SOdhVi3uxftmaW6Vc51MKb0q5P2rRUpPvrszuE4W1povHYgTpBfshb" crossorigin="anonymous">
      </head>
    <body>
      <p class="lead text-dark">Checking your coordinates to find your weather forecasts<br />
        You should be redirected soon. Please authorize your geolocation from your browser.
      </p>

      <script>
      var options = {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
      };
      function success(pos) {
        const crd = pos.coords;

        console.log('Votre position actuelle est :');
        console.log("Latitude :" + crd.latitude);
        console.log("Longitude:" + crd.longitude);
        window.location.href = "http://localhost:3000/latitude/" + crd.latitude + "/longitude/" + crd.longitude;
      };

      function error(err) {
        console.warn("ERROR(" + err.code + "): " + err.message);
      };
        navigator.geolocation.getCurrentPosition(success, error, options);

      </script>
      <script src="https://code.jquery.com/jquery-3.2.1.slim.min.js" integrity="sha384-KJ3o2DKtIkvYIK3UENzmM7KCkRr/rE9/Qpg6aAZGJwFDMVNA/GpGFF93hXpG5KkN" crossorigin="anonymous"></script>
      <script src="https://cdnjs.cloudflare.com/ajax/libs/popper.js/1.12.3/umd/popper.min.js" integrity="sha384-vFJXuSJphROIrBnz7yo7oB41mKfc8JzQZiCq4NCceLEaO4IHwicKwpJf9c9IpFgh" crossorigin="anonymous"></script>
      <script src="https://maxcdn.bootstrapcdn.com/bootstrap/4.0.0-beta.2/js/bootstrap.min.js" integrity="sha384-alpBpkh1PFOepccYVYDB4do5UnbKysX5WZXm3XxPqe5iKTfUKjNkCk9SaVuEZflJ" crossorigin="anonymous"></script>
    </body>
    </html>
    `);
});

app.get("/latitude/:lat/longitude/:long", function (request, result) {
  console.log(`https://api.openweathermap.org/data/2.5/forecast?lat=${request.params.lat}&lon=${request.params.long}&unit=metrics&lang=fr&APPID=${appId}`);
  fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${request.params.lat}&lon=${request.params.long}&unit=metrics&lang=fr&APPID=${appId}`)
  .then(response => response.json())
  .then(returnedData => {
    const returnedTimes = returnedData.list.map(object => {
      const resultMap = {
      time: object.dt_txt,
      date: object.dt_txt.split(" ")[0],
      day: (new Date(object.dt_txt.split(" ")[0])).getDay(),
      hour: object.dt_txt.split(" ")[1].split(":")[0],
      rain: Math.round(valueOr0(object.rain)*100)/100,
      snow: Math.round(valueOr0(object.snow)*100)/100,
      temp: Math.round(object.main.temp - 273.15)*10/10,
      wind: Math.round(object.wind.speed*100)/100,
      bikeExplanation: "",
      bikeDecision: false,
      bike : function(dayParam){
        if (userLimits.daysOff.find((number) => number === dayParam) !== undefined){
          this.bikeExplanation = "week-end";
        } else if (userLimits.rain < this.rain){
          this.bikeExplanation = translations.rain[language] + ` ${this.rain}mm`;
        } else if (userLimits.snow < this.snow){
          this.bikeExplanation = translations.snow[language] + ` ${this.snow}mm`;
        } else if (userLimits.wind < this.wind){
          this.bikeExplanation = translations.tooMuchWind[language] + ` ${this.wind}km/h`;
        } else if (userLimits.temp < this.temp){
          this.bikeExplanation = translations.tooCold[language] + ` ${this.temp}°C`
        } else{
          this.bikeDecision = true;
        }
        }
      };
      return resultMap;
    });
    const returnedObject = {
        city: returnedData.city.name,
        returnedTimes: returnedTimes
    };
    return returnedObject;
  })
  .then(object => {
    object.returnedTimes.forEach((object2) => {
      object2.bike(object2.day);
    });
    return object;
  })
  .then(object => {
    object.returnedTimes = object.returnedTimes.filter((object2) => {
      if (object2.hour === "09" || object2.hour === "21"){
        return object2;
      }
    });
    if (object.returnedTimes[0].hour === "21"){// if it's already afternoon, you already took your decision
      object.returnedTimes.splice(0,1);
    }
    if (object.returnedTimes[object.returnedTimes.length - 1].hour === "09"){//21 not yet in the forecast
      object.returnedTimes.pop();
    }
    return object;
  })
  .then(object => {
    object.returnedTimes = groupByDate(object.returnedTimes);
    return object;
  })
  .then(object => {
    object.returnedTimes = replaceDatesByDayText(object.returnedTimes, language);
    return object;
  })
  .then(object => {
    result.send(`
      <!doctype html>
      <head>
        <title>Bike or Car?</title>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
        <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/4.0.0-beta.2/css/bootstrap.min.css" integrity="sha384-PsH8R72JQ3SOdhVi3uxftmaW6Vc51MKb0q5P2rRUpPvrszuE4W1povHYgTpBfshb" crossorigin="anonymous">
        <style>
          .jumbotron{
            background-color: white;
          }
        </style>
      </head>
        <body>
          <div class="jumbotron jumbotron-fluid">
            <div class="container">
            <div class="container col-4 offset-8">
              <form>
                <div class="form-row">
                  <div>
                    <input type="text" class="form-control" placeholder="Ville" id="newCity">
                  </div>
                  <button type="button" class="btn btn-primary" id="go">Changer de ville</button>
                </div>
              </form>
            </div>
              <h1 class="display-3">${object.city}</h1>
              <div class="card-group col-8">${displayCards(object.returnedTimes)}</div>
            </div>
          </div>


          <script src="https://code.jquery.com/jquery-3.2.1.slim.min.js" integrity="sha384-KJ3o2DKtIkvYIK3UENzmM7KCkRr/rE9/Qpg6aAZGJwFDMVNA/GpGFF93hXpG5KkN" crossorigin="anonymous"></script>
          <script src="https://cdnjs.cloudflare.com/ajax/libs/popper.js/1.12.3/umd/popper.min.js" integrity="sha384-vFJXuSJphROIrBnz7yo7oB41mKfc8JzQZiCq4NCceLEaO4IHwicKwpJf9c9IpFgh" crossorigin="anonymous"></script>
          <script src="https://maxcdn.bootstrapcdn.com/bootstrap/4.0.0-beta.2/js/bootstrap.min.js" integrity="sha384-alpBpkh1PFOepccYVYDB4do5UnbKysX5WZXm3XxPqe5iKTfUKjNkCk9SaVuEZflJ" crossorigin="anonymous"></script>
        </body>
   </html>
     `);
  })
  .catch(error => {
    console.log(error);
    })
  ;
})

function displayCards(daysData){
  let result ="";
  daysData.forEach(day => {
    if(day.morningBike === day.eveningBike && day.morningBike === true){
      result += `<div class="card">
                  <img class="card-img-top" src="/images/veloMatin.gif" alt="Card image cap">
                  <div class="card-body">
                  <h4 class="card-title">${day.date}</h4>
                  <p class="card-text">Vélo</p>
                  <p class="card-text">${day.morningBike}</p>
                  <p class="card-text">${day.morningExplanation}</p>
                  <p class="card-text">${day.eveningBike}</p>
                  <p class="card-text">${day.eveningExplanation}</p>
                  </div>
                </div>`;
    } else {
      result += `<div class="card">
                  <img class="card-img-top" src="/images/pluiePneu.gif" alt="Card image cap">
                  <div class="card-body">
                  <h4 class="card-title">${day.date}</h4>
                  <p class="card-text">Voiture</p>
                  <p class="card-text">${day.morningBike}</p>
                  <p class="card-text">${day.morningExplanation}</p>
                  <p class="card-text">${day.eveningBike}</p>
                  <p class="card-text">${day.eveningExplanation}</p>
                  </div>
                </div>`;
    }
  });
  return result;
}



function getWeatherFromCoordinates(latitude, longitude){
  return fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${latitude}&lon=${longitude}&unit=metrics&lang=fr&APPID=${appId}`)
  .then(response => response.json())
  .then(returnedData => {
    const language = "fr";
    let returnedTimes = returnedData.list.map((object) => {
        return {
          time: object.dt_txt,
          date: object.dt_txt.split(" ")[0],
          day: (new Date(object.dt_txt.split(" ")[0])).getDay(),
          hour: object.dt_txt.split(" ")[1].split(":")[0],
          rain: Math.round(valueOr0(object.rain)*100)/100,
          snow: Math.round(valueOr0(object.snow)*100)/100,
          temp: Math.round(object.main.temp - 273.15)*10/10,
          wind: Math.round(object.wind.speed*100)/100,
          bikeExplanation: "",
          bikeDecision: false,
          bike : function(dayParam){
            if (userLimits.daysOff.find((number) => number === dayParam) !== undefined){
              this.bikeExplanation = "week-end";
            } else if (userLimits.rain < this.rain){
              this.bikeExplanation = translations.rain[language] + ` ${this.rain}mm`;
            } else if (userLimits.snow < this.snow){
              this.bikeExplanation = translations.snow[language] + ` ${this.snow}mm`;
            } else if (userLimits.wind < this.wind){
              this.bikeExplanation = translations.tooMuchWind[language] + ` ${this.wind}km/h`;
            } else if (userLimits.temp < this.temp){
              this.bikeExplanation = translations.tooCold[language] + ` ${this.temp}°C`
            } else{
              this.bikeDecision = true;
            }
          }
        };
    });
    returnedTimes.forEach((object) => {
      object.bike(object.day);
    })

    let selectedTimes = returnedTimes.filter((object) => {
      if (object.hour === "09" || object.hour === "21"){
        return object;
      }
    });
    if (selectedTimes[0].hour === "21"){// if it's already afternoon, you already took your decision
      selectedTimes.splice(0,1);
    }
    if (selectedTimes[selectedTimes.length - 1].hour === "09"){//21 not yet in the forecast
      selectedTimes.pop();
    }
    const groupedByDate = groupByDate(selectedTimes);
    const withDaysInText = replaceDatesByDayText(groupedByDate, language);
    return withDaysInText;
  })
  .catch(error => {
    app.send(`Error while calling Open Weather API \n${error}`);
  })
  ;
}


const userLimits = {
  rain: 0,
  snow: 0,
  temp: 3,
  wind: 50,
  daysOff: [0,6] //Sunday, Saturday
}

function valueOr0(object){
  if (object === undefined){
    return 0;
  } else if (object["3h"] === undefined){
    return 0;
  } else {
    return object["3h"];
  }
}

function groupByDate(selectedTimes){
  const result = [];
  for (let i = 0; i<selectedTimes.length; i = i+2){
      result.push({
        date: selectedTimes[i].date,
        morningBike: selectedTimes[i].bikeDecision,
        morningExplanation: selectedTimes[i].bikeExplanation,
        eveningBike: selectedTimes[i+1].bikeDecision,
        eveningExplanation: selectedTimes[i+1].bikeExplanation
      });
  }
  return result;
}

function replaceDatesByDayText(groupedArray, language){
  const days = JSON.parse(fs.readFileSync("./translations.json"));
  return groupedArray.map((object) => {
    return {
      date: days.daysOfTheWeek[new Date(object.date).getDay().toString()][language],
      morningBike: object.morningBike,
      morningExplanation: object.morningExplanation,
      eveningBike: object.eveningBike,
      eveningExplanation: object.eveningExplanation
    };
  });
}



module.exports = {
  valueOr0: valueOr0,
  groupByDate: groupByDate,
  displayDecisions: displayDecisions,
  replaceDatesByDayText: replaceDatesByDayText,
  getDataFromOpenWeather: getDataFromOpenWeather,
  app: app
};
