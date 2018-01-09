const fetch = require("node-fetch");
const fs = require("fs");
const translations = JSON.parse(fs.readFileSync("./translations.json"));
const language = "fr"; //temporaire
const openWeatherId = process.env.openWeatherId;
const wundergroundId = process.env.wundergroundId;
const googleAPIKey = process.env.googleAPIKey;
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
        date: selectedTimes[i].day,
        morningBike: selectedTimes[i].bikeDecision,
        morningExplanation: selectedTimes[i].bikeExplanation,
        morningTemp: selectedTimes[i].temp,
        morningIcon: selectedTimes[i].icon,
        eveningBike: selectedTimes[i+1].bikeDecision,
        eveningExplanation: selectedTimes[i+1].bikeExplanation,
        eveningTemp: selectedTimes[i+1].temp,
        eveningIcon: selectedTimes[i+1].icon
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
      morningTemp: object.morningTemp,
      morningIcon: object.morningIcon,
      eveningBike: object.eveningBike,
      eveningExplanation: object.eveningExplanation,
      eveningTemp: object.eveningTemp,
      eveningIcon: object.eveningIcon
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
              }
              client.end();
            }
          );
        }
      }
    }
  );
}

function convertWindDegreesToText(degrees){
  const text = ["Nord", "Nord-Est", "Est", "Sud-Est", "Sud", "Sud-Ouest", "Ouest", "Nord-Ouest"];
  return text[Math.round(degrees / 45) % 8];
}

function getTodayWeather(latitude, longitude){
  return fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&units=metric&lang=fr&APPID=${openWeatherId}`)
    .then(response => response.json())
    .then(returnedData => {
      const result = {
        weather: returnedData.weather[0],
        temperature: Math.round(returnedData.main.temp),
        windSpeed:Math.round(returnedData.wind.speed),
        windDirection: convertWindDegreesToText(returnedData.wind.deg)
      };
      return result;
    })
    .catch(error => {
      console.warn("Error while getting current weather:" + error);
    })
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
        description: object.weather[0].description,
        snow: Math.round(valueOr0(object.snow)*100)/100,
        temp: Math.round(object.main.temp)*10/10,
        wind: Math.round(object.wind.speed*100)/100,
        weatherId: object.weather[0].id,
        icon: `http://openweathermap.org/img/w/${object.weather[0].icon}.png`,
        bikeExplanation: "",
        bikeDecision: false,
        bike : function(dayParam){
        /*  if (userLimits.daysOff.find((number) => number === dayParam) !== undefined){
            this.bikeExplanation = "week-end";
          } else*/ if (userLimits.rain < this.rain){
            this.bikeExplanation = translations.rain[language] + ` - ${this.description}`;
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
      if (object2.hour === "08" || object2.hour === "18"){
        return object2;
      }
    });
    if (object.returnedTimes[0].hour === "18"){// if it's already afternoon, you already took your decision
      object.returnedTimes.splice(0,1);
    }
    if (object.returnedTimes[object.returnedTimes.length - 1].hour === "08"){//21 not yet in the forecast
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

function getCityName(latitude, longitude){
  return fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${googleAPIKey}`)
    .then(result => result.json())
    .then(returnedData => {
      const today = new Date();
      const formattedDate = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
      const result={
        city: returnedData.results[1].address_components[0].long_name,
        country: returnedData.results[1].formatted_address.split(",")[1],
        date: formattedDate
      };
      return result;
    })
    .then(location => {
      addToDatabaseLogs(location.city, location.country, location.date);
      return location.city;
    })
    .catch(error => {
      console.warn("Google API error : " + error);
    })
}

function getWeatherFromCoordinatesWunderground(latitude, longitude){
  return fetch(`https://api.wunderground.com/api/${wundergroundId}/hourly10day/lang:FR/q/${latitude},${longitude}.json`)
  .then(response => response.json())
  .then(returnedData => {
    const returnedTimes = returnedData.hourly_forecast.map(object => {
      const resultMap = {
    //    time: object.FCTTIME.hour,
        date: `${object.FCTTIME.year}-${object.FCTTIME.mon}-${object.FCTTIME.mday}`,
        day: object.FCTTIME.weekday_name,
        hour: object.FCTTIME.hour_padded,
        rain: object.qpf.metric,
        description: object.condition,
        snow: object.snow.metric,
        temp: object.temp.metric,
        wind: object.wspd.metric,
        fctcode: object.fctcode,
        icon: object.icon_url,
        bikeExplanation: "",
        bikeDecision: false,
        bike : function(dayParam){
          /*  if (userLimits.daysOff.find((number) => number === dayParam) !== undefined){
              this.bikeExplanation = "week-end";
            } else if (userLimits.rain < this.rain){
              this.bikeExplanation = translations.rain[language] + ` - ${this.description}`;
            } else if (userLimits.snow < this.snow){
              this.bikeExplanation = translations.snow[language] + ` ${this.snow}mm`;
            } else if (userLimits.wind < this.wind){
              this.bikeExplanation = translations.tooMuchWind[language] + ` ${this.wind}km/h`;
            } else if (userLimits.temp > this.temp){
              this.bikeExplanation = translations.tooCold[language] + ` ${this.temp}°C`
            }*/
            if(this.fctcode > 8 || this.temp < userLimits.temp) {
              this.bikeDecision = false;
            }
             else{
            this.bikeDecision = true;
            this.bikeExplanation = "OK";
          }
          }
        };
      return resultMap;
    });
    const returnedObject = {
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
  // .then(object => {
  //   object.returnedTimes = replaceDatesByDayText(object.returnedTimes, language);
  //   return object;
  // })
}

module.exports = {
  valueOr0: valueOr0,
  groupByDate: groupByDate,
  replaceDatesByDayText: replaceDatesByDayText,
  addToDatabaseLogs: addToDatabaseLogs,
  getTodayWeather: getTodayWeather,
  getWeatherFromCoordinates: getWeatherFromCoordinates,
  getCityName:getCityName,
  getWeatherFromCoordinatesWunderground:getWeatherFromCoordinatesWunderground
};
