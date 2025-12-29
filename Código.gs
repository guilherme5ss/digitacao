const sheetName = "MAIN"
const scriptProp = PropertiesService.getScriptProperties()

function initialSteup () {
  const activeSpreadsheet = SpreadsheetApp.getActiveSpreadsheet()
  scriptProp.setProperty('key', activeSpreadsheet.getId())
}

function doPost(e) {
  const lock = LockService.getScriptLock()
  lock.tryLock(10000)
  return ContentService.createTextOutput();
}