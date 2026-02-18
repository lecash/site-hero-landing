export default function handler(req, res) {
    // Configuração de CORS para permitir que qualquer origem (como um atalho iOS) acesse
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    // Trata requisições OPTIONS (preflight) imediatamente
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    // normaliza os parametros de entrada (suporta query string ou body JSON)
    let text = req.query.text || '';
    let action = req.query.action || 'analyze';

    // Se for POST/PUT/PATCH, tenta pegar do corpo
    if (['POST', 'PUT', 'PATCH'].includes(req.method) && req.body) {
        // Vercel serverless functions parseiam JSON automaticamente se o header Content-Type for application/json
        // Mas garantimos aqui caso venha diferente
        const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;

        if (body.text) text = body.text;
        if (body.action) action = body.action;
    }

    if (!text && ['GET', 'POST', 'PUT', 'PATCH'].includes(req.method)) {
        return res.status(400).json({
            error: 'Texto não fornecido',
            hint: 'Envie "text" na query string (GET) ou no corpo JSON (POST)',
            received: { query: req.query, body: req.body, method: req.method }
        });
    }

    // Processamento simples para demonstração
    const result = {
        original: text,
        processed: '',
        stats: {
            charCount: text ? text.length : 0,
            wordCount: text ? text.split(/\s+/).filter(w => w.length > 0).length : 0,
            timestamp: new Date().toISOString(),
            method: req.method
        }
    };

    switch (action) {
        case 'uppercase':
            result.processed = text.toUpperCase();
            break;
        case 'lowercase':
            result.processed = text.toLowerCase();
            break;
        case 'reverse':
            result.processed = text.split('').reverse().join('');
            break;
        case 'analyze':
        default:
            result.processed = text; // Apenas retorna o original na análise
            break;
    }

    res.status(200).json(result);
}
