const MIA = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("MIA Form");

function manualMissing(e) {
    let namedValues = e.namedValues
    let cbAssetTag = namedValues["Lakers ****"][0];

    LGN.missing(cbAssetTag)  

    latestFirst(MIA)  
}