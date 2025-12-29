const script_do_google = config.script_url;
const dados_do_formulario = document.forms['formulario-contato'];

dados_do_formulario.addEventListener('submit', function (e) {
    e.preventDefault();
    
    // Feedback visual que está enviando (opcional)
    const botao = document.getElementById('enviar');
    botao.value = "Enviando...";
    botao.disabled = true;

    fetch(script_do_google, { method: 'POST', body: new FormData(dados_do_formulario) })
        .then(response => {
            // Verifica se o fetch funcionou tecnicamente
            if (response.ok) {
                 alert('Dados enviados com sucesso!');
                 dados_do_formulario.reset();
            } else {
                 throw new Error('Erro na resposta do servidor');
            }
        })
        .catch(error => {
            console.error('Erro!', error.message);
            alert('Houve um erro no envio.');
        })
        .finally(() => {
            // Restaura o botão
            botao.value = "Enviar";
            botao.disabled = false;
        });
});
