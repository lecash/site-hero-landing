import express from 'express';
import { exec, execSync } from 'child_process';
import localtunnel from 'localtunnel';
import https from 'https';

const app = express();
app.use(express.json());

const SECRET = 'biglion_fic4';
const PORT = 3333;

// ID do Gist público onde a URL atual do tunnel é salva
// A API da Vercel lê esse Gist para descobrir onde está o agente
const GIST_ID = process.env.GIST_ID;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

const ALLOWED = [
    'git status', 'git log --oneline', 'npm run build',
    'Get-Process', 'Get-Date', 'dir', 'whoami', 'hostname',
    'ipconfig', 'tasklist', 'systeminfo',
];

app.get('/ping', (req, res) => {
    res.json({ ok: true, agent: 'PC Agent', timestamp: new Date().toISOString() });
});

app.post('/run', (req, res) => {
    const { cmd, secret } = req.body || {};
    if (!secret || secret !== SECRET) return res.status(401).json({ error: 'Não autorizado.' });
    if (!cmd) return res.status(400).json({ error: 'Comando não fornecido.' });
    const allowed = ALLOWED.some(a => cmd.toLowerCase().startsWith(a.toLowerCase()));
    if (!allowed) return res.status(403).json({ error: 'Comando não permitido.', allowed: ALLOWED });
    exec(`powershell -Command "${cmd}"`, { timeout: 10000 }, (err, stdout, stderr) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, command: cmd, output: stdout.trim() || stderr.trim() || '(sem output)', timestamp: new Date().toISOString() });
    });
});

app.listen(PORT, () => {
    console.log(`✅ Agente rodando em http://localhost:${PORT}`);
    iniciarTunnel();
});

function warmupTunnel(url) {
    try {
        const target = new URL(`${url}/ping`);
        https.get({ hostname: target.hostname, path: '/ping', method: 'GET', headers: { 'bypass-tunnel-reminder': 'true' } }, (res) => {
            console.log(`🔥 Warmup: ${res.statusCode}`);
        }).on('error', () => { });
    } catch { }
}

async function publicarUrlNoGist(url) {
    if (!GIST_ID || !GITHUB_TOKEN) {
        console.log(`⚠️  GIST_ID ou GITHUB_TOKEN não configurado. URL não publicada no Gist.`);
        return;
    }
    const body = JSON.stringify({
        files: { 'agent-url.txt': { content: url } }
    });
    const opts = {
        hostname: 'api.github.com',
        path: `/gists/${GIST_ID}`,
        method: 'PATCH',
        headers: {
            'Authorization': `Bearer ${GITHUB_TOKEN}`,
            'Content-Type': 'application/json',
            'User-Agent': 'AgentPC/1.0',
            'Content-Length': Buffer.byteLength(body),
        },
    };
    const req = https.request(opts, (res) => {
        console.log(`📡 Gist atualizado: ${res.statusCode} — URL: ${url}`);
    });
    req.on('error', (e) => console.error(`❌ Erro ao atualizar Gist: ${e.message}`));
    req.write(body);
    req.end();
}

async function iniciarTunnel(tentativa = 1) {
    try {
        const tunnel = await localtunnel({ port: PORT });
        const url = tunnel.url;
        console.log(`\n🌐 URL pública: ${url}\n`);

        // Aquece o tunnel para eliminar bloqueio de confirmação
        setTimeout(() => warmupTunnel(url), 1000);
        const keepAlive = setInterval(() => warmupTunnel(url), 4 * 60 * 1000);

        // Publica URL no Gist e tenta atualizar Vercel
        setTimeout(() => publicarUrlNoGist(url), 2000);

        tunnel.on('close', () => {
            clearInterval(keepAlive);
            console.log(`\n⚠️  Tunnel fechou. Reconectando em 3s...`);
            setTimeout(() => iniciarTunnel(1), 3000);
        });

        tunnel.on('error', () => {
            clearInterval(keepAlive);
            setTimeout(() => iniciarTunnel(tentativa + 1), 5000);
        });

    } catch (err) {
        const espera = Math.min(tentativa * 5, 30);
        console.log(`❌ Tunnel falhou (${tentativa}). Tentando em ${espera}s...`);
        setTimeout(() => iniciarTunnel(tentativa + 1), espera * 1000);
    }
}
