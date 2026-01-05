// --- ESTADO DO JOGO ---
let nivelAtualIndex = 0; // Começa do 0 (que é o ID 1 na config)
let configAtual = {};
let pontos = 0;
let erros = 0;
let tempoRestante = 0;
let intervaloTempo;
let itemAtual = ""; // Letra ou palavra atual
let inputBuffer = ""; // O que o usuário digitou até agora (para palavras)

// --- ELEMENTOS DOM ---
const inputEl = document.getElementById('input-usuario');
const alvoEl = document.getElementById('texto-alvo');
const modalEl = document.getElementById('modal-instrucao');
const btnAudio = document.getElementById('btn-audio');

// --- INICIALIZAÇÃO ---
document.addEventListener('DOMContentLoaded', () => {
    // Carrega progresso salvo
    const progressoSalvo = localStorage.getItem('nivelDigita');
    console.log("Game.js leu do localStorage:", progressoSalvo); // Debug

    if (progressoSalvo !== null && progressoSalvo !== undefined && progressoSalvo !== "") {
        nivelAtualIndex = parseInt(progressoSalvo);
        
        // Se der NaN por algum motivo, volta para 0
        if (isNaN(nivelAtualIndex)) {
            console.warn("Nível salvo inválido, resetando para 0");
            nivelAtualIndex = 0;
        }
    } else {
        // Se não tem nada salvo, começa do 0
        nivelAtualIndex = 0;
    }

    // Proteção de array (caso o usuário tenha nível 100 mas só existam 43 fases)
    if (nivelAtualIndex >= configsFases.length) {
        nivelAtualIndex = configsFases.length - 1; // Coloca na última fase disponível
    }

    console.log("Nível final carregado no jogo:", nivelAtualIndex);
    
    carregarFase();
    bloquearColagem();
});

// --- ANTI-CHEAT ---
function bloquearColagem() {
    // Bloqueia Ctrl+V, Ctrl+Insert, Botão Direito, Drag&Drop
    inputEl.addEventListener('paste', e => { e.preventDefault(); alert("Copiar e colar é proibido!"); });
    inputEl.addEventListener('drop', e => { e.preventDefault(); });
    inputEl.oncontextmenu = () => false; // Desativa botão direito
}

function carregarFase() {
    configAtual = configsFases[nivelAtualIndex];

    // Reseta variaveis
    pontos = 0;
    erros = 0;
    tempoRestante = configAtual.tempoLimite;
    inputBuffer = "";
    inputEl.value = "";
    inputEl.disabled = true; // Só libera ao clicar em Começar

    // Atualiza UI
    document.getElementById('fase-atual').innerText = configAtual.id;
    document.getElementById('meta').innerText = configAtual.metaPontos;
    document.getElementById('max-erros').innerText = configAtual.maxErros;
    document.getElementById('pontos').innerText = 0;
    document.getElementById('erros').innerText = 0;
    atualizarRelogio();

    // Configura Modal
    document.getElementById('titulo-fase').innerText = configAtual.titulo;
    document.getElementById('texto-instrucao').innerHTML = configAtual.instrucao;
    modalEl.style.display = 'flex';

    // Configura Botões de Ajuda (Seção 3)
    const areaAjuda = document.getElementById('painel-ajuda');
    if (configAtual.ajudaVisual) {
        areaAjuda.style.display = 'block';
        gerarBotoesAjuda();
    } else {
        areaAjuda.style.display = 'none';
    }
}

function iniciarJogo() {
    modalEl.style.display = 'none';
    inputEl.disabled = false;
    inputEl.focus();

    prepararNovoItem();

    if (configAtual.tempoLimite) {
        intervaloTempo = setInterval(() => {
            tempoRestante--;
            atualizarRelogio();
            if (tempoRestante <= 0) {
                finalizarFase(false, "Tempo esgotado!");
            }
        }, 1000);
    }
}

function prepararNovoItem() {
    inputEl.value = "";
    inputBuffer = "";

    // Lógica para pegar conteúdo
    let conteudo = configAtual.conteudo; // Pode ser string ou array

    if (configAtual.tipo === 'tecla') {
        // Se for string "asdfg"
        if (configAtual.aleatorio) {
            const index = Math.floor(Math.random() * conteudo.length);
            itemAtual = conteudo[index];
        } else {
            // Se for sequencial, usa os pontos como índice (ex: 0=a, 1=s...)
            // Usa módulo para repetir se pontos > tamanho
            itemAtual = conteudo[pontos % conteudo.length];
        }
        alvoEl.innerText = itemAtual;
        destacarTecla(itemAtual);
        btnAudio.style.display = 'none';

    } else if (configAtual.tipo === 'palavra' || configAtual.tipo === 'audio') {
        // Sorteia uma palavra da lista
        const index = Math.floor(Math.random() * conteudo.length);
        itemAtual = conteudo[index];

        if (configAtual.tipo === 'audio') {
            alvoEl.innerText = "🔊 ???";
            btnAudio.style.display = 'inline-block';
            tocarAudioAtual();
        } else {
            alvoEl.innerText = itemAtual;
            btnAudio.style.display = 'none';
        }
        // Limpa destaque de tecla única em modo palavra
        document.querySelectorAll('.key').forEach(k => k.classList.remove('active'));
    }
}

// --- CONTROLE DE INPUT ---
inputEl.addEventListener('keydown', (e) => {
    // Ignora teclas de controle (shift, ctrl, alt, etc) exceto Backspace e Enter
    if (e.key.length > 1 && e.key !== 'Backspace' && e.key !== 'Enter') return;

    // Bloqueia Backspace se não permitido
    if (e.key === 'Backspace' && !configAtual.permitirBackspace) {
        e.preventDefault();
        return;
    }

    // Modo TECLA (caractere único)
    if (configAtual.tipo === 'tecla') {
        e.preventDefault(); // Impede o caractere de aparecer no input (controle manual)
        verificarTeclaUnica(e.key);
    }
});

inputEl.addEventListener('input', (e) => {
    // Modo PALAVRA e AUDIO (usa evento input para pegar texto digitado)
    if (configAtual.tipo !== 'tecla') {
        verificarPalavra(e.target.value);
    }
});

function verificarTeclaUnica(keyPressionada) {
    // Case sensitive
    if (keyPressionada === itemAtual) {
        pontos++;
        document.getElementById('pontos').innerText = pontos;
        inputEl.classList.add('correct');
        setTimeout(() => inputEl.classList.remove('correct'), 200);

        checarVitoria();
        prepararNovoItem();
    } else {
        registrarErro();
    }
}

function verificarPalavra(valorDigitado) {
    const ultimoChar = valorDigitado.slice(-1);

    // Verifica se digitou a tecla final (Espaço ou Enter)
    if (ultimoChar === configAtual.teclaFinal || (configAtual.teclaFinal === 'Enter' && valorDigitado.includes('\n'))) {

        const palavraLimpa = valorDigitado.trim(); // Remove espaços extras

        if (palavraLimpa === itemAtual) {
            pontos++;
            document.getElementById('pontos').innerText = pontos;
            inputEl.value = ""; // Limpa campo
            checarVitoria();
            prepararNovoItem();
        } else {
            // Errou a palavra
            registrarErro();
            // Se não pode apagar, limpa automaticamente para tentar de novo
            if (!configAtual.permitirBackspace) {
                inputEl.value = "";
            }
        }
    }
}

function registrarErro() {
    erros++;
    document.getElementById('erros').innerText = erros;
    inputEl.classList.add('error');
    setTimeout(() => inputEl.classList.remove('error'), 200);

    if (erros > configAtual.maxErros) {
        finalizarFase(false, "Limite de erros atingido!");
    }
}

function checarVitoria() {
    if (pontos >= configAtual.metaPontos) {
        finalizarFase(true, "Parabéns! Fase concluída.");
    }
}

function finalizarFase(sucesso, mensagem) {
    clearInterval(intervaloTempo);
    inputEl.disabled = true;

    if (sucesso) {
        alert(mensagem);

        // Atualiza índice
        nivelAtualIndex++;

        // 1. Salva Local
        localStorage.setItem('nivelDigita', nivelAtualIndex);

        // 2. Tenta Salvar no Servidor (NOVO)
        salvarProgressoServidor(nivelAtualIndex);

        if (nivelAtualIndex < configsFases.length) {
            carregarFase();
        } else {
            alert("VOCÊ ZEROU O CURSO! PARABÉNS!");
            sairAula();
        }
    } else {
        alert("FALHA: " + mensagem + "\nTente novamente.");
        carregarFase();
    }
}

// --- AUXILIARES ---

function destacarTecla(char) {
    // Remove destaque anterior
    document.querySelectorAll('.key').forEach(k => k.classList.remove('active'));

    // Busca tecla no HTML (data-key)
    // Converte para minúscula para achar no HTML, mas a lógica JS mantém case sensitive
    const keyEl = document.querySelector(`.key[data-key="${char.toLowerCase()}"]`);
    if (keyEl) {
        keyEl.classList.add('active');

        // Sugerir dedo (lógica simples baseada em layout QWERTY padrão)
        const dedos = {
            'q': 'Mindinho Esq', 'a': 'Mindinho Esq', 'z': 'Mindinho Esq',
            'w': 'Anelar Esq', 's': 'Anelar Esq', 'x': 'Anelar Esq',
            'e': 'Médio Esq', 'd': 'Médio Esq', 'c': 'Médio Esq',
            'f': 'Indicador Esq', 'g': 'Indicador Esq', 'r': 'Indicador Esq', 't': 'Indicador Esq', 'v': 'Indicador Esq', 'b': 'Indicador Esq',
            'j': 'Indicador Dir', 'h': 'Indicador Dir', 'u': 'Indicador Dir', 'y': 'Indicador Dir', 'm': 'Indicador Dir', 'n': 'Indicador Dir',
            'k': 'Médio Dir', 'i': 'Médio Dir', ',': 'Médio Dir',
            'l': 'Anelar Dir', 'o': 'Anelar Dir', '.': 'Anelar Dir',
            'ç': 'Mindinho Dir', 'p': 'Mindinho Dir',
            ' ': 'Polegar'
        };
        const dedo = dedos[char.toLowerCase()] || "Indicador/Mindinho";
        document.getElementById('nome-dedo').innerText = dedo;
    }
}

function tocarAudioAtual() {
    if ('speechSynthesis' in window) {
        const utter = new SpeechSynthesisUtterance(itemAtual);
        utter.lang = 'pt-BR'; // Define idioma
        utter.rate = 0.8; // Um pouco mais lento para ditar
        window.speechSynthesis.speak(utter);
    } else {
        alert("Seu navegador não suporta áudio.");
    }
}

function gerarBotoesAjuda() {
    const container = document.getElementById('botoes-especiais');
    container.innerHTML = "";
    const chars = ['á', 'à', 'â', 'ã', 'é', 'ê', 'í', 'ó', 'ô', 'õ', 'ú', 'ç', '?'];

    chars.forEach(c => {
        const btn = document.createElement('button');
        btn.innerText = c;
        btn.style.margin = "2px";
        btn.style.padding = "5px 10px";
        btn.onclick = () => {
            alert(`Para digitar '${c}', verifique a tecla de acento antes da letra.`);
            inputEl.focus();
        };
        container.appendChild(btn);
    });
}

function atualizarRelogio() {
    if (configAtual.tempoLimite === null) {
        document.getElementById('tempo').innerText = "Livre";
        return;
    }
    const min = Math.floor(tempoRestante / 60);
    const sec = tempoRestante % 60;
    document.getElementById('tempo').innerText = `${min}:${sec < 10 ? '0' : ''}${sec}`;
}

function salvarProgressoServidor(novoNivel) {
    const codigoUsuario = localStorage.getItem('usuarioCodigo');
    const isOffline = localStorage.getItem('modoOffline') === 'true';

    // Se estiver offline ou não tiver código de usuário, salva apenas local
    if (isOffline || !codigoUsuario) {
        console.log("Progresso salvo apenas localmente (Offline ou Visitante).");
        return;
    }

    // Prepara dados para envio
    const formData = new FormData();
    formData.append('action', 'salvarProgresso');
    formData.append('codigo', codigoUsuario);
    formData.append('nivel', novoNivel+1);

    // Envia silenciosamente (sem travar o jogo)
    fetch(config.script_url, { // Certifique-se que config.script_url está acessível aqui (inclua config.js no html antes do game.js)
        method: 'POST',
        body: formData
    })
        .then(response => response.json())
        .then(data => {
            if (data.result === 'success') {
                console.log("Progresso sincronizado com a nuvem.");
            } else {
                console.warn("Erro ao salvar na nuvem:", data.message);
            }
        })
        .catch(err => console.error("Erro de conexão ao salvar:", err));
}

function sairAula() {
    window.location.href = "index.html";
}