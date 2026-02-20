// Usando fetch nativo do Node 18+
async function test() {
    console.log('Testando conexão com Agente via Ngrok...');
    const url = 'https://calibred-janay-revealable.ngrok-free.dev/run';

    try {
        const res = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'ngrok-skip-browser-warning': '1' // O pulo do gato
            },
            body: JSON.stringify({
                secret: 'biglion_fic4',
                cmd: 'echo OK'
            })
        });

        console.log(`Status: ${res.status} ${res.statusText}`);
        const text = await res.text();
        console.log('Resposta:', text);
    } catch (e) {
        console.error('ERRO FATAL:', e.message);
        if (e.cause) console.error('Causa:', e.cause);
    }
}
test();
