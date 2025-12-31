const sheetName = "MAIN";
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
    
    // Identifica qual ação o usuário quer realizar (cadastro ou login)
    const action = e.parameter.action;

    if (action === 'cadastro') {
      return handleCadastro(sheet, e);
    } else if (action === 'login') {
      return handleLogin(sheet, e);
    } else {
      throw new Error("Ação desconhecida");
    }

  } catch (e) {
    return ContentService
      .createTextOutput(JSON.stringify({ 'result': 'error', 'message': e.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

// --- Função para Salvar Novo Usuário ---
function handleCadastro(sheet, e) {
  // Verifica se o email já existe (opcional, mas recomendado)
  const users = sheet.getDataRange().getValues();
  // Ignora o cabeçalho e procura o email na coluna 3 (índice 3 -> D)
  // Ajuste os índices conforme sua planilha: A=0, B=1, C=2, D=3 (Email), E=4 (Senha)
  const emailExists = users.slice(1).some(row => row[3] == e.parameter.email);
  
  if (emailExists) {
    return ContentService
      .createTextOutput(JSON.stringify({ 'result': 'error', 'message': 'Email já cadastrado!' }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  const newRow = [
    new Date(),           // Data
    e.parameter.nome,     // Nome
    e.parameter.cpf,      // CPF
    e.parameter.email,    // Email
    e.parameter.senha     // Senha (Nota: em produção real, use hash!)
  ];

  sheet.appendRow(newRow);

  return ContentService
    .createTextOutput(JSON.stringify({ 'result': 'success', 'message': 'Cadastro realizado!' }))
    .setMimeType(ContentService.MimeType.JSON);
}

// --- Função para Verificar Login ---
function handleLogin(sheet, e) {
  const emailInput = e.parameter.email;
  const passwordInput = e.parameter.senha;
  
  const data = sheet.getDataRange().getValues();
  let userFound = false;
  let userName = "";

  // Loop para encontrar usuário (começa do 1 para pular cabeçalho)
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    // Coluna 3 = Email, Coluna 4 = Senha
    if (row[3] == emailInput && row[4] == passwordInput) {
      userFound = true;
      userName = row[1]; // Coluna 1 = Nome
      break;
    }
  }

  if (userFound) {
     return ContentService
      .createTextOutput(JSON.stringify({ 'result': 'success', 'username': userName }))
      .setMimeType(ContentService.MimeType.JSON);
  } else {
     return ContentService
      .createTextOutput(JSON.stringify({ 'result': 'error', 'message': 'Email ou senha incorretos' }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}