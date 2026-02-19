// URL estável do ngrok (atualizar aqui quando reiniciar o ngrok)
const NGROK_URL = process.env.PC_AGENT_URL || 'https://calibred-janay-revealable.ngrok-free.dev';

export default async function handler(req, res) {
    // CORS
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST.' });

    const auth = req.headers.authorization || '';
    const secret = process.env.MY_SECRET_KEY;
    if (!secret || auth !== `Bearer ${secret}`) {
        return res.status(401).json({ error: 'Não autorizado.' });
    }

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
                wordCount: String(content).trim() ? String(content).trim().split(/\s+/).length : 0,
            };
            break;

        case 'run-pc': {
            try {
                const agentRes = await fetch(`${NGROK_URL}/run`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'ngrok-skip-browser-warning': '1',
                    },
                    body: JSON.stringify({ cmd: content, secret }),
                });
                const agentData = await agentRes.json();
                if (!agentRes.ok) return res.status(agentRes.status).json(agentData);
                message = agentData.output || agentData;
            } catch (err) {
                return res.status(502).json({
                    error: 'Não foi possível conectar ao PC.',
                    detail: err.message,
                    url: NGROK_URL,
                });
            }
            break;
        }

        case 'pc-ping': {
            try {
                const pingRes = await fetch(`${NGROK_URL}/ping`, {
                    headers: { 'ngrok-skip-browser-warning': '1' },
                });
                const pingData = await pingRes.json();
                message = pingData.ok ? `✅ PC online!` : '❌ PC offline.';
            } catch {
                message = `❌ PC offline. (${NGROK_URL})`;
            }
            break;
        }

        default:
            return res.status(400).json({ error: `Ação desconhecida: ${action}` });
    }

    return res.status(200).json({ success: true, action, type, message, timestamp: new Date().toISOString() });
}
