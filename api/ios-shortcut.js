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
