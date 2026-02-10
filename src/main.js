import "./style.css";

(() => {
  const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;

  // ===== ELEMENTS =====
  const loader = document.getElementById("appLoader");
  const header = document.querySelector(".siteHeader");
  const progressBar = document.querySelector(".scrollBar");
  const heroBg = document.querySelector(".heroBg");
  const scrollIndicator = document.querySelector(".scroll-indicator");

  // ===== LOADER =====
  document.documentElement.classList.add("is-loading");
  document.body.classList.add("is-loading");

  function setReady() {
    document.documentElement.classList.remove("is-loading");
    document.body.classList.remove("is-loading");
    document.documentElement.classList.add("is-ready");
    document.body.classList.add("is-ready");
  }

  function hideLoader() {
    if (!loader) {
      setReady();
      return;
    }
    loader.classList.add("is-hidden");
    loader.setAttribute("aria-busy", "false");
    setReady();
    window.setTimeout(() => loader.remove(), 450);
  }

  window.addEventListener("load", hideLoader, { once: true });
  window.setTimeout(hideLoader, 2500);

  // ===== YEAR =====
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  // ===== SMOOTH ANCHOR =====
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener("click", (e) => {
      const id = a.getAttribute("href");
      const el = id ? document.querySelector(id) : null;
      if (!el) return;
      e.preventDefault();
      el.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
    });
  });

  // ===== REVEAL + CASCADE =====
  const revealEls = Array.from(document.querySelectorAll(".reveal"));
  revealEls.forEach((el, i) => {
    const custom = el.getAttribute("data-delay");
    const ms = custom ? Number(custom) : Math.min(i * 90, 360);
    el.style.transitionDelay = reduceMotion ? "0ms" : `${ms}ms`;
  });

  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          e.target.classList.add("is-visible");
          io.unobserve(e.target);
        }
      }
    },
    { threshold: 0.15, rootMargin: "0px 0px -50px 0px" }
  );
  revealEls.forEach((el) => io.observe(el));

  // ===== CINEMATIC (VIDEO SCRUB) =====
  const cinematic = document.getElementById("cinematic");
  const video = document.getElementById("scrubVideo");
  const rewatchBtn = document.getElementById("rewatchBtn");
  const cinKicker = document.getElementById("cinKicker");
  const cinTitle = document.getElementById("cinTitle");
  const cinText = document.getElementById("cinText");
  const cinematicCard = document.querySelector(".cinematicCard");

  const chapters = [
    {
      t: 0.05,
      kicker: "Vice City, USA.",
      title: "O scroll controla a cena.",
      text: "Você rola e o vídeo avança. Sem botão play. Sem frescura.",
    },
    {
      t: 0.38,
      kicker: "Pinned section",
      title: "A seção fica presa.",
      text: "Enquanto você rola, a timeline muda. O conteúdo por cima acompanha.",
    },
    {
      t: 0.70,
      kicker: "Rewatch",
      title: "Rever é instantâneo.",
      text: "Um clique: volta pro começo. A página te leva junto.",
    },
  ];

  function clamp01(n) {
    return Math.max(0, Math.min(1, n));
  }

  function getSectionProgress(sectionEl) {
    const r = sectionEl.getBoundingClientRect();
    const vh = window.innerHeight;
    const total = r.height - vh;
    if (total <= 0) return 0;
    return clamp01((-r.top) / total);
  }

  let currentChapterIndex = 0;

  function applyChapter(p) {
    let chosen = chapters[0];
    let chosenIndex = 0;
    for (let i = 0; i < chapters.length; i++) {
      if (p >= chapters[i].t) {
        chosen = chapters[i];
        chosenIndex = i;
      }
    }

    // Se mudou de capítulo, aplica transição
    if (chosenIndex !== currentChapterIndex) {
      currentChapterIndex = chosenIndex;

      if (cinematicCard && !reduceMotion) {
        cinematicCard.classList.add("is-shifting");

        setTimeout(() => {
          if (cinKicker) cinKicker.textContent = chosen.kicker;
          if (cinTitle) cinTitle.textContent = chosen.title;
          if (cinText) cinText.textContent = chosen.text;

          setTimeout(() => {
            cinematicCard.classList.remove("is-shifting");
          }, 50);
        }, 110);
      } else {
        // Sem animação se reduceMotion
        if (cinKicker) cinKicker.textContent = chosen.kicker;
        if (cinTitle) cinTitle.textContent = chosen.title;
        if (cinText) cinText.textContent = chosen.text;
      }
    }
  }

  function scrubVideo(p) {
    if (!video) return;
    if (!Number.isFinite(video.duration) || video.duration <= 0) return;
    const safe = 0.02 + p * 0.96;
    video.currentTime = safe * video.duration;
  }

  async function warmupVideo() {
    if (!video) return;
    try {
      video.muted = true;
      video.playsInline = true;
      await video.play();
      video.pause();
    } catch {
      // Autoplay bloqueado, ok
    }
  }

  // ===== SCROLL ENGINE (UNIFIED RAF LOOP) =====
  let ticking = false;

  function update() {
    ticking = false;
    const y = window.scrollY || 0;

    // Header state
    if (header) header.classList.toggle("is-scrolled", y > 8);

    // Progress bar
    if (progressBar) {
      const doc = document.documentElement;
      const max = doc.scrollHeight - doc.clientHeight;
      const p = max > 0 ? clamp01(y / max) : 0;
      progressBar.style.width = `${p * 100}%`;
    }

    // Parallax
    if (heroBg && !reduceMotion) {
      heroBg.style.transform = `translateY(${y * 0.12}px)`;
    }

    // Scroll indicator fade
    if (scrollIndicator) {
      scrollIndicator.style.opacity = y > 20 ? "0" : "0.9";
      scrollIndicator.style.transition = "opacity 220ms ease";
    }

    // Cinematic scrub
    if (cinematic) {
      const p = getSectionProgress(cinematic);
      applyChapter(p);
      if (!reduceMotion) scrubVideo(p);
    }
  }

  function onScroll() {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(update);
    }
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  update();

  // Cinematic warmup
  if (cinematic && video) {
    video.addEventListener("loadedmetadata", () => {
      warmupVideo();
      update();
    }, { once: true });
  }

  // Rewatch button
  if (rewatchBtn && cinematic) {
    rewatchBtn.addEventListener("click", () => {
      cinematic.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
      if (video && Number.isFinite(video.duration) && video.duration > 0) {
        video.currentTime = 0;
      }
      applyChapter(0);
    });
  }
})();
