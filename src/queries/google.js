function getCityName(latitude, longitude){
  return fetch(`https://bike-or-car-server.herokuapp.com/getCityName`, {
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
    .then(result => result.json())
    .then(result => JSON.parse(result))
    .catch(error => {
      console.warn("Google API error : " + error);
    })
}

export default getCityName;
