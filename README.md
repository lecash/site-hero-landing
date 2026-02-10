# Site Hero

Base canônica para landing pages com Vite vanilla. Arquitetura limpa, performance real, zero dependências ocultas.

## 🚀 Quick Start

```bash
npm install
npm run dev
```

Acesse: http://localhost:5173

## 📦 Scripts

```bash
npm run dev      # Dev server (porta 5173)
npm run build    # Build de produção
npm run preview  # Preview da build (porta 4173)
```

## 🎯 Stack

- **Vite** 7.2.4 - Build tool
- **HTML5** - Semântico
- **CSS3** - Vanilla, sem frameworks
- **JavaScript** - Vanilla ES6+

## 📊 Performance

- Build time: ~87ms
- CSS gzipped: ~0.95kB
- JS gzipped: ~0.45kB
- Lighthouse: 90+ (estimado)

## 🏗️ Estrutura

```
site-hero-landing/
├── dist/           # Build de produção
├── public/         # Assets estáticos
├── src/
│   ├── style.css  # CSS completo
│   └── main.js    # Bootstrap mínimo
├── index.html     # HTML semântico
└── vite.config.js # Config Vite
```

## ✨ Features

- ✅ Tipografia responsiva com `clamp()`
- ✅ Microinterações suaves
- ✅ Contraste WCAG AA
- ✅ Focus visible (acessibilidade)
- ✅ Mobile-first design
- ✅ SEO básico otimizado

## 🎨 Customização

### Cores

Edite `src/style.css`:

```css
:root {
  --bg: #0b0d12;
  --surface: #121521;
  --text: #f8fafc;
  --muted: #b4bac8;
  --accent: #6ee7ff;
}
```

### Conteúdo

Edite `index.html` diretamente.

## 📝 Licença

MIT
