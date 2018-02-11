import React, { Component } from 'react';
import { Redirect } from 'react-router-dom';

class Home extends Component {
  constructor(props){
    super(props);
    this.state = {
      latitude: 0,
      longitude: 0,
      geolocOK:false
    };
  }

  storeData(key, value){
    try {
      localStorage.setItem(key, value);
      return true; // All went well
    } catch (error) {
      console.warn("something wrong happened", error);
      return false; // An error occured
    }
  }

  success = (pos) => {
    const crd = pos.coords;
    this.storeData("latitude", crd.latitude);
    this.storeData("longitude", crd.longitude);
    this.setState({
      latitude: crd.latitude,
      longitude: crd.longitude,
      geolocOK: true
    });
  };

  error(err){
    console.warn("ERROR(" + err.code + "): " + err.message);
    document.getElementById("message").innerHTML = "Erreur. Voici le message.<br />Code erreur : " + err.code + "<br />Message : " + err.message + "<br /> Cliquez ici pour ré-essayer : <a href=\"https://bikeorcar.herokuapp.com\">https://bikeorcar.herokuapp.com</a><br />Sur iPhone, la géolocalisation s'active en allant dans Réglages / Confidentialité / Service de localisation / Safari";
  }

  componentDidMount(){
    const options = {
      enableHighAccuracy: true,
      timeout: 30000, // 30 sec
      maximumAge: 2628000000 //1 month
    };

    navigator.geolocation.getCurrentPosition(this.success, this.error, options);
  }

  render(){
    if(this.state.geolocOK){
      const route = `/findCity`;
      return(
        <Redirect to={route}></Redirect>
      );
    } else {
      return(
        <div className="container-fluid col-10 offset-1">
          <div className="alert alert-primary" role="alert" id="message">
            Géolocalisation en cours... pour récupérer les prévisions météo du lieu où vous êtes<br />
            Merci d'autoriser la géolocalisation dans votre navigateur
          </div>
          <p>Bike or Car? Va vous aider tous les jours à décider si vous voulez aller travailler en vélo ou en voiture, en analysant :</p>
              <ul>
                <li>la pluie</li>
                <li>la température</li>
                <li>la neige</li>
                <li>le vent</li>
              </ul>
          <p>Chaque matin, un petit coup d'oeil à l'application.</p>
          <p>Aller au travail en vélo sera toujours un plaisir. Pas de galère, pas de surprise.</p>
        </div>
      )
    }
  }
}

export default Home;
