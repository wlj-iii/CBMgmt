function checkOut(e) {
    let namedValues = e.namedValues
    let asgnMail = namedValues["Lakers Email"][0];
    let cbAssetTag = namedValues["Lakers ****"][0];
    let hsAssetTag = namedValues["Lakers ATT###"][0];
    let devicesOut = namedValues["Outbound Items"][0].split(", ");
    let shortDue = namedValues["Due By"][0];
    let customDue = namedValues["Due Date"][0];
    let asgnUser = AdminDirectory.Users.get(asgnMail)
    let asgnOrgU = asgnUser.orgUnitPath
    let today = new Date()
    let finalDue
    switch (shortDue) {
        case 'End of Year':
            if (asgnOrgU.includes(`${20}${getSY()}`)) {
                finalDue = DatesSheet.createTextFinder('Senior EOY').findNext().offset(0, 1).getValue()
            } else {        
                finalDue = DatesSheet.createTextFinder('End of Year').findNext().offset(0, 1).getValue()
            }
            break;
        case 'Tomorrow':
            let tomorrow = new Date().setDate(today.getDate() + 1)
            finalDue = checkHoliday(tomorrow)
            break;
        case 'Today':
            finalDue = today.toISOString().substring(0, 10);
            break;
        case 'OTHER':
            finalDue = checkHoliday(customDue)
            break;
        }
    Logger.log(`Final Due Date is ${finalDue}`)
    
    
    if (cbAssetTag !== "") {
        LGN.active(cbAssetTag, asgnMail, finalDue)
    }
};