export default async function handler(req, res) {
    // CORS (Shortcuts / browser)
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Só POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método não permitido. Use POST.' });
    }

    // Auth Bearer
    const auth = req.headers.authorization || '';
    const secret = process.env.MY_SECRET_KEY;
    if (!secret || auth !== `Bearer ${secret}`) {
        return res.status(401).json({ error: 'Não autorizado.' });
    }

    // Body
    const { action = 'ping', type = 'text', content = '' } = req.body || {};

    let message;

    switch (action) {
        case 'ping':
            message = 'Conexão estabelecida.';
            break;

        case 'uppercase':
            message = String(content).toUpperCase();
            break;

        case 'lowercase':
            message = String(content).toLowerCase();
            break;

        case 'reverse':
            message = String(content).split('').reverse().join('');
            break;

        case 'analyze':
            message = {
                original: String(content),
                charCount: String(content).length,
                wordCount: String(content).trim()
                    ? String(content).trim().split(/\s+/).length
                    : 0,
            };
            break;

        case 'run-pc': {
            // Chama o agente local no PC via ngrok
            const agentUrl = process.env.PC_AGENT_URL;
            if (!agentUrl) {
                return res.status(503).json({
                    error: 'Agente PC não configurado.',
                    hint: 'Configure a variável PC_AGENT_URL na Vercel com a URL do ngrok.',
                });
            }
            try {
                const agentRes = await fetch(`${agentUrl}/run`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'bypass-tunnel-reminder': 'true',
                    },
                    body: JSON.stringify({ cmd: content, secret }),
                });
                const agentData = await agentRes.json();
                if (!agentRes.ok) {
                    return res.status(agentRes.status).json(agentData);
                }
                message = agentData.output || agentData;
            } catch (err) {
                return res.status(502).json({
                    error: 'Não foi possível conectar ao agente PC.',
                    detail: err.message,
                    hint: 'Verifique se o agente está rodando e o ngrok está ativo.',
                });
            }
            break;
        }

        case 'pc-ping': {
            // Verifica se o agente PC está online
            const agentUrl = process.env.PC_AGENT_URL;
            if (!agentUrl) {
                return res.status(503).json({ error: 'PC_AGENT_URL não configurada.' });
            }
            try {
                const pingRes = await fetch(`${agentUrl}/ping`, {
                    headers: { 'bypass-tunnel-reminder': 'true' },
                });
                const pingData = await pingRes.json();
                message = pingData.ok ? '✅ PC online!' : '❌ PC offline.';
            } catch {
                message = '❌ PC offline ou ngrok inativo.';
            }
            break;
        }

        default:
            return res.status(400).json({ error: `Ação desconhecida: ${action}` });
    }

    return res.status(200).json({
        success: true,
        action,
        type,
        message,
        timestamp: new Date().toISOString(),
    });
}
