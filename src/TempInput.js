import React from 'react';

function TempInput(props) {
  return (
    <tbody>
      <tr>
        <td className="form-group">Température min</td>
        <td>
          <select className="form-control input" id="min" defaultValue={props.min} onChange={() => props.handleInputTempMin(document.getElementById("min").value)}>
            {displayMin(props.min)}
          </select>
        </td>
      </tr>
      <tr>
        <td className="form-group">Température max</td>
        <td>
          <select className="form-control input" id="max" defaultValue={props.max} onChange={() => props.handleInputTempMax(document.getElementById("max").value)}>
            {displayMax(props.max)}
          </select>
        </td>
      </tr>
    </tbody>
  )
}

function displayMin(selected){
  return [-10, -2, -1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((temp, index) => {
      return(
        <option value={temp} key={index}>{temp}°</option>
      )
  })
}

function displayMax(selected){
  return [23, 24, 25, 26, 27, 28, 29, 30, 50].map((temp, index) => {
    return(
      <option value={temp} key={index}>{temp}°</option>
    )
  })
}

export default TempInput;
