const Fix = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Fix-It Form");

function techTicket(e) {
  let namedValues = e.namedValues
  let cbAssetTag = namedValues["Lakers ****"][0];
  let verdict = namedValues["Verdict"][0];
  let techNotes = namedValues["Technician Notes"][0];
  let technician = namedValues["Email Address"][0];
  Logger.log(technician)
  // Logger.log(JSON.stringify(e))

  if (findDevice(cbAssetTag).annotatedAssetId.toString().includes('Faulty')) {
    if (verdict == "Cleared for Active Duty") {
      LGN.reserves(cbAssetTag, techNotes)
    } else {
      LGN.guillotine(cbAssetTag, technician, techNotes)
    }

    latestFirst(Fix)  
  } else {
    Logger.log(`Sorry, ${ACC.fullName(technician)}, ${cbAssetTag} was not in the Sick Bay, and that means you may not perform work on it.`)
    MAIL.error(ACC.fullName(technician) + ' attempted medical malfeasance: \"' + cbAssetTag + '\" was not in the Sick Bay, please re-check that you scanned the correct tag AND that it was labelled as Sick Bay (Faulty in the Annotated Asset Id)')
    }
}