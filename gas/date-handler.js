function dateToTwos(input) {
  let originalDate = new Date(new Date(input).setHours(12))
  let month = (originalDate.getMonth()+1).toString().padStart(2, 0)
  let day = originalDate.getDate().toString().padStart(2, 0)
  let year = originalDate.getFullYear().toString().slice(2)

  let newString = month + "/" + day + "/" + year 
  return newString
}

function getLastTime(Device) {
  let lastTime =
    Device.activeTimeRanges[Device.activeTimeRanges.length - 1].date +
    " at " +
    new Date(
      Device.activeTimeRanges[Device.activeTimeRanges.length - 1].activeTime
    ).toLocaleTimeString();
  return lastTime;
}

function getSY(date) {
  let longYear
  let dateToTest
  if (!date) {
    dateToTest = new Date(Date.now())
  } else {
    dateToTest = new Date(date)
  }

  let boSyDate = new Date(DatesSheet.createTextFinder('Beginning of Year').findNext().offset(0, 1).getValue())
  let eoSyDate = new Date(DatesSheet.createTextFinder('End of Year').findNext().offset(0, 1).getValue())

  if (dateToTest.getTime() < boSyDate.getTime() || dateToTest.getTime() >= eoSyDate.getTime()) {
    if (dateToTest.getMonth() >= 7) {
      longYear = dateToTest.getFullYear() + 1
    } else {
      longYear = dateToTest.getFullYear()
    }
  } else {
    longYear = eoSyDate.getFullYear()
  }
  let shortYear = longYear.toString().substring(2, 4)
  return shortYear
}


function checkHoliday(date) {
  let Holidays = SpreadsheetApp.getActive().getSheetByName('Holidays')
  let input = new Date(date)
  input.setHours(12)
  if (input.getDay() == 6) {
    input.setDate(input.getDate() + 2)
    checkHoliday(input)
  } else if (input.getDay() == 0) {
    input.setDate(input.getDate() + 1)
    checkHoliday(input)
  }

  input = input.getTime()

  let rows = Holidays.getRange(2, 1, Holidays.getLastRow() - 1, 2).getValues()
  for (let row = 0; row < rows.length; row++) {
    if (rows[row][1] !== "") {
      rows[row] = getDaysArray(rows[row])
    } else {
      let fixedH1 = new Date(rows[row][0]).setHours(12)
      rows[row][0] = new Date(fixedH1).getTime()
      rows[row].length = 1
    }
  }

  for (let row = 0; row < rows.length; row++) {
    if (rows[row].flat().includes(input)) {
      let h2 = new Date(rows[row].flat()[rows[row].length - 1])
      h2.setDate(h2.getDate() + 1)
      return checkHoliday(h2)
    }
  }

  return dateToTwos(input)
}

function getDaysArray([start, end]) {
  for (var arr = [], dt = new Date(new Date(start).setHours(12)); dt <= new Date(new Date(end).setHours(12)); dt.setDate(dt.getDate() + 1)) {
    arr.push(new Date(dt).getTime());
  }
  return arr;
};
