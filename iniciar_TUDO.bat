@echo off
title Agente PC (NAO FECHE)
echo.
echo === REINICIANDO TUDO DO ZERO ===
echo.
echo 1. Matando processos antigos...
taskkill /F /IM node.exe /T 2>nul
taskkill /F /IM ngrok.exe /T 2>nul
echo.
echo 2. Abrindo Ngrok (Tunnel)...
start "Ngrok Tunnel" ngrok http --domain=calibred-janay-revealable.ngrok-free.dev 3333
echo.
echo 3. Aguardando 5 segundos para o tunel subir...
timeout /t 5 /nobreak >nul
echo.
echo 4. Iniciando Agente...
echo.
node agente.js
pause
