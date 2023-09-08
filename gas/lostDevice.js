const MIA = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("MIA Form");

function manualMissing(e) {
    let namedValues = e.namedValues
    let cbAssetTag = namedValues["Lakers ****"][0];
    let flagger = namedValues["Email Address"][0];
    let timestamp = namedValues["Timestamp"][0];

    LGN.missing(cbAssetTag)

    let transaction = new Txn(flagger, "Manual Missing", timestamp, cbAssetTag)
    transaction.commit()

    latestFirst(MIA)  
}