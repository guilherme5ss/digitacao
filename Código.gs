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
    } else if (action === 'salvarProgresso') {
      return handleSalvarProgresso(sheet, e);
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
  let nextId = 1000; 
  
  if (lastRow > 1) {
    const lastId = sheet.getRange(lastRow, 2).getValue(); 
    if (!isNaN(lastId)) {
      nextId = Number(lastId) + 1;
    }
  }

  // Validações básicas (CPF e Email agora são opcionais, mas Nome e Senha não)
  if (!e.parameter.nome || !e.parameter.senha) {
     return ContentService.createTextOutput(JSON.stringify({ 'result': 'error', 'message': 'Nome e Senha obrigatórios.' })).setMimeType(ContentService.MimeType.JSON);
  }

  const newRow = [
    new Date(),           
    nextId,               
    e.parameter.nome,     
    "'"+e.parameter.cpf,  
    e.parameter.email,    
    e.parameter.senha,
    1 // <--- Nível Inicial (Começa na fase 0/1)
  ];

  sheet.appendRow(newRow);

  return ContentService
    .createTextOutput(JSON.stringify({ 
        'result': 'success', 
        'message': 'Cadastro realizado!', 
        'codigo': nextId 
    }))
    .setMimeType(ContentService.MimeType.JSON);
}

function handleLogin(sheet, e) {
  // O campo 'loginInput' vem do formulário (pode ser email, cpf ou codigo)
  const loginInput = e.parameter.loginInput; 
  const passwordInput = e.parameter.senha;
  
  const data = sheet.getDataRange().getValues();
  let userFound = false;
  let userData = {};

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
      userData = {
        username: row[2], // Nome
        codigo: row[1],   // ID do usuario (importante para salvar depois)
        nivel: row[6]     // Nivel salvo na planilha
      };
      break;
    }
  }

  if (userFound) {
     return ContentService
      .createTextOutput(JSON.stringify({ 'result': 'success', ...userData }))
      .setMimeType(ContentService.MimeType.JSON);
  } else {
     return ContentService
      .createTextOutput(JSON.stringify({ 'result': 'error', 'message': 'Dados incorretos.' }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// --- NOVA FUNÇÃO: Atualizar Progresso ---
function handleSalvarProgresso(sheet, e) {
  const usuarioCodigo = e.parameter.codigo;
  const novoNivel = e.parameter.nivel;

  const data = sheet.getDataRange().getValues();
  
  // Procura o usuário pelo código (Coluna B -> indice 1)
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][1]) === String(usuarioCodigo)) {
      // Atualiza a coluna G (Nivel) -> indice 6. A linha é i + 1 na planilha.
      // Coluna G é a 7ª coluna.
      sheet.getRange(i + 1, 7).setValue(novoNivel);
      
      return ContentService
        .createTextOutput(JSON.stringify({ 'result': 'success', 'message': 'Progresso salvo.' }))
        .setMimeType(ContentService.MimeType.JSON);
    }
  }

  return ContentService
    .createTextOutput(JSON.stringify({ 'result': 'error', 'message': 'Usuário não encontrado.' }))
    .setMimeType(ContentService.MimeType.JSON);
}