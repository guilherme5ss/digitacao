const configsFases = [
    // --- SEÇÃO 1: TECLAS (Fases 1-16) ---
    // Exemplo Fase 1: Teclas Home Row
    {
        id: 1,
        tipo: 'tecla', // 'tecla', 'palavra', 'audio'
        titulo: "Seção 1: Introdução às Teclas",
        instrucao: "Posicione seus dedos na linha base (ASDF JKLÇ). Digite a letra destacada.",
        conteudo: "asdfg", // Caracteres usados nesta fase
        aleatorio: false, // Se false, segue a ordem da string 'conteudo'. Se true, sorteia.
        metaPontos: 35,
        tempoLimite: null, // null = sem tempo
        permitirBackspace: false,
        maxErros: 100
    },
    // ... (Crie as fases intermediárias aqui) ...
    // Exemplo Fase 15: Aleatório
    {
        id: 15,
        tipo: 'tecla',
        titulo: "Prática Aleatória",
        instrucao: "Atenção redobrada. As letras aparecerão em ordem aleatória.",
        conteudo: "qwertyuiop", 
        aleatorio: true,
        metaPontos: 35,
        tempoLimite: null,
        permitirBackspace: false,
        maxErros: 20
    },
    // Exemplo Fase 16: Números
    {
        id: 16,
        tipo: 'tecla',
        titulo: "Números",
        instrucao: "Use a linha superior para digitar os números.",
        conteudo: "1234567890",
        aleatorio: true,
        metaPontos: 35,
        maxErros: 20
    },

    // --- SEÇÃO 2: PALAVRAS (Fases 17-29) ---
    {
        id: 17,
        tipo: 'palavra',
        titulo: "Seção 2: Palavras Inteiras",
        instrucao: "Digite a palavra exibida e pressione ESPAÇO. Não é possível apagar erros ainda.",
        conteudo: ["casa", "dado", "faca", "gato"], // Lista de palavras
        metaPontos: 35, // Tem que acertar 35 palavras
        tempoLimite: 360, // 6 minutos em segundos
        permitirBackspace: false,
        maxErros: 40,
        teclaFinal: " " // Exige espaço no final
    },
    {
        id: 20,
        tipo: 'palavra',
        titulo: "Uso do Enter",
        instrucao: "Digite a palavra e pressione ENTER para quebrar a linha.",
        conteudo: ["linha1", "textocorrido", "paragrafo"],
        metaPontos: 35,
        tempoLimite: 360,
        permitirBackspace: true, // Agora pode apagar
        maxErros: 40,
        teclaFinal: "Enter" // Exige Enter no final
    },

    // --- SEÇÃO 3: ACENTOS (Fases 30-40) ---
    {
        id: 30,
        tipo: 'palavra',
        titulo: "Seção 3: Acentuação",
        instrucao: "Atenção aos acentos. Use o botão de ajuda se travar.",
        conteudo: ["vovó", "pão", "maçã", "através", "você"],
        metaPontos: 35,
        tempoLimite: 360,
        permitirBackspace: true,
        maxErros: 40,
        teclaFinal: " ",
        ajudaVisual: true // Ativa botão de ajuda
    },

    // --- SEÇÃO 4: DITADO (Fases 41+) ---
    {
        id: 41,
        tipo: 'audio',
        titulo: "Seção 4: Ditado",
        instrucao: "Ouça a palavra e digite-a. Clique no ícone de som para ouvir novamente.",
        conteudo: ["desenvolvimento", "programação", "javascript", "sucesso"],
        metaPontos: 10,
        tempoLimite: null,
        permitirBackspace: true,
        maxErros: 15,
        teclaFinal: " "
    }
];