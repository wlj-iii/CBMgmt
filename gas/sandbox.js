function iShouldntBeHere() {
  let cb = "Lakers 1101";
  let items = ['Chromebook', 'Charger']
  let testEmail = 'ascaddan2022@lakerschools.org'
  // let fullName = AdminDirectory.Users.get(testEmail).name.fullName
  // Logger.log(fullName)
  
  // latestFirst(MIA)
  
  // ACC.totalPoints('ascaddan2022@lakerschools.org', 'Unforeseeable Accident')
  // ACC.removeCharger('ascaddan2022@lakerschools.org')
  Logger.log(ACC.outstandingFines(testEmail))
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
  
}


function jShouldntBeHere() {
  let items = ['Chromebook', 'Charger']
  const transaction = new Txn("ascaddan2022@lakerschools.org", "Check In", new Date(), items)
  // transaction.invoiceSent = true
  transaction.commit()
};
