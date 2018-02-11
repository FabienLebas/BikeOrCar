import React, { Component } from 'react';
import {
  BrowserRouter as Router,
  Route
} from 'react-router-dom';
import './App.css';
import Weather from './Weather';
import Home from './Home';
import FindCity from './FindCity';

class App extends Component {
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

  render() {
    return (
      <Router>
        <div className="App">
          <Route exact path="/" render={() => <Home />}/>
          <Route path="/findCity" render={() => <FindCity />}/>
          <Route path="/:city" render={(routerProps) => <Weather {...routerProps}/>}/>
        </div>
      </Router>
    );
  }
}

export default App;
