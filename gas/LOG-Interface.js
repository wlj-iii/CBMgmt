const LogSheet = SpreadsheetApp.getActive().getSheetByName("LOGSHEET");

const LOG = new (function () {
  this.addTxn = (message, type) => {
    let logTimeStamp = new Date()
    Logger.log(logTimeStamp);
    let logValues = [message, type, logTimeStamp];
    LogSheet.appendRow(logValues);
    let logTimeFormat = ["YYYY/MM/DD HH:mm:ss.sss"];
    LogSheet.getRange(LogSheet.getLastRow(), 3).setNumberFormat(logTimeFormat);
  };

  this.checkIn = (retUsr, annotUsr, assetTag) => {
    let message = `${retUsr} turned in ${annotUsr}\'s device: ${assetTag}`
    LOG.addTxn(message, 'checkIn');
  };
})();

function testLog() {
  LOG.addTxn('hello?', 'test')
}