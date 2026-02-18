export default async function handler(req, res) {
    // CORS — permite chamadas do app Atalhos iOS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    // Preflight
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Apenas POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método não permitido. Use POST.' });
    }

    // Autenticação Bearer
    const auth = req.headers.authorization || '';
    const secret = process.env.MY_SECRET_KEY;
    if (!secret || auth !== `Bearer ${secret}`) {
        return res.status(401).json({ error: 'Não autorizado.' });
    }

    // Lê o corpo
    const { action = 'ping', type = 'text', content = '' } = req.body || {};

    let message;
    switch (action) {
        case 'ping':
            message = 'Conexão estabelecida.';
            break;
        case 'uppercase':
            message = content.toUpperCase();
            break;
        case 'lowercase':
            message = content.toLowerCase();
            break;
        case 'reverse':
            message = content.split('').reverse().join('');
            break;
        case 'analyze':
            message = {
                original: content,
                charCount: content.length,
                wordCount: content.split(/\s+/).filter(w => w.length > 0).length,
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
