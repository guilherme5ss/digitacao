const scriptProp = PropertiesService.getScriptProperties();
const sheetName = "MAIN";

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

function handleCadastro(sheet, e) {
  // Gera o próximo Código (ID)
  // Pega o valor da última linha na coluna 2 (B - Código). Se não tiver nada, começa do 1.
  const lastRow = sheet.getLastRow();
  let nextId = 1000; // Vamos começar do 1000 para ficar mais bonito, ou 1 se preferir
  
  if (lastRow > 1) {
    const lastId = sheet.getRange(lastRow, 2).getValue(); 
    if (!isNaN(lastId)) {
      nextId = Number(lastId) + 1;
    }
  }

  // Validações básicas (CPF e Email agora são opcionais, mas Nome e Senha não)
  if (!e.parameter.nome || !e.parameter.senha) {
     return ContentService
      .createTextOutput(JSON.stringify({ 'result': 'error', 'message': 'Nome e Senha são obrigatórios.' }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  const newRow = [
    new Date(),           // Data
    nextId,               // Código (Auto-incremento)
    e.parameter.nome,     // Nome
    "'"+e.parameter.cpf,  // CPF (com apóstrofo para forçar texto e manter zeros)
    e.parameter.email,    // Email
    e.parameter.senha     // Senha
  ];

  sheet.appendRow(newRow);

  return ContentService
    .createTextOutput(JSON.stringify({ 
        'result': 'success', 
        'message': 'Cadastro realizado!', 
        'codigo': nextId // Retorna o código para mostrar ao usuário
    }))
    .setMimeType(ContentService.MimeType.JSON);
}

function handleLogin(sheet, e) {
  // O campo 'loginInput' vem do formulário (pode ser email, cpf ou codigo)
  const loginInput = e.parameter.loginInput; 
  const passwordInput = e.parameter.senha;
  
  const data = sheet.getDataRange().getValues();
  let userFound = false;
  let userName = "";

  // Loop começa do 1 (pula cabeçalho)
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    // Índices: 0=Data, 1=Codigo, 2=Nome, 3=CPF, 4=Email, 5=Senha
    const dbCodigo = String(row[1]);
    const dbCpf = String(row[3]);
    const dbEmail = String(row[4]);
    const dbSenha = String(row[5]);

    // Verifica se o loginInput bate com Código, CPF OU Email
    // E se a senha bate
    if ((loginInput == dbCodigo || loginInput == dbCpf || loginInput == dbEmail) && passwordInput == dbSenha) {
      userFound = true;
      userName = row[2]; // Nome
      break;
    }
  }

  if (userFound) {
     return ContentService
      .createTextOutput(JSON.stringify({ 'result': 'success', 'username': userName }))
      .setMimeType(ContentService.MimeType.JSON);
  } else {
     return ContentService
      .createTextOutput(JSON.stringify({ 'result': 'error', 'message': 'Dados de acesso incorretos.' }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}