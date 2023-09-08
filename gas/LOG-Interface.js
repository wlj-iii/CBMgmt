const LogSheet = SpreadsheetApp.getActive().getSheetByName("LOGSHEET");

class Txn {
  constructor(who, what, when, toWhat) {
    this.whodunnit = who.toString();
    this.txnType = what.toString();
    this.items = engMultiples(toWhat);
    this.timestamp = new Date(when);
    this.invoiceSent = false;
  }

  commit() {
    let txnRow = []
    let logTimeFormat = ["YYYY/MM/DD HH:mm:ss.sss"];
    txnRow[findHeader("Actor", LogSheet) - 1] = this.whodunnit
    txnRow[findHeader("Transaction Type", LogSheet) - 1] = this.txnType
    txnRow[findHeader("Items", LogSheet) - 1] = this.items
    txnRow[findHeader("Charged?", LogSheet) - 1] = this.invoiceSent
    txnRow[findHeader("DateTime", LogSheet) - 1] = this.timestamp
    LogSheet.appendRow(txnRow).moveRows(LogSheet.getRange(LogSheet.getLastRow(), 1, 1, 1), 2)
    LogSheet.getRange(1, findHeader("DateTime", LogSheet), LogSheet.getLastRow(), 1).setNumberFormat(logTimeFormat);
    LogSheet.getRange(2, findHeader("Charged?", LogSheet), LogSheet.getLastRow(), 1).insertCheckboxes()
  }
}