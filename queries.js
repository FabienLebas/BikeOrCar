const fetch = require("node-fetch");
const fs = require("fs");
const translations = JSON.parse(fs.readFileSync("./translations.json"));
const language = "fr"; //temporaire
const openWeatherId = process.env.appId;
const PG = require("pg");
const connectionString = process.env.DATABASE_URL;

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

function addToDatabaseLogs(city, country, date){
  const client = new PG.Client({
    connectionString: connectionString,
    ssl: true
  });
  client.connect();
  client.query(
    "SELECT number_of_connections FROM connections WHERE city = $1::text AND country = $2::text AND date = $3::date",
    [city, country, date],
    function(error, result) {
      if (error) {
        console.warn(error);
        client.end();
      } else {
        if (result.rows[0] === undefined) {
          client.query(
            "INSERT INTO connections (city, country, date, number_of_connections) VALUES ($1::text, $2::text, $3::date, 1)",
            [city, country, date],
            function(error2, result2){
              if(error2){
                console.warn(error2);
              } else {
                console.log("OK");
              }
              client.end();
            }
          );
        } else {
          client.query(
            "UPDATE connections SET number_of_connections = $4::integer WHERE city = $1::text AND country = $2::text AND date = $3::date",
            [city, country, date, result.rows[0].number_of_connections + 1],
            function(error2, result2){
              if(error2){
                console.warn(error2);
              } else {
                console.log("OK");
              }
              client.end();
            }
          );
        }
      }
    }
  );
}

function getWeatherFromCoordinates(latitude, longitude){
  return fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${latitude}&lon=${longitude}&units=metric&lang=fr&APPID=${openWeatherId}`)
  .then(response => response.json())
  .then(returnedData => {
    addToDatabaseLogs(returnedData.city.name, returnedData.city.country, returnedData.list[0].dt_txt.split(" ")[0]);
    return returnedData;
  })
  .then(returnedData => {
    const returnedTimes = returnedData.list.map(object => {
      const resultMap = {
      time: object.dt_txt,
      date: object.dt_txt.split(" ")[0],
      day: (new Date(object.dt_txt.split(" ")[0])).getDay(),
      hour: object.dt_txt.split(" ")[1].split(":")[0],
      rain: Math.round(valueOr0(object.rain)*100)/100,
      snow: Math.round(valueOr0(object.snow)*100)/100,
      temp: Math.round(object.main.temp)*10/10,
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
        } else if (userLimits.temp > this.temp){
          this.bikeExplanation = translations.tooCold[language] + ` ${this.temp}°C`
        } else{
          this.bikeDecision = true;
          this.bikeExplanation = "OK";
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
}

module.exports = {
  getWeatherFromCoordinates: getWeatherFromCoordinates
};
