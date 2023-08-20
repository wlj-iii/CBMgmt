function manualMissing(e) {
    let namedValues = e.namedValues
    let cbAssetTag = namedValues["Lakers ****"][0];

    LGN.missing(cbAssetTag)    
}