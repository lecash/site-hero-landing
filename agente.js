import express from 'express';
import { exec } from 'child_process';
import ngrok from '@ngrok/ngrok';

const app = express();
app.use(express.json());

const SECRET = process.env.AGENT_SECRET || 'biglion_fic4';
const PORT = 3333;
const NGROK_TOKEN = process.env.NGROK_AUTHTOKEN || '39rUletKkQ8dFLXm6sQRjnXS2EA_59kaXGCMWSvHcTrPCs5mg';

// Comandos permitidos (whitelist de segurança)
const ALLOWED_COMMANDS = [
    'git status',
    'git log --oneline -5',
    'npm run build',
    'npm run dev',
    'Get-Process',
    'Get-Date',
    'dir',
    'ls',
    'whoami',
    'hostname',
    'ipconfig',
    'tasklist',
    'systeminfo',
];

app.get('/ping', (req, res) => {
    res.json({ ok: true, agent: 'PC Agent', timestamp: new Date().toISOString() });
});

app.post('/run', (req, res) => {
    const { cmd, secret } = req.body || {};

    if (!secret || secret !== SECRET) {
        return res.status(401).json({ error: 'Não autorizado.' });
    }

    if (!cmd) {
        return res.status(400).json({ error: 'Comando não fornecido.' });
    }

    const isAllowed = ALLOWED_COMMANDS.some(allowed =>
        cmd.toLowerCase().startsWith(allowed.toLowerCase())
    );

    if (!isAllowed) {
        return res.status(403).json({
            error: 'Comando não permitido.',
            allowed: ALLOWED_COMMANDS,
        });
    }

    exec(`powershell -Command "${cmd}"`, { timeout: 10000 }, (err, stdout, stderr) => {
        if (err) {
            return res.status(500).json({ error: err.message, stderr });
        }
        res.json({
            success: true,
            command: cmd,
            output: stdout.trim() || stderr.trim() || '(sem output)',
            timestamp: new Date().toISOString(),
        });
    });
});

// Inicia servidor e ngrok
app.listen(PORT, async () => {
    console.log(`\n✅ Agente PC rodando em http://localhost:${PORT}`);

    try {
        const listener = await ngrok.forward({
            addr: PORT,
            authtoken: NGROK_TOKEN,
        });
        const url = listener.url();
        console.log(`\n🌐 URL pública ngrok: ${url}`);
        console.log(`\n👉 COPIE ESSA URL e configure na Vercel como PC_AGENT_URL`);
        console.log(`   Comando: npx vercel env rm PC_AGENT_URL production --yes && echo "${url}" | npx vercel env add PC_AGENT_URL production`);
        console.log(`\n⚠️  Mantenha essa janela aberta enquanto usar pelo iPhone.\n`);
    } catch (err) {
        console.error(`\n❌ ngrok falhou: ${err.message}`);
        console.log(`   URL local apenas: http://localhost:${PORT}`);
        console.log(`   Use localtunnel como alternativa: npx localtunnel --port ${PORT}\n`);
    }
});
