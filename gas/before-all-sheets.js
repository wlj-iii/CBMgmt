const ssId = SpreadsheetApp.getActive().getId()
const currentEnv = DriveApp.getFileById(ssId).getParents().next().getId()
const v3 = DriveApp.getFolderById(currentEnv).getParents().next().getId()

const HouseRules = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("House Rules");
const Prices = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Pricing");
const SingleAccounts = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Student Accounts");
const BulkAccounts = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Bulk Accounts");
const Charges = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Charges");
const Parents = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Skyward Input");
const DatesSheet = SpreadsheetApp.getActive().getSheetByName('Speed Dating');
const Secretaries = SpreadsheetApp.openById("1r1TpiQxqGvsMmyTEi8vW4eSRs9tsG8X2rMdVvMo2XPo").getActiveSheet(); // Our Secretaries maintain their own lists, so this line grabs their external spreadsheet.


function findHeader(q, sheet) {
  if (!sheet) {
      var Current = SpreadsheetApp.getActive().getActiveSheet()
  } else {
      var Current = sheet
  };
var header = Current.getRange(1, 1, 1, Current.getLastColumn())
  .createTextFinder(q)
  .findNext();
return header.getColumn();
}

function latestFirst(sheet) {
  SpreadsheetApp.setActiveSheet(sheet);
  let timeIndex = findHeader('Timestamp');
  sheet.sort(timeIndex, false);
};

function copySS2(envName) {
  let destFolder = DriveApp.getFolderById(v3).getFoldersByName(envName).next().getId()
  let destFileId = DriveApp.getFolderById(destFolder).getFilesByName(`CBMgmt - ${envName}`).next().getId()
  let destFile = SpreadsheetApp.openById(destFileId)

  let sheets = SpreadsheetApp.getActive().getSheets();
  for (let i = 0; i < sheets.length; i++) {
    let currSheet = sheets[i]
    let currShtName = currSheet.getName().toString();
    if (!currShtName.includes("Form")) {
      currSheet.copyTo(destFile)
    }
  }

  let newSheets = destFile.getSheets()
  for (let i = 0; i < newSheets.length; i++) {
    let currSheet = newSheets[i]
    let currShtName = currSheet.getName().toString();
    if (!currShtName.includes("Copy") && !currShtName.includes("Form")) {
      destFile.deleteSheet(currSheet)
    }
  }

  let filteredSheets = destFile.getSheets()
  for (let i = 0; i < filteredSheets.length; i++) {
    let currSheet = filteredSheets[i]
    let currName = currSheet.getSheetName().toString()
    let newName = currName.replace("Copy of ", "")
    currSheet.setName(newName)
  }
}

function copySS2Dev() {
  copySS2("Dev")
}
