async function diagnose() {
    console.log('🔍 Iniciando Diagnóstico...\n');
    let dynamicUrl = null;

    // 1. Tentar pegar a URL real do Ngrok (Porta 4040)
    try {
        console.log('1️⃣  Consultando API do Ngrok (http://localhost:4040/api/tunnels)...');
        const res = await fetch('http://localhost:4040/api/tunnels');
        const json = await res.json();

        if (json.tunnels && json.tunnels.length > 0) {
            dynamicUrl = json.tunnels[0].public_url;
            console.log(`✅ TÚNEL ATIVO ENCONTRADO: ${dynamicUrl}`);
        } else {
            console.error('❌ Ngrok está rodando mas SEM TÚNEIS ativos.');
        }
    } catch (e) {
        console.error('❌ Falha ao falar com Ngrok (ele está fechado?):', e.message);
    }

    const TARGET = dynamicUrl || 'https://calibred-janay-revealable.ngrok-free.dev';
    console.log(`\n2️⃣  Testando conexão com Agente em: ${TARGET}/run ...`);

    try {
        const res = await fetch(`${TARGET}/run`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'ngrok-skip-browser-warning': '1'
            },
            body: JSON.stringify({
                secret: 'biglion_fic4',
                cmd: 'echo OK'
            })
        });

        const status = res.status;
        const text = await res.text();

        console.log(`📡 Status HTTP: ${status}`);

        if (status === 200 || status === 403) { // 403 ainda significa conectado (só auth fail)
            console.log('✅ SUCESSO! O Agente está recebendo conexões.');
            if (status === 403) console.log('⚠️  (Nota: 403 é normal para comando de teste fora da whitelist)');
        } else if (status === 404) {
            if (text.includes('ngrok')) {
                console.error('❌ ERRO CRÍTICO: "Tunnel Not Found". A URL está errada ou o túnel caiu.');
            } else {
                console.error('❌ ERRO 404: Rota não encontrada no Agente (reinicie o agente).');
            }
            console.log('Corpo da resposta:', text.substring(0, 200));
        } else {
            console.error('❌ ERRO:', status);
            console.log('Resposta:', text);
        }

    } catch (e) {
        console.error('❌ FALHA TOTAL DE CONEXÃO:', e.message);
        if (e.cause) console.error('Causa:', e.cause);
    }
}

diagnose();
