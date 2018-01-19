const wundergroundId = process.env.REACT_APP_wundergroundId;

function getWeatherForecastFromCoordinates(latitude, longitude, morning, afternoon){
  return fetch(`https://api.wunderground.com/api/${wundergroundId}/hourly10day/lang:FR/q/${latitude},${longitude}.json`)
  .then(response => response.json())
  .then(returnedData => returnedData.hourly_forecast)
  .catch(error => {
    console.warn("Error while getting forecasts from Wunderground : " + error);
  });
}

export default getWeatherForecastFromCoordinates;
