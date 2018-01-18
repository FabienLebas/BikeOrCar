const googleAPIKey = process.env.REACT_APP_googleAPIKey;

function getCityName(latitude, longitude){
  return fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${googleAPIKey}`)
    .then(result => result.json())
    .then(returnedData => {
      const today = new Date();
      const formattedDate = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
      const result={
        city: filterCity(returnedData),
        country: returnedData.results[1].formatted_address.split(",")[1],
        date: formattedDate
      };
      return result;
    })
    .catch(error => {
      console.warn("Google API error : " + error);
    })
}

function filterCity(googleResult){
  return googleResult.results[0].address_components.filter(element => element.types[0] === "locality")[0].long_name;
}

export default getCityName;
