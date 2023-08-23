function iShouldntBeHere() {
  // let items = 'Chromebook entirely, charger'
  let testEmail = 'ascaddan2022@lakerschools.org'
  // MAIL.inbound('ascaddan2022@lakerschools.org', items, "Lakers 0327")
  // ACC.charge('ascaddan2022@lakerschools.org', "faulty", items, 0, "Unforeseeable Accident")
  // ACC.totalPoints('ascaddan2022@lakerschools.org', 'Unforeseeable Accident')
  // ACC.removeCharger('ascaddan2022@lakerschools.org')
  let fullName = AdminDirectory.Users.get(testEmail).name.fullName
  Logger.log(fullName)
  LGN.active('Lakers 0057', testEmail, '10/20/23')
  // LGN.reserves('Lakers 0057', 'testing purposes')
}