import React, { Component } from 'react';
import { Redirect } from 'react-router-dom';
import './App.css';
import getWeatherForecastFromCoordinates from './queries/forecast.js';
import getCurrentWeatherFromCoordinates from './queries/current.js'
import HoursInput from './HoursInput.js';
import TempInput from './TempInput.js';

class Weather extends Component {
  constructor(props){
    super(props);
    this.state = {
      morning: "8",
      afternoon: "18",
      tempmin: 0,
      tempmax: 30,
      current: "Loading current weather",
      forecast: "Loading weather forecast",
      loadedCurrent: false,
      loadedForecast: false,
      latitude:false,
      longitude:false
    }
  }

  handleInputMorning = (input) => {
    localStorage.setItem("inputMorning", input);
    this.setState({
      morning: input
    });
  }

  handleInputAfternoon = (input) => {
    localStorage.setItem("inputAfternoon", input);
    this.setState({
      afternoon: input
    });
  }

  handleInputTempMin = (input) => {
    localStorage.setItem("inputTempMin", input);
    this.setState({
      tempmin: input
    });
  }

  handleInputTempMax = (input) => {
    localStorage.setItem("inputTempMax", input);
    this.setState({
      tempmax:input
    });
  }

  componentWillMount(){
    if(localStorage.getItem("latitude") !== undefined && localStorage.getItem("longitude") !== undefined){
      this.setState({
        latitude: localStorage.getItem("latitude"),
        longitude: localStorage.getItem("longitude")
      })
    };

  }

  componentDidMount(){
    let morning = this.state.morning;
    let afternoon = this.state.afternoon;
    let tempmin = this.state.tempmin;
    let tempmax = this.state.tempmax;
    let current = this.state.current;

    Promise.all([getCurrentWeatherFromCoordinates(this.state.latitude, this.state.longitude), getWeatherForecastFromCoordinates(this.state.latitude, this.state.longitude)])
      .then(values => {
        if(localStorage.getItem("inputMorning") !== null){
          morning = localStorage.getItem("inputMorning");
        }

        if(localStorage.getItem("inputAfternoon") !== null){
          afternoon = localStorage.getItem("inputAfternoon");
        }

        if(localStorage.getItem("inputTempMin") !== null){
          tempmin = parseInt(localStorage.getItem("inputTempMin"), 10);
        }

        if(localStorage.getItem("inputTempMax") !== null){
          tempmax = parseInt(localStorage.getItem("inputTempMax"), 10);
        }

        return values;})
      .then(values => {
        this.setState({
          morning: morning,
          afternoon: afternoon,
          tempmin: tempmin,
          tempmax: tempmax,
          current: values[0],
          loadedCurrent: true,
          forecast: values[1],
          loadedForecast: true
        });
      })
  }

  filter1Day(dayNumber, forecast){
    return forecast.filter(element => element.FCTTIME.mday === dayNumber);
  }

  daysInside(forecast){
    const notUniques = forecast.map(element => element.FCTTIME.mday);
    let uniques = [];
    for (let i=0; i < notUniques.length; i++){
      if(!uniques.includes(notUniques[i])){
        uniques.push(notUniques[i]);
      }
    }
    return uniques;
  }

  displayRow(weekday_name, morningTemp, morningIcon, afternoonTemp, afternoonIcon, bikeIcon, id){
    return (
      <tr key={id}>
        <td>{weekday_name}</td>
        <td><img className="card-img-top decisionImage" src={bikeIcon} alt="Bike icon"/></td>
        <td>{morningTemp}°<br/>
            <img className="card-img-top icon" src={morningIcon} alt="Morning Weather icon" />
        </td>
        <td>{afternoonTemp}°<br/>
            <img className="card-img-top icon" src={afternoonIcon} alt="Afternoon Weather icon" />
        </td>
      </tr>
    )
  }

  filterHours(forecast){
    return forecast.filter(hourForecast => hourForecast.FCTTIME.hour === this.state.morning || hourForecast.FCTTIME.hour === this.state.afternoon );
  }

  removeLastDayIfNotFull(forecast){
    if(forecast[forecast.length - 1].FCTTIME.mday !== forecast[forecast.length - 2].FCTTIME.mday){
      forecast.pop();
    }
    return forecast;
  }

  removeFirstDayIfNotFull(forecast){
    if(forecast[0].FCTTIME.mday !== forecast[1].FCTTIME.mday){
      forecast.shift();
    }
    return forecast;
  }

  tomorrowOrToday(weekday){
    const today = new Date();
    const day = today.getDay();
    const testDays = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];
    if(weekday === testDays[day]){
      return "aujourd'hui";
    } else if (weekday === testDays[day + 1]){
      return "demain";
    } else {
    return weekday;
    }
  }

  displayForecast(){
      let result = this.filterHours(this.state.forecast);
      result = this.removeLastDayIfNotFull(result);
      result = this.removeFirstDayIfNotFull(result);
      return this.daysInside(result).map((dayNumber, index) => {
        const currentDay = this.filter1Day(dayNumber, result);
        if(index <= 1){
          return this.displayRow(this.tomorrowOrToday(currentDay[0].FCTTIME.weekday_name), currentDay[0].temp.metric, currentDay[0].icon_url, currentDay[1].temp.metric, currentDay[1].icon_url, this.decideIfBike(currentDay[0], currentDay[1]), index);
        } else {
          return this.displayRow(currentDay[0].FCTTIME.weekday_name, currentDay[0].temp.metric, currentDay[0].icon_url, currentDay[1].temp.metric, currentDay[1].icon_url, this.decideIfBike(currentDay[0], currentDay[1]), index);
        }
    })
  }

  decideIfBike(dataMorning, dataAfternoon){
    if(dataMorning.fctcode < 8 &&
       dataAfternoon.fctcode < 8 &&
       parseInt(dataMorning.temp.metric, 10) >= this.state.tempmin &&
       parseInt(dataAfternoon.temp.metric, 10) >=this.state.tempmin &&
       parseInt(dataMorning.temp.metric, 10) <= this.state.tempmax &&
       parseInt(dataAfternoon.temp.metric, 10) <= this.state.tempmax
      ){
      return "veloBleu.jpg";
    }
    return "voitureRouge.png";
  }

  displayWindDirection(wind_dir){
    const givenWinds=["East", "ENE", "ESE", "NE", "NNE", "NNW", "North", "NW", "SE", "South", "SSE", "SSW", "SW", "Variable", "West", "WNW", "WSW"];
    const targetWinds=["Est", "Est - Nord Est", "Est - Sud Est", "Nord Est", "Nord Nord Est", "Nord Nord Ouest", "Nord", "Nord Ouest", "Sud Est", "Sud", "Sud Sud Est", "Sud Sud Ouest", "Sud Ouest", "Variable", "Ouest", "Ouest Nord Ouest", "Ouest Sud Ouest"];
    if (givenWinds.findIndex(direction => direction === wind_dir) >= 0) {
      return targetWinds[givenWinds.findIndex(direction => direction === wind_dir)];
    } else {
      return wind_dir;
    }
  }

  render() {
    if(!this.state.latitude || !this.state.longitude){
      return(
        <Redirect to="/"></Redirect>
      )
    } else if(!this.state.loadedCurrent || !this.state.loadedForecast){
      return(
        <div className="App">
          <nav className="navbar navbar-dark bg-info">
            <a href="/whoweare.html">
              <span className="navbar-brand mb-0 h1">Bike or Car? <span className="beta">beta</span></span>
            </a>
            <a href="/">
              <i className="fa fa-refresh" aria-hidden="true"></i>
            </a>
          </nav>
        <div className="container jumbotron jumbotron-fluid">
          <h2 className="display-5 text-center font-weight-normal">Loading your forecast</h2>
        </div>
      </div>
      );} else {
        return (
        <div className="App">
          <nav className="navbar navbar-dark bg-info">
            <a href="/whoweare.html">
              <span className="navbar-brand mb-0 h1">Bike or Car? <span className="beta">beta</span></span>
            </a>
            <a href="/">
              <i className="fa fa-refresh" aria-hidden="true"></i>
            </a>
          </nav>
          <div className="container jumbotron jumbotron-fluid">
            <h2 className="display-5 text-center font-weight-normal">{this.props.match.params.city}</h2>
            <p className="text-center">{this.state.current.weather}, vent {Math.round(this.state.current.wind_kph)} km/h de {this.displayWindDirection(this.state.current.wind_dir)}</p>
            <h1 className="display-5 text-center font-weight-normal">{Math.round(this.state.current.temp_c)}°</h1>
          </div>
          <div className="container">
            <table className="table">
              <thead>
                  <HoursInput morning={this.state.morning} afternoon={this.state.afternoon} handleInputMorning={this.handleInputMorning} handleInputAfternoon={this.handleInputAfternoon}/>
              </thead>
              <tbody>
                {this.displayForecast()}
              </tbody>
            </table>
          </div>
          <hr/>
          <div className="container">
            <h2 className="display-5 text-center font-weight-normal">Paramètres</h2>
            <table>
                <TempInput min={this.state.tempmin} max={this.state.tempmax} handleInputTempMin={this.handleInputTempMin} handleInputTempMax={this.handleInputTempMax}/>
            </table>
          </div>

        </div>
      );
    }
  }
}

export default Weather;
