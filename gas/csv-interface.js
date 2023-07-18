function parseAndLog() {
  Logger.log("Good CSV Parse? - " + csvParser());
}

function csvParser() {
  try {
    // Gets the destination sheet of the current spreadsheet.
    let sheet =
      SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Skyward Input");

    // Gets CSV file by ID
    let inFil = DriveApp.getFoldersByName("Incoming Files")
      .next()
      .getFilesByName("sftp")
      .next()
      .getTargetId();
    let csvFile = DriveApp.getFolderById(inFil)
      .getFilesByName("Guardian1.csv")
      .next();
    // Logger.log(csvFile)

    // Parses CSV file into data array.
    let data = Utilities.parseCsv(csvFile.getBlob().getDataAsString());

    // Removes header row from incoming data
    data.splice(0, 1);

    // Removes duplicates from incoming data
    data.sort(csvSortCol1);
    for (let i = data.length - 1; i > 0; i--) {
      if (data[i][0] == data[i - 1][0]) {
        data.splice(i, 1);
      }
    }

    // Determines the incoming data size (after filtering)
    let numRows = data.length;
    let numColumns = data[0].length;

    // Appends data into the sheet.
    sheet.setFrozenRows(0);
    sheet.deleteRows(2, sheet.getMaxRows() - 1);
    sheet.insertRowsAfter(1, numRows);
    sheet
      .getRange(2, 1, numRows, numColumns)
      .setValues(data)
      .clearFormat()
      .setHorizontalAlignment("left");

    sheet.setFrozenRows(1);

    return true; // Success.
  } catch (e) {
    return e; // Failure. Checks for CSV data file error.
  }
}

function csvSortCol1(a, b) {
  if (a[0] == b[0]) {
    return 0;
  } else {
    return a[0] < b[0] ? -1 : 1;
  }
}
