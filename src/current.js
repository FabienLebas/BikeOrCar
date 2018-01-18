const wundergroundId = process.env.REACT_APP_wundergroundId;

function getCurrentWeatherFromCoordinates(latitude, longitude){
  return fetch(`https://api.wunderground.com/api/${wundergroundId}/conditions/lang:FR/q/${latitude},${longitude}.json`)
  .then(response => response.json())
  .then(returnedData => returnedData.current_observation)
  .catch(error => {
    console.warn("Error while getting current weather from Wunderground : " + error);
  });
}

export default getCurrentWeatherFromCoordinates;
