# Manual de Uso: Controle do PC pelo iPhone

## 1. Como manter funcionando
1. **INICIAR TUDO**: Dê dois cliques no arquivo `iniciar_TUDO.bat` (ele abrirá as duas janelas).
2. **Mantenha aberto**: Você verá duas janelas pretas (Agente e Ngrok). Pode minimizar, mas não feche.

## 2. Configuração do Atalho no iPhone
- **URL**: `https://site-hero-landing.vercel.app/api/ios-shortcut`
- **Método**: `POST`
- **Headers (Cabeçalhos)**:
  - `Content-Type`: `application/json`
  - `Authorization`: `Bearer biglion_fic4`
- **Corpo da Solicitação (JSON)**:
  - `action`: `run-pc`
  - `content`: `Get-Date` (ou outro comando)

## 3. Comandos Úteis
No campo `content`, você pode usar estes comandos:

| Comando | O que faz |
|---|---|
| `Get-Date` | Mostra data e hora atuais do PC |
| `whoami` | Mostra o usuário logado |
| `ipconfig` | Mostra informações de rede |
| `tasklist` | Lista programas abertos |
| `shutdown /s /t 0` | Desliga o PC imediatamente |
| `shutdown /r /t 0` | Reinicia o PC |

## 4. Troubleshooting (Se parar de funcionar)
1. **Verifique as janelas**: O agente e o ngrok estão abertos?
2. **Verifique a URL do ngrok**:
   - Olhe na janela do ngrok a linha `Forwarding`.
   - Se for `https://calibred-janay-revealable.ngrok-free.dev`, está tudo certo.
   - Se mudar, avise o assistente para atualizar o código.
