import express from 'express';
import { exec } from 'child_process';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
app.use(express.json());
app.use(cors()); // Habilita CORS oficial

app.use(express.static('public'));

// Configurações e Segredos
const SECRET = 'biglion_fic4';
const PORT = 3333; // Porta fixa

// Whitelist de comandos permitidos
const ALLOWED = [
    'git', 'npm', 'dir', 'whoami', 'hostname', 'ipconfig', 'tasklist', 'systeminfo',
    'Get-Process', 'Get-Date',
    'shutdown',   // Desligar/Reiniciar
    'rundll32',   // Bloquear tela
    'start',      // Abrir App
    'powershell', // Scripts PS
    '[console]::beep' // Alarme
];

app.get('/ping', (req, res) => {
    res.json({ ok: true, agent: 'PC Agent', timestamp: new Date().toISOString() });
});

app.get('/cam', (req, res) => {
    // Captura imagem
    exec(`powershell -ExecutionPolicy Bypass -File scripts/cam.ps1`, (err) => {
        if (err) console.error('Erro na cam:', err.message);
        // Tenta enviar a imagem mesmo se der erro (pode ser imagem antiga ou erro de busy)
        res.sendFile('public/cam.jpg', { root: __dirname });
    });
});

app.post('/run-script', (req, res) => {
    const { script, args, secret } = req.body || {};
    if (!secret || secret !== SECRET) return res.status(401).json({ error: 'Não autorizado.' });

    const SAFE_SCRIPTS = ['timer.ps1', 'media.ps1'];
    if (!SAFE_SCRIPTS.includes(script)) return res.status(403).json({ error: 'Script inválido.' });

    const cmd = `powershell -ExecutionPolicy Bypass -File scripts/${script} "${args || ''}"`;
    console.log(`📜 Executando script: ${script} ${args}`);

    exec(cmd, { timeout: 30000 }, (err, stdout, stderr) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, output: stdout.trim() });
    });
});

app.post('/run', (req, res) => {
    const { cmd, secret } = req.body || {};
    if (!secret || secret !== SECRET) return res.status(401).json({ error: 'Não autorizado.' });
    if (!cmd) return res.status(400).json({ error: 'Comando não fornecido.' });

    // Verificação relaxada para permitir argumentos
    const cmdRoot = cmd.split(' ')[0];
    const allowed = ALLOWED.some(a => cmd.toLowerCase().startsWith(a.toLowerCase()));

    if (!allowed) return res.status(403).json({ error: 'Comando não permitido.', allowed: ALLOWED });

    console.log(`⚡ Executando: ${cmd}`);
    exec(`powershell -Command "${cmd}"`, { timeout: 10000 }, (err, stdout, stderr) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, command: cmd, output: stdout.trim() || stderr.trim() || '(sem output)' });
    });
});

app.listen(PORT, () => {
    console.log(`✅ Agente rodando em http://localhost:${PORT}`);
    console.log(`🔒 Aguardando comandos via Ngrok...`);
});

// (Funções de túnel removidas - usando ngrok externo)
