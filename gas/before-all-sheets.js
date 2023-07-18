const HouseRules = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("House Rules");
const Prices = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Pricing");
const SingleAccounts = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Student Accounts");
const BulkAccounts = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Bulk Accounts");
const Charges = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Charges");
const Parents = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Skyward Input");
const Secretaries = SpreadsheetApp.openById("1r1TpiQxqGvsMmyTEi8vW4eSRs9tsG8X2rMdVvMo2XPo").getActiveSheet();


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
