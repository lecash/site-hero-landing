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

    const { text = '', action = 'analyze' } = req.query;

    if (!text && req.method === 'GET') {
        return res.status(400).json({
            error: 'Texto não fornecido',
            hint: 'Adicione ?text=SeuTextoAqui na URL'
        });
    }

    // Processamento simples para demonstração
    const result = {
        original: text,
        processed: '',
        stats: {
            charCount: text.length,
            wordCount: text.split(/\s+/).filter(w => w.length > 0).length,
            timestamp: new Date().toISOString()
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
