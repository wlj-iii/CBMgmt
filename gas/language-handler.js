function engMultiples(list) {
  let listArray = list.split(",");
  switch (listArray.length) {
    case 0:
      return;
    case 1:
      return listArray[0].toString();
    case 2:
      let pair = listArray[0].toString().trim() + " and " + listArray[1].trim();
      return pair;
    default:
      let last = listArray.pop().toString();
      let listedString = listArray.join(",") + ", and " + last.trim();
      return listedString;
  }
}

function spaMultiples(list) {
  let listArray = list.split(",");
  switch (listArray.length) {
    case 0:
      return;
    case 1:
      return listArray[0].toString();
    case 2:
      let pair = listArray[0].toString().trim() + " y " + listArray[1].trim();
      return pair;
    default:
      let last = listArray.pop().toString();
      let listedString = listArray.join(",") + ", y " + last.trim();
      return listedString;
  }
}

function translateItem(item) {
  let translatedItem = Prices.createTextFinder(item).findNext().offset(0, 5).getValue()
  return translatedItem.toString()
}

function engProb(faultOrMiss, items) {
  let engProblem;
  let listedItems = engMultiples(items)
  engProblem = `${faultOrMiss} ${listedItems}`
  return engProblem
}

function spanProb(faultOrMiss, items) {
  let spaProblem;
  items = items.split(", ")
  let spanItems = items.map((item) => 
    translateItem(item)
    ).join(", ")


  listedItems = spaMultiples(spanItems)
  if (faultOrMiss == 'faulty') {
    spaProblem = `tenía ${listedItems} defectuosos`
  } else if (faultOrMiss == 'missing') {
    spaProblem = `le faltaban ${listedItems}`
  }

  return spaProblem
}

function spanCat(category) {
  let spaCategory;
  switch (category) {
    case 'Overdue':
      spaCategory = 'vencido'
      break;
    case 'Faulty/Returning Tech':
      spaCategory = 'sin culpa'
      break;
    case 'Unforeseeable Accudent':
      spaCategory = 'accidental'
      break;
    case 'Preventable Causes':
      spaCategory = 'evitable'
      break;
  }
  return spaCategory
}

function richTextify(range) {
  let runs = range.getRichTextValues()[0][0].getRuns()
  let runObjs = [];

  for (let i = 0; i < runs.length; i++) {
    // get the style of this section of text, between startIndex and endIndex 
    var run = runs[i]; 

    let runObj = {};

    runObj.text = run.getText();
    runObj.color = run.getTextStyle().getForegroundColorObject().asRgbColor().asHexString();
    runObj.font = run.getTextStyle().getFontFamily();
    runObj.fontsize = run.getTextStyle().getFontSize();
    runObj.startIndex = run.getStartIndex(); 
    runObj.endIndex = run.getEndIndex(); 
    runObj.styleBold = run.getTextStyle().isBold(); 
    runObj.styleItalic = run.getTextStyle().isItalic();
    runObj.stylesThru = run.getTextStyle().isStrikethrough();
    runObj.styleUline = run.getTextStyle().isUnderline();

    runObjs.push(runObj)
  }
    return runObjs
}