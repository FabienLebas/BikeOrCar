import React, { Component } from 'react';
import { Redirect } from 'react-router-dom';
import getCityName from './queries/google';

class FindCity extends Component {
  constructor(props){
    super(props);
    this.state = {
      city: "",
      findCityOK: false
    };
  }

  componentDidMount(){
    getCityName(localStorage.getItem("latitude"), localStorage.getItem("longitude"))
      .then(result => {
        console.log(result);
        console.log("toto");
        this.setState({
          city: result.city,
          findCityOK: true
        });
      } )
  }

  render(){
    if(this.state.findCityOK){
      const route = `/${this.state.city}`;
      return(
        <Redirect to={route}></Redirect>
      );
    } else {
      return(
        <div className="container-fluid col-10 offset-1">
          <div className="alert alert-primary" role="alert" id="message">
            Géolocalisation en cours... pour récupérer les prévisions météo du lieu où vous êtes<br />
            Merci !
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

export default FindCity;
