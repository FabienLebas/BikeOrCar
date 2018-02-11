function getWeatherForecastFromCoordinates(latitude, longitude){
  return fetch(`https://bike-or-car-server.herokuapp.com/getWeatherForecastFromCoordinates`, {
      headers: {
        "Content-Type": "application/json"
      },
      method: "POST",
      body: JSON.stringify({
        latitude: latitude,
        longitude: longitude
      }
      )
    })
  .then(response => response.json())
  .then(returnedData => JSON.parse(returnedData))
  .catch(error => {
    console.warn("Error while getting forecasts from Wunderground : " + error);
  });
}

export default getWeatherForecastFromCoordinates;
