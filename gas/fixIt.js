const Fix = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Fix-It Form");

function techTicket(e) {
  let namedValues = e.namedValues;
  let cbAssetTag = namedValues["Lakers ****"][0];
  let verdict = namedValues["Verdict"][0];
  let techNotes = namedValues["Technician Notes"][0];
  let technician = namedValues["Email Address"][0];
  let timestamp = namedValues["Timestamp"][0];
  let device = findDevice(cbAssetTag);
  if (device.toString().includes(' was not found')) {
    MAIL.error(`${cbAssetTag} was not found`);
    return;
  }
  // Logger.log(technician);
  // Logger.log(JSON.stringify(e))

  if (device?.annotatedAssetId.toString().includes("Faulty")) {
    if (verdict == "Cleared for Active Duty") {
      LGN.reserves(cbAssetTag, techNotes);
      let transaction = new Txn(technician, "Device Fixed", timestamp, cbAssetTag)
      transaction.commit()
    } else {
      LGN.guillotine(cbAssetTag, technician, techNotes);
      let transaction = new Txn(technician, "Device Retired", timestamp, cbAssetTag)
      transaction.commit()
    }

    latestFirst(Fix);
  } else {
    Logger.log(
      `Sorry, ${ACC.fullName(
        technician
      )}, ${cbAssetTag} was not in the Sick Bay, and that means you may not perform work on it.`
    );
    MAIL.error(
      ACC.fullName(technician) +
        ' attempted medical malfeasance: "' +
        cbAssetTag +
        '" was not in the Sick Bay, please re-check that you scanned the correct tag AND that it was labelled as Sick Bay (Faulty in the Annotated Asset Id)'
    );
    let transaction = new Txn(technician, "Medical Malfeasance", timestamp, cbAssetTag)
    transaction.commit()
  }
}
