# 🚀 Setup Git + GitHub + Vercel — Deploy Automático

**Projeto**: `site-hero-landing`  
**Status**: ✅ Git inicializado e commitado  
**Próximo**: Conectar GitHub + Vercel

---

## ✅ **Passo 1: Git Local** (COMPLETO)

```bash
cd C:\AMD\site-hero-landing
git init                    # ✅ FEITO
git add .                   # ✅ FEITO
git commit -m "init: site-hero-landing - GTA-style landing page with cinematic video scrub"  # ✅ FEITO
```

---

## 📋 **Passo 2: Criar Repositório no GitHub**

### **2.1 No GitHub**:
1. Vai em: https://github.com/new
2. **Repository name**: `site-hero-landing`
3. **Description**: "GTA-style landing page with Rockstar-inspired cinematic video scrub"
4. **Public** ou **Private** (escolha)
5. ⚠️ **NÃO marque**: "Add README", "Add .gitignore", "Choose a license"
6. Clica em **"Create repository"**

### **2.2 Conectar Local → Remoto**:

**Copie seu username do GitHub** e rode:

```bash
# Renomear branch para main
git branch -M main

# Conectar ao GitHub (SUBSTITUA SEU_USUARIO)
git remote add origin https://github.com/SEU_USUARIO/site-hero-landing.git

# Push inicial
git push -u origin main
```

**Se usar SSH** (recomendado):
```bash
git remote add origin git@github.com:SEU_USUARIO/site-hero-landing.git
git push -u origin main
```

---

## 🔗 **Passo 3: Conectar Vercel ao GitHub**

### **3.1 No Dashboard da Vercel**:
1. Vai em: https://vercel.com/dashboard
2. Encontra seu projeto: **site-hero-landing**
3. Clica no projeto → **Settings** → **Git**
4. Clica em **"Connect Git Repository"**
5. Escolhe **GitHub**
6. Autoriza Vercel (se pedir)
7. Seleciona o repositório: **site-hero-landing**
8. **Production Branch**: `main`
9. Salva

---

## 🎯 **Resultado: Deploy Automático**

A partir de agora:

| Ação | Resultado |
|------|-----------|
| `git push origin main` | **Deploy automático em produção** |
| `git push origin feat/teste` | **Preview deploy** (URL temporária) |
| Pull Request → main | **Preview deploy** + deploy em produção após merge |

---

## 🛡️ **Passo 4: Workflow Anti-Caos**

### **Regras Operacionais**:
- ✅ `main` = **produção** (sempre estável)
- ✅ **Toda experimentação** vai em branch
- ✅ Só faz merge quando estiver OK

### **Fluxo de Teste**:

```bash
# 1. Criar branch para experimento
git checkout -b feat/experimento-x

# 2. Editar código
# ... faz mudanças ...

# 3. Commit e push
git add .
git commit -m "feat: experimento x"
git push -u origin feat/experimento-x
```

**Vercel vai criar Preview Deploy automático** para essa branch.

### **Quando estiver bom**:

```bash
# Opção 1: Merge via GitHub (recomendado)
# - Abre PR no GitHub
# - Review
# - Merge → deploy automático em produção

# Opção 2: Merge local
git checkout main
git merge feat/experimento-x
git push origin main
# → deploy automático em produção
```

---

## 🚨 **Passo 5: Blindagem Contra EPIPE**

Você já achou a cura: desativar update check.

**Deixa permanente no Windows**:

```powershell
setx VERCEL_DISABLE_UPDATE_CHECK 1
```

**Fecha e abre o terminal**. Fim do drama do Node 24.

---

## 📊 **Comandos Úteis**

### **Ver status**:
```bash
git status
git log --oneline -5
```

### **Ver branches**:
```bash
git branch -a
```

### **Deletar branch** (após merge):
```bash
git branch -d feat/experimento-x
git push origin --delete feat/experimento-x
```

### **Voltar mudanças** (antes de commit):
```bash
git restore .
```

### **Ver diff**:
```bash
git diff
```

---

## 🎯 **Workflow Completo (Exemplo)**

### **Cenário**: Adicionar nova feature

```bash
# 1. Criar branch
git checkout -b feat/nova-animacao

# 2. Editar código
# ... adiciona animação ...

# 3. Testar local
npm run dev
# Testa em http://localhost:5173/

# 4. Commit
git add .
git commit -m "feat: adiciona animação de fade no footer"

# 5. Push
git push -u origin feat/nova-animacao

# 6. Vercel cria preview deploy automático
# URL: https://site-hero-landing-git-feat-nova-animacao-seu-usuario.vercel.app

# 7. Testa no preview deploy
# Se estiver OK:

# 8. Abre PR no GitHub
# GitHub → Pull Requests → New PR
# Base: main ← Compare: feat/nova-animacao
# Cria PR

# 9. Merge PR
# GitHub → Merge pull request

# 10. Vercel faz deploy automático em produção
# URL: https://site-hero-landing.vercel.app
```

---

## ✅ **Checklist Final**

- [ ] Repositório criado no GitHub
- [ ] `git remote add origin` executado
- [ ] `git push -u origin main` executado
- [ ] Vercel conectado ao GitHub
- [ ] Production branch configurada (`main`)
- [ ] `VERCEL_DISABLE_UPDATE_CHECK=1` setado
- [ ] Testado workflow de branch + preview

---

## 🚀 **Resultado Final**

**Você ganha**:
- ✅ Mexeu, deu push → site atualiza sozinho
- ✅ Quer testar coisa arriscada → branch + preview
- ✅ Produção fica estável, laboratório fica livre
- ✅ Zero "devops". Só engenharia mínima.

---

## 📝 **Comandos Prontos (Copiar e Colar)**

```bash
# Conectar ao GitHub (SUBSTITUA SEU_USUARIO)
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/site-hero-landing.git
git push -u origin main

# Blindagem EPIPE
setx VERCEL_DISABLE_UPDATE_CHECK 1

# Workflow de teste
git checkout -b feat/teste
# ... edita código ...
git add .
git commit -m "feat: teste"
git push -u origin feat/teste
# → Preview deploy automático na Vercel
```

---

**Pronto. Agora você é dono do fluxo, não o contrário.** 🚀
