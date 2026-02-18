import express from 'express';
import { exec } from 'child_process';

const app = express();
app.use(express.json());

const SECRET = process.env.AGENT_SECRET || 'biglion_fic4';
const PORT = process.env.PORT || 3333;

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

    // Autenticação
    if (!secret || secret !== SECRET) {
        return res.status(401).json({ error: 'Não autorizado.' });
    }

    // Validação do comando
    if (!cmd) {
        return res.status(400).json({ error: 'Comando não fornecido.' });
    }

    // Verifica whitelist (segurança)
    const isAllowed = ALLOWED_COMMANDS.some(allowed =>
        cmd.toLowerCase().startsWith(allowed.toLowerCase())
    );

    if (!isAllowed) {
        return res.status(403).json({
            error: 'Comando não permitido.',
            allowed: ALLOWED_COMMANDS,
        });
    }

    // Executa o comando via PowerShell
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

app.listen(PORT, () => {
    console.log(`\n✅ Agente PC rodando em http://localhost:${PORT}`);
    console.log(`   Ping: http://localhost:${PORT}/ping`);
    console.log(`   Run:  POST http://localhost:${PORT}/run`);
    console.log(`\n⚠️  Mantenha essa janela aberta enquanto usar pelo iPhone.\n`);
});
