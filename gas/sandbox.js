function iShouldntBeHere() {
  let cb = "Lakers 1101";
  let items = ['Chromebook', 'Charger']
  let testEmail = 'lakintaccmgr@lakerschools.org'
  let testBulkDevs = "Lakers 0426 (05/31/2024), Lakers 1101 (05/31/2024), Lakers 0429 (05/31/2024)"
  // let tester = new RegExp(`${cb}.{13}`)
  // let devsArr = testBulkDevs.split(",").filter((dev) => dev.toString().search(tester) == -1)
  // Logger.log(devsArr)
  // let fullName = AdminDirectory.Users.get(testEmail).name.fullName
  // Logger.log(fullName)
  
  // latestFirst(MIA)
  

  // let newBulkDevs = testBulkDevs.toString().split(",").forEach(
    // dev = dev.trim().replace(")", "").split("(")
    // )
    // let temp = priceItems("Chromebook entirely")
    // Logger.log(temp)
  // ACC.totalPoints('ascaddan2022@lakerschools.org', 'Unforeseeable Accident')
  // ACC.addCharger('ascaddan2022@lakerschools.org', dateToTwos(new Date()))
  ACC.charge('ascaddan2022@lakerschools.org', "missing", "Chromebook entirely", 235, "Overdue", "Lakers 1101")
  // ACC.removeBulkDevice(`${cb}`)
  // Logger.log(ACC.outstandingFines(testEmail))/
  // Logger.log(ACC.spanReport(testEmail))
  // dailyCheckDue()

  // LGN.active('Lakers 0327', testEmail, '10/20/23')
  // LGN.reserves('Lakers 0327', 'testing purposes')

  // MAIL.inbound(testEmail, items, cb)
  // MAIL.outbound(testEmail, 'Chromebook entirely, charger', '01/01/24')
  // MAIL.charge(testEmail, 'faulty', items, '20', 'Unforeseeable Accident')
  // MAIL.dueSoon(testEmail)
  
  // Logger.log(new Date(new Date('01/01/24').setHours(16)).toLocaleString())
  // Logger.log(AdminDirectory.Chromeosdevices.get("my_customer", "d3c2e57c-f1fb-4177-9da8-838c0548c027"))
  // dailyCheckDue()
  // return temp
}


function jShouldntBeHere() {
  let temp = Number(SingleAccounts.getRange(11, 3, 1, 1).getValue())
  if (!temp) {
    Logger.log("works")
  } else {
    Logger.log("doesnt")
  }
  Logger.log(temp)
};
