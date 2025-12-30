# Digitação

Práticas de digitação.

## Configuração: Passos Críticos (Não pule estes)
### Para que o código funcione, você precisa garantir duas coisas na sua Planilha Google:

### **1. Configuração Inicial:**

- Na planilha, a primeira linha **deve** conter os cabeçalhos com os mesmos nomes dos atributos `name` do seu HTML.

- Crie colunas na linha 1 com os nomes exatos: `nome` | `email` | `mensagem` | `data`.

- Execute a função `initialSetup`: No editor do Apps Script, selecione a função `initialSetup` na barra superior e clique em "Executar" (Run) uma única vez. Isso salva o ID da planilha nas propriedades do script.

### **2. Nova Implantação (Crucial):** Sempre que você altera o código do Apps Script, você precisa gerar uma nova versão.

- Clique em Implantar (Deploy) > Gerenciar implantações (Manage deployments).

- Clique no ícone de lápis (Editar).

- Em "Versão", selecione Nova versão (New version).

- Clique em Implantar.

*Nota*: Se você apenas "Salvar", a URL pública continuará apontando para o código antigo (o que estava vazio).

# Considerações

[Rodrigo Mello](https://www.youtube.com/@rodrigofdemello) desevolveu no video: [Google Sheets | Como Enviar Dados de um Formulário HTML para o Google Sheets](https://www.youtube.com/watch?v=tMZbxXnuQ7s) o código para fazer uma ligação entre HTML e Google Sheets.
