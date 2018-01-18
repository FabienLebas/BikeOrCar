import React from 'react';

function HoursInput(props) {
  return (
      <tr>
        <td></td>
        <td></td>
        <td>
          <div className="form-group">
            <select className="form-control input" id="morning" defaultValue={props.morning}  onChange={() => props.handleInputMorning(document.getElementById("morning").value)}>
              {displayMorning(props.morning)}
            </select>
          </div>
        </td>
        <td>
          <div className="form-group">
            <select className="form-control input" id="afternoon" defaultValue={props.afternoon} onChange={() => props.handleInputAfternoon(document.getElementById("afternoon").value)}>
              {displayAfternoon(props.afternoon)}
            </select>
          </div>
        </td>
      </tr>
  )
}

function displayMorning(selected){
  return ["5", "6", "7", "8", "9", "10", "11", "12"].map((hour, index) => {
      return(
        <option value={hour} key={index}>{hour}h</option>
      )
  })
}

function displayAfternoon(selected){
  return ["13", "14", "15", "16", "17", "18", "19", "20", "21", "22", "23"].map((hour, index) => {
      return(
        <option value={hour} key={index}>{hour}h</option>
      )
  })
}

export default HoursInput;
