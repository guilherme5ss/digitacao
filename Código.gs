const scriptProp = PropertiesService.getScriptProperties();
const sheetName = "MAIN";

function initialSetup() {
  const activeSpreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  scriptProp.setProperty("key", activeSpreadsheet.getId());
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.tryLock(10000);

  try {
    const doc = SpreadsheetApp.openById(scriptProp.getProperty("key"));
    const sheet = doc.getSheetByName(sheetName);

    // Identifica qual ação o usuário quer realizar (cadastro ou login)
    const action = e.parameter.action;

    if (action === "cadastro") {
      return handleCadastro(sheet, e);
    } else if (action === "login") {
      return handleLogin(sheet, e);
    } else if (action === "salvarProgresso") {
      return handleSalvarProgresso(sheet, e);
    } else {
      throw new Error("Ação desconhecida");
    }
  } catch (e) {
    return ContentService.createTextOutput(JSON.stringify({ result: "error", message: e.toString() }),).setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

// Função para formatar o CPF - mantém apenas números
function formatarCPF(cpf) {
  if (!cpf) return "";
  // Remove tudo que não for número
  return cpf.toString().replace(/\D/g, "");
}

// Função para formatar o nome - converte para maiúsculas
function formatarNome(nome) {
  if (!nome) return "";
  return nome.toString().toUpperCase();
}

function handleCadastro(sheet, e) {
  // Gera o próximo Código (ID)
  const lastRow = sheet.getLastRow();
  let nextId = 1000;

  if (lastRow > 1) {
    const lastId = sheet.getRange(lastRow, 2).getValue();
    if (!isNaN(lastId)) {
      nextId = Number(lastId) + 1;
    }
  }

  // Validações básicas
  if (!e.parameter.nome || !e.parameter.senha) {
    return ContentService.createTextOutput(
      JSON.stringify({
        result: "error",
        message: "Nome e Senha obrigatórios.",
      }),
    ).setMimeType(ContentService.MimeType.JSON);
  }

  // Formata os dados
  const nomeFormatado = formatarNome(e.parameter.nome);
  const cpfFormatado = formatarCPF(e.parameter.cpf);
  const senhaFormatada = e.parameter.senha ? "'" + e.parameter.senha.toString() : "";
  const cpfParaPlanilha = cpfFormatado ? "'" + cpfFormatado : ""; // Adiciona apóstrofo para manter zeros

  const newRow = [
    new Date(), // A - Data do cadastro
    nextId, // B - Código (ID)
    nomeFormatado, // C - Nome em maiúsculas
    cpfParaPlanilha, // D - CPF (apenas números, com apóstrofo para zeros)
    e.parameter.email || "", // E - Email (opcional)
    senhaFormatada, // F - Senha (mantém zeros à esquerda)
    1, // G - Nível Inicial (fase 1)
  ];

  sheet.appendRow(newRow);

  return ContentService.createTextOutput(
    JSON.stringify({
      result: "success",
      message: "Cadastro realizado!",
      codigo: nextId,
    }),
  ).setMimeType(ContentService.MimeType.JSON);
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
    const dbCpf = formatarCPF(row[3]); // Remove formatação do CPF armazenado
    const dbEmail = String(row[4] || "");
    const dbSenha = String(row[5]);

    // Formata o loginInput para comparação (remove caracteres não numéricos se for CPF)
    const loginInputFormatado = formatarCPF(loginInput) || String(loginInput);

    // Verifica se o loginInput bate com Código, CPF OU Email
    // E se a senha bate
    if (
      (String(loginInput) === dbCodigo ||
        loginInputFormatado === dbCpf ||
        String(loginInput).toLowerCase() === dbEmail.toLowerCase()) &&
      String(passwordInput) === dbSenha
    ) {
      userFound = true;
      userData = {
        username: row[2], // Nome
        codigo: row[1], // ID do usuario
        nivel: row[6] || 1, // Nivel salvo na planilha (default 1 se vazio)
      };
      break;
    }
  }

  if (userFound) {
    return ContentService.createTextOutput(
      JSON.stringify({ result: "success", ...userData }),
    ).setMimeType(ContentService.MimeType.JSON);
  } else {
    return ContentService.createTextOutput(
      JSON.stringify({
        result: "error",
        message: "Dados incorretos.",
      }),
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

function handleSalvarProgresso(sheet, e) {
  const usuarioCodigo = e.parameter.codigo;
  const novoNivel = e.parameter.nivel;

  const data = sheet.getDataRange().getValues();

  // Procura o usuário pelo código (Coluna B -> indice 1)
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][1]) === String(usuarioCodigo)) {
      // Atualiza a coluna G (Nivel) -> indice 6
      sheet.getRange(i + 1, 7).setValue(novoNivel);

      return ContentService.createTextOutput(
        JSON.stringify({
          result: "success",
          message: "Progresso salvo.",
        }),
      ).setMimeType(ContentService.MimeType.JSON);
    }
  }

  return ContentService.createTextOutput(
    JSON.stringify({
      result: "error",
      message: "Usuário não encontrado.",
    }),
  ).setMimeType(ContentService.MimeType.JSON);
}