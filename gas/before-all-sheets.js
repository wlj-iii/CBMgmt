const HouseRules = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("House Rules");
const Prices = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Pricing");
const SingleAccounts = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Student Accounts");
const BulkAccounts = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Bulk Accounts");
const Charges = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Charges");
const Parents = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Skyward Input");
const DatesSheet = SpreadsheetApp.getActive().getSheetByName('Speed Dating');
const Secretaries = SpreadsheetApp.openById("1r1TpiQxqGvsMmyTEi8vW4eSRs9tsG8X2rMdVvMo2XPo").getSheetByName("Tech Charges"); // Our Secretaries maintain their own lists, so this line grabs their external spreadsheet.


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

class DueTodayDone {
  constructor() {
    if (DueTodayDone.instance) return DueTodayDone.instance;

    this.timer = new Timer();
    this.timer.start();
    // this.threshold = (time in minutes before it auto-kills, anything below 28 is safe for enterprise accounts, or below 4 for regular users) * 60 * 1000;
    this.limit = 2 * 60 * 1000;

    DueTodayDone.instance = this;
    return DueTodayDone.instance;
  }
}