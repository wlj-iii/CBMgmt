const ActiveDuty = SpreadsheetApp.getActive().getSheetByName('Active Duty');
const Reserves = SpreadsheetApp.getActive().getSheetByName('Reserves');
const SickBay = SpreadsheetApp.getActive().getSheetByName('Sick Bay');
const Boneyard = SpreadsheetApp.getActive().getSheetByName('Boneyard');
const MissingInAction = SpreadsheetApp.getActive().getSheetByName('MIA');
const inactiveOU = HouseRules.createTextFinder("Inactive OU").findNext().offset(0, 1).getValue();
const inactiveOuId = SpreadsheetApp.getActive().getSheetByName("House Rules").createTextFinder("Inactive OU ID").findNext().offset(0, 1).getValue();

let legions = [ActiveDuty, Reserves, SickBay, Boneyard, MissingInAction];


const LGN = new (function () {
  const _findDevice = (cbAssetTag) => {
    cbAssetTag = cbAssetTag.toString().slice(0, 11)
    Logger.log(cbAssetTag)
    let device = AdminDirectory.Chromeosdevices.list("my_customer", {
      "query": `${cbAssetTag}`
    }).chromeosdevices[0]
    return device
  }

  const _removeDeviceLegion = (assetTag) => {
    for (let i = 0; i < legions.length; i++) {
      let found = legions[i].createTextFinder(assetTag).findAll()
      for (let j = 0; j < found.length; j++) {
        let asset = found[j].getRow();
        legions[i].deleteRows(asset, 1);
      }
    }
  };

  const _setDeviceLegion = (cbAssetTag, LegionSheet) => {
    let certaintyCheck = _findDevice(cbAssetTag).annotatedAssetId;

    let formulas = [["=ArrayFormula(if(isblank($A$2:$A), \"\", split($A$2:$A, \" - \", false)))"]];
    let dataRow = [certaintyCheck]

    LegionSheet.appendRow(dataRow).getRange("B2:B").clear();
    LegionSheet.moveRows(LegionSheet.getRange(LegionSheet.getLastRow(), 1, 1, 1), 2)
    LegionSheet.getRange(2, 2, 1, 1).setFormula(formulas);
  }


  this.reserves = (cbAssetTag, explanation) => {
    let device = _findDevice(cbAssetTag)
    let deviceName = device.annotatedAssetId.slice(0, 13) // 11 does not include the 
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

    AdminDirectory.Customer.Devices.Chromeos.issueCommand({ "commandType": "WIPE_USERS" }, "my_customer", device.deviceId)
    if (device.status === "ACTIVE") {
      AdminDirectory.Chromeosdevices.action({"action": "disable"},"my_customer",deviceId)
    };
    AdminDirectory.Chromeosdevices.patch(newDevice, "my_customer", device.deviceId)

    _removeDeviceLegion(deviceName);

    _setDeviceLegion(cbAssetTag, Reserves);
  };

  this.missing = (cbAssetTag) => {
    let device = _findDevice(cbAssetTag)
    let deviceName = device.annotatedAssetId.slice(0, 13) // 13 includes the dash
    let deviceId = device.deviceId;
    let dateMissing = new Date().toDateString();
    let lastAsgn = device.annotatedUser || "none found";
    let lastUser = device.recentUsers[0].email;
    let lastUsed = getLastTime(device)
    let newDevice = {
      "annotatedAssetId": `${deviceName} Marked AWOL ${dateMissing}`,
      "annotatedUser": "",
      "orgUnitPath": `${inactiveOU}`,
      "orgUnitId": `${inactiveOuId}`,
      "notes": `Last assigned to ${lastAsgn}` + '\u000D' + `Last used by ${lastUser} on ${lastUsed}`
    }
    
    // The line below would wipe devices when missing if enabled. Currently not for "hey I lost my-" 10 minutes later "found it"
    // AdminDirectory.Customer.Devices.Chromeos.issueCommand({ "commandType": "WIPE_USERS" }, "my_customer", device.deviceId)
    if (device.status === "ACTIVE") {
      AdminDirectory.Chromeosdevices.action({"action": "disable"},"my_customer",deviceId)
    };
    AdminDirectory.Chromeosdevices.patch(newDevice, "my_customer", deviceId)
    
    _removeDeviceLegion(deviceName);

    _setDeviceLegion(cbAssetTag, MissingInAction);
  };
  
  this.sickBay = (cbAssetTag, faulties, explanation) => {
    let device = _findDevice(cbAssetTag)
    let deviceName = device.annotatedAssetId.slice(0, 13) // 13 includes the dash
    let deviceId = device.deviceId;
    let lastAsgn = device.annotatedUser || "none found";
    let lastUser = device.recentUsers[0].email;
    let newDevice = {
      "annotatedAssetId": `${deviceName} Faulty ${faulties}`,
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
    AdminDirectory.Chromeosdevices.patch(newDevice, "my_customer", deviceId)
    
    _removeDeviceLegion(deviceName);
    
    _setDeviceLegion(cbAssetTag, SickBay);
  }
  
  this.active = (cbAssetTag, asgnMail, dueDate) => {
    let device = _findDevice(cbAssetTag)
    let asgnUser = AdminDirectory.Users.get(asgnMail)
    let deviceName = device.annotatedAssetId.slice(0, 13) // 13 includes the dash
    let deviceId = device.deviceId;
    let asgnOrgU = asgnUser.orgUnitPath.slice(1)
    let asgnOuId = AdminDirectory.Orgunits.get("my_customer", asgnOrgU).orgUnitId
    let asgnName = asgnUser.name.fullname
    let newDevice = {
      "annotatedAssetId": `${deviceName} ${asgnName}`,
      "annotatedUser": `${asgnMail}`,
      "orgUnitPath": `${asgnOrgU}`,
      "orgUnitId": `${asgnOuId}`,
      "notes": `Due by ${dueDate}`
    }
    // The line below would wipe devices when missing if enabled. Currently not for "hey I lost my-" 10 minutes later "found it"
    // AdminDirectory.Customer.Devices.Chromeos.issueCommand({ "commandType": "WIPE_USERS" }, "my_customer", device.deviceId)
    if (device.status !== "ACTIVE") {
      AdminDirectory.Chromeosdevices.action({"action": "reenable"},"my_customer",deviceId)
    };
    
    AdminDirectory.Chromeosdevices.patch(newDevice, "my_customer", deviceId)
    
    _removeDeviceLegion(deviceName);
    
    _setDeviceLegion(cbAssetTag, ActiveDuty);
  }
  
  this.guillotine = (cbAssetTag, judge, judgement) => {
    let device = _findDevice(cbAssetTag)
    let deviceName = device.annotatedAssetId.slice(0, 13) // 11 does not include the 
    let dateRetired = new Date().toDateString();
    let judgeName = AdminDirectory.Users.get(judge).name.fullname;
    let newDevice = {
      "annotatedAssetId": `${deviceName} KIA ON ${dateRetired}`,
      "annotatedUser": "",
      "orgUnitPath": `${inactiveOU}`,
      "orgUnitId": `${inactiveOuId}`,
      "notes": `Retired by ${judgeName}` + '\u000D' + `Final Notes: ${judgement}`
    }

    AdminDirectory.Customer.Devices.Chromeos.issueCommand({ "commandType": "WIPE_USERS" }, "my_customer", device.deviceId)
    if (device.status === "ACTIVE") {
      AdminDirectory.Chromeosdevices.action({"action": "disable"},"my_customer",deviceId)
    };
    AdminDirectory.Chromeosdevices.patch(newDevice, "my_customer", device.deviceId)

    _removeDeviceLegion(deviceName);

    _setDeviceLegion(cbAssetTag, Boneyard);
  };
    
})();