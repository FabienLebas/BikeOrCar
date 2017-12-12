# BikeOrCar
Is the weather good enough to go by bike or should I take my car?

`Bike Or Car` is still under construction. Be patient... Or contribute!

With `Bike Or Car`, you will be able to know when the weather is good enough to commute by bicycle, or when you would better use your car, or public transportation. There will be a mobile application and a website.

How does it work?
  - the program uses the Open Weather API, https://openweathermap.org/
  - it retrieves weather forecast for next 5 days
  - user can define his tolerance:
    - rain
    - snow
    - temperature
    - wind
    - and the days when he is off (week-end)

How can you currently use it?
  - download `git clone https://github.com/FabienLebas/BikeOrCar.git`
  - create a myKeys.js file with your Open Weather API key
    `const appId = "MY-KEY";
    module.exports appId; `
  - find your city code in the file here: http://bulk.openweathermap.org/sample/city.list.json.gz and change it in the URL called
  - adapt you personnal settings in the beginning of decision.js
  - you can now launch `node decision.js` in a terminal and know when you can take your bike!!!

Yes, it is not finished yet... but if you like the idea, come back in few weeks, or contribute to make if faster ;-)
