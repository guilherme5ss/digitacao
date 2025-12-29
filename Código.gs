// Cópia da versão usada no "Apps Script" da planilha Google Sheets
const sheetName = "MAIN"; // Nome da aba onde os dados serão inseridos
const scriptProp = PropertiesService.getScriptProperties();

function initialSetup () {
  const activeSpreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  scriptProp.setProperty('key', activeSpreadsheet.getId());
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.tryLock(10000);

  try {
    const doc = SpreadsheetApp.openById(scriptProp.getProperty('key'));
    const sheet = doc.getSheetByName(sheetName);

    // Pega os cabeçalhos da planilha (linha 1)
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    
    // Mapeia os dados recebidos para corresponderem à ordem das colunas
    // Se você tiver uma coluna chamada 'data', ele insere a data atual
    const nextRow = headers.map(function(header) {
      if (header === 'data' || header === 'timestamp') {
        return new Date();
      } else {
        // 'nome', 'email', 'mensagem' devem bater com o 'name' do HTML
        return e.parameter[header]; 
      }
    });

    // Adiciona a linha na planilha
    sheet.appendRow(nextRow);

    // Retorna JSON de sucesso para evitar erro de CORS e permitir que o JS entenda
    return ContentService
      .createTextOutput(JSON.stringify({ 'result': 'success', 'row': nextRow }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  catch (e) {
    // Em caso de erro, retorna o erro
    return ContentService
      .createTextOutput(JSON.stringify({ 'result': 'error', 'error': e }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  finally {
    lock.releaseLock();
  }
}