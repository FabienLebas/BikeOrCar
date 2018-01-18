import React, { Component } from 'react';
import './App.css';
import getWeatherForecastFromCoordinates from './forecast.js';
import getCurrentWeatherFromCoordinates from './current.js'
import HoursInput from './HoursInput.js';
import TempInput from './TempInput.js';

class Weather extends Component {
  constructor(props){
    super(props);
    this.state = {
      morning: "8",
      afternoon: "18",
      tempmin: 3,
      tempmax: 27,
      current: "Loading current weather",
      forecast: "Loading weather forecast"
    }
  }

  handleInputMorning = (input) => {
    this.setState({
      ...this.state,
      morning: input
    });
  }

  handleInputAfternoon = (input) => {
    this.setState({
      ...this.state,
      afternoon: input
    });
  }

  handleInputTempMin = (input) => {
    this.setState({
      ...this.state,
      tempmin: input
    });
  }

  handleInputTempMax = (input) => {
    this.setState({
      ...this.state,
      tempmax:input
    });
  }

  componentDidMount(){
    getCurrentWeatherFromCoordinates(this.props.match.params.latitude, this.props.match.params.longitude)
      .then(currentWeather => {
        this.setState({
          ...this.state,
          current: currentWeather
        })
      })
    getWeatherForecastFromCoordinates(this.props.match.params.latitude, this.props.match.params.longitude, this.state.morning, this.state.afternoon)
      .then(forecastResult => {
        this.setState({
          ...this.state,
          forecast: forecastResult
        })
      });
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
    if(this.state.forecast === "Loading weather forecast"){
      return(
        <tr><td>{this.state.forecast}</td></tr>
      )
    } else {
      let result = this.filterHours(this.state.forecast);
      result = this.removeLastDayIfNotFull(result);
      result = this.removeFirstDayIfNotFull(result);
      return this.daysInside(result).map((dayNumber, index) => {
        const currentDay = this.filter1Day(dayNumber, result);
        return this.displayRow(this.tomorrowOrToday(currentDay[0].FCTTIME.weekday_name), currentDay[0].temp.metric, currentDay[0].icon_url, currentDay[1].temp.metric, currentDay[1].icon_url, this.decideIfBike(currentDay[0], currentDay[1]), index);
      }
      )
    }
  }

  decideIfBike(dataMorning, dataAfternoon){
    if(dataMorning.fctcode < 8 &&
       dataAfternoon.fctcode < 8 &&
       parseInt(dataMorning.temp.metric) >= this.state.tempmin &&
       parseInt(dataAfternoon.temp.metric) >=this.state.tempmin &&
       parseInt(dataMorning.temp.metric) <= this.state.tempmax &&
       parseInt(dataAfternoon.temp.metric) <= this.state.tempmax
      ){
      return "http://www.atelierjespers.com/images/pharrell%20williams%20-%20velo%20bleu.jpg";
    }
    return "http://www2.mes-coloriages-preferes.biz/colorino/Images/Large/Vehicules-Voiture-MINI-110563.png";
  }

  displayWindDirection(direction){

  }

  render() {
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
          <p className="text-center">{this.state.current.weather}, vent {Math.round(this.state.current.wind_kph)} km/h de {this.state.current.wind_dir}</p>
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

export default Weather;
