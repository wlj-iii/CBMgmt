// FOR DEV USE ONLY
/**
 * THIS CODE IS MEANT TO EASE SWITCHING BETWEEN ENVIRONMENTS
 * By which it is meant to copy the files labelled ' - Dev' to the Stage folder in GDrive
 * Or vice versa, and when things are certain, it can also be used to do the same for Prod.
 */

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