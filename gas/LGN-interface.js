const ActiveDuty = SpreadsheetApp.getActive().getSheetByName('Active Duty');
const Reserves = SpreadsheetApp.getActive().getSheetByName('Reserves');
const SickBay = SpreadsheetApp.getActive().getSheetByName('Sick Bay');
const Boneyard = SpreadsheetApp.getActive().getSheetByName('Boneyard');
const MissingInAction = SpreadsheetApp.getActive().getSheetByName('MIA');
const inactiveOU = HouseRules.createTextFinder("Inactive OU").findNext().offset(0, 1).getValue();
const inactiveOuId = AdminDirectory.Orgunits.get("my_customer", inactiveOU.toString().slice(1)).orgUnitId
const formulas = [["=ArrayFormula(if(isblank($A$2:$A), \"\", split($A$2:$A, \" - \", false)))"]];

let legions = [ActiveDuty, Reserves, SickBay, Boneyard, MissingInAction];


const LGN = new (function () {
  const _removeDeviceLegion = (assetTag) => {
    for (let i = 0; i < legions.length; i++) {
      let found = legions[i].createTextFinder(assetTag).findAll()
      for (let j = 0; j < found.length; j++) {
        let asset = found[j].getRow();
        legions[i].deleteRows(asset, 1);
        if (asset = 2) {
          legions[i].getRange(2, 2, 1, 1).setFormula(formulas);
        }

      }
    }
  };

  const _setDeviceLegion = (cbAssetTag, LegionSheet) => {
    
    let device = findDevice(cbAssetTag)
    let dataRow = [device.annotatedAssetId]
    Logger.log("Moving " + dataRow[0] + " to " + LegionSheet.getName().toString())

    LegionSheet.appendRow(dataRow).getRange("B2:B").clear();
    LegionSheet.moveRows(LegionSheet.getRange(LegionSheet.getLastRow(), 1, 1, 1), 2)
    LegionSheet.getRange(2, 2, 1, 1).setFormula(formulas);
    if (LegionSheet == MissingInAction) {
      LegionSheet.getRange(2, 4, 1, 1).setValue(device.recentUsers[0].email);
    }
  }


  this.reserves = (cbAssetTag, explanation) => {
    let device = findDevice(cbAssetTag)
    let deviceName = device.annotatedAssetId.slice(0, 13) // 11 does not include the dash
    let deviceId = device.deviceId;
    // Logger.log("inactive = " + inactiveOuId);
    let newDevice = {
      "annotatedAssetId": `${deviceName} RESERVES`,
      "annotatedUser": "",
      "orgUnitPath": `${inactiveOU}`,
      "orgUnitId": `${inactiveOuId}`
    }

    if (explanation) {
      newDevice = {
        ...newDevice,
        notes: explanation
      }
    } else {
      newDevice = {
        ...newDevice,
        notes: 'No explanation given'
      }
    }

    try {
      AdminDirectory.Customer.Devices.Chromeos.issueCommand({ "commandType": "WIPE_USERS" }, "my_customer", device.deviceId)
    } catch (e) {
      Logger.log("Device probably already has pending wipe request, see below" + "\n" + e)
    }
    if (device.status === "ACTIVE") {
      AdminDirectory.Chromeosdevices.action({"action": "disable"},"my_customer", deviceId)
    };
    deviceName = AdminDirectory.Chromeosdevices.patch(newDevice, "my_customer", deviceId).annotatedAssetId.slice(0, 11)

    _removeDeviceLegion(deviceName.slice(0, 11));

    _setDeviceLegion(deviceName, Reserves);
  };

  this.missing = (cbAssetTag) => {
    let device = findDevice(cbAssetTag)
    let deviceName = device.annotatedAssetId.slice(0, 13) // 13 includes the dash
    let deviceId = device.deviceId;
    let dateMissing = new Date().toLocaleDateString();
    let lastAsgn = device.annotatedUser || "none found";
    let lastUser = device.recentUsers[0].email;
    let lastUsed = getLastTime(device)
    let newDevice = {
      "annotatedAssetId": `${deviceName} Marked AWOL ${dateMissing}`,
      "orgUnitPath": `${inactiveOU}`,
      "orgUnitId": `${inactiveOuId}`,
      "notes": `Last assigned to ${lastAsgn}` + '\u000D' + `Last used by ${lastUser} on ${lastUsed}`
    }
    
    // The line below would wipe devices when missing if enabled. Currently not for "hey I lost my-" 10 minutes later "found it"
    // AdminDirectory.Customer.Devices.Chromeos.issueCommand({ "commandType": "WIPE_USERS" }, "my_customer", device.deviceId)
    if (device.status === "ACTIVE") {
      AdminDirectory.Chromeosdevices.action({"action": "disable"},"my_customer",deviceId)
    };
    deviceName = AdminDirectory.Chromeosdevices.patch(newDevice, "my_customer", deviceId).annotatedAssetId
    
    _removeDeviceLegion(deviceName.slice(0, 11));

    _setDeviceLegion(deviceName, MissingInAction);
  };
  
  this.sickBay = (cbAssetTag, faulties, explanation) => {
    let device = findDevice(cbAssetTag)
    let deviceName = device.annotatedAssetId.slice(0, 13) // 13 includes the dash
    let faultyList = engMultiples(faulties);
    let deviceId = device.deviceId;
    let lastAsgn = device.annotatedUser || "none found";
    let lastUser = device.recentUsers[0].email;
    let newDevice = {
      "annotatedAssetId": `${deviceName} Faulty ${faultyList}`,
      "annotatedUser": "",
      "orgUnitPath": `${inactiveOU}`,
      "orgUnitId": `${inactiveOuId}`,
      "notes": `Last assigned to ${lastAsgn}` + '\u000D' + `Last used by ${lastUser}` + '\u000D' + `Presented with ${explanation}`
    }
    
    // The line below would wipe devices when broken if enabled. Currently not for the hopeful case of quick fixes :-)
    // AdminDirectory.Customer.Devices.Chromeos.issueCommand({ "commandType": "WIPE_USERS" }, "my_customer", device.deviceId)
    if (device.status === "ACTIVE") {
      AdminDirectory.Chromeosdevices.action({"action": "disable"},"my_customer",deviceId)
    };
    deviceName = AdminDirectory.Chromeosdevices.patch(newDevice, "my_customer", deviceId).annotatedAssetId
    
    _removeDeviceLegion(deviceName.slice(0, 11));
    
    _setDeviceLegion(deviceName, SickBay);
  }
  
  this.active = (cbAssetTag, asgnMail, dueDate) => {
    let device = findDevice(cbAssetTag)
    let asgnUser = AdminDirectory.Users.get(asgnMail)
    let deviceName = device.annotatedAssetId.slice(0, 13) // 13 includes the dash
    let deviceId = device.deviceId;
    // Logger.log("deviceId = " + deviceId);
    let asgnOrgU = asgnUser.orgUnitPath.toString()
    // Logger.log("asgn = " + asgnOrgU);
    // Logger.log("inactive = " + inactiveOuId);
    let asgnName = asgnUser.name.fullName
    // Logger.log("full name = " + asgnName);
    let newDevice = {
      "annotatedAssetId": `${deviceName} ${asgnName}`,
      "annotatedUser": `${asgnMail}`,
      "notes": `Due by ${dueDate}`
    }
    // The line below would wipe devices when missing if enabled. Currently not for "hey I lost my-" 10 minutes later "found it"
    // AdminDirectory.Customer.Devices.Chromeos.issueCommand({ "commandType": "WIPE_USERS" }, "my_customer", device.deviceId)
    if (device.status !== "ACTIVE") {
      AdminDirectory.Chromeosdevices.action({"action": "reenable"},"my_customer", deviceId)
    };
    
    deviceName = AdminDirectory.Chromeosdevices.patch(newDevice, "my_customer", deviceId).annotatedAssetId
    AdminDirectory.Chromeosdevices.moveDevicesToOu({"deviceIds": [deviceId]}, "my_customer", asgnOrgU)
    
    _removeDeviceLegion(deviceName.slice(0, 11));
    
    _setDeviceLegion(deviceName, ActiveDuty);
  }
  
  this.guillotine = (cbAssetTag, judge, judgement) => {
    let device = findDevice(cbAssetTag)
    let deviceName = device.annotatedAssetId.slice(0, 13) // 11 does not include the 
    let dateRetired = new Date().toDateString();
    Logger.log(judge)
    let judgeObj = AdminDirectory.Users.get(judge)
    Logger.log("mainObj = \'" + judgeObj + "\'")
    let judgeNameObj = judgeObj?.name
    Logger.log("nameObj = \'" + judgeNameObj + "\'")
    let judgeName = judgeNameObj?.fullName
    Logger.log("name = \'" + judgeName + "\'")
    let newDevice = {
      "annotatedAssetId": `${deviceName} KIA ON ${dateRetired}`,
      "annotatedUser": "",
      "orgUnitPath": `${inactiveOU}`,
      "orgUnitId": `${inactiveOuId}`,
      "notes": `Retired by ${judgeName}` + '\u000D' + `Final Notes: ${judgement}`
    }
    try {
          AdminDirectory.Customer.Devices.Chromeos.issueCommand({ "commandType": "WIPE_USERS" }, "my_customer", device.deviceId)
        } catch (e) {
          Logger.log("Device probably already has pending wipe request, see below" + "\n" + e)
        }
    if (device.status === "ACTIVE") {
      AdminDirectory.Chromeosdevices.action({"action": "disable"},"my_customer",device.deviceId)
    };
    deviceName = AdminDirectory.Chromeosdevices.patch(newDevice, "my_customer", device.deviceId).annotatedAssetId

    _removeDeviceLegion(deviceName.slice(0, 11));

    _setDeviceLegion(deviceName, Boneyard);
  };
    
})();

function findDevice(cbAssetTag) {
  cbAssetTag = cbAssetTag.toString().slice(0, 11)
  let device = AdminDirectory.Chromeosdevices.list("my_customer", {
    "query": `${cbAssetTag}`
  }).chromeosdevices[0]
  // Logger.log(device.annotatedAssetId)
  return device
}

