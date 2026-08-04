const BEFORE_STATES = {
  coach: {
    src: "./assets/before-ai-coach.jpg",
    alt: "旧版 AI 教练页面",
    caption: "AI 教练 · 原始界面",
  },
  trainer: {
    src: "./assets/before-private-trainer.jpg",
    alt: "旧版预约私教页面",
    caption: "预约私教 · 原始界面",
  },
};

export function getBeforeState(nav) {
  return BEFORE_STATES[nav] ?? null;
}

export function shouldAutoplayPortfolioVideo({ isDesktop, reducedMotion, isIntersecting }) {
  return isDesktop === true && reducedMotion === false && isIntersecting === true;
}

function subscribeMediaQuery(query, handler) {
  if (typeof query?.addEventListener === "function") {
    query.addEventListener("change", handler);
    return () => query.removeEventListener?.("change", handler);
  }

  if (typeof query?.addListener === "function") {
    query.addListener(handler);
    return () => query.removeListener?.(handler);
  }

  return () => {};
}

export function setupPortfolioShowcase({ app, reducedMotion }) {
  if (!app?.addEventListener) return () => {};

  const documentRef = app.ownerDocument;
  const windowRef = documentRef?.defaultView;
  const before = documentRef?.querySelector(".portfolio-before");
  const beforeImage = documentRef?.querySelector("#portfolioBeforeImage");
  const beforeCaption = documentRef?.querySelector("#portfolioBeforeCaption");
  const videos = Array.from(documentRef?.querySelectorAll(".portfolio-video") ?? []);

  if (!windowRef?.matchMedia || !before || !beforeImage || !beforeCaption) return () => {};

  const desktopQuery = windowRef.matchMedia("(min-width: 900px)");
  let activeNav = "coach";
  let switchTimer = null;
  let observer = null;
  const intersectionStates = new Map(videos.map((video) => [video, false]));

  const isReducedMotion = () => reducedMotion?.matches === true;
  const isDesktop = () => desktopQuery.matches === true;

  function cancelBeforeTransition() {
    windowRef.clearTimeout(switchTimer);
    switchTimer = null;
    before.classList.remove("is-switching");
  }

  function applyBeforeState() {
    const nextState = getBeforeState(activeNav);
    if (!nextState || !isDesktop()) return;

    const updateContent = () => {
      if (beforeImage.getAttribute("src") !== nextState.src) beforeImage.src = nextState.src;
      if (beforeImage.alt !== nextState.alt) beforeImage.alt = nextState.alt;
      if (beforeCaption.textContent !== nextState.caption) beforeCaption.textContent = nextState.caption;
      before.classList.remove("is-switching");
      switchTimer = null;
    };

    cancelBeforeTransition();
    if (isReducedMotion()) {
      updateContent();
      return;
    }

    before.classList.add("is-switching");
    switchTimer = windowRef.setTimeout(updateContent, 120);
  }

  function refreshVideo(video) {
    const shouldAutoplay = shouldAutoplayPortfolioVideo({
      isDesktop: isDesktop(),
      reducedMotion: isReducedMotion(),
      isIntersecting: intersectionStates.get(video) === true,
    });

    if (shouldAutoplay) {
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  }

  function refreshVideos() {
    if (observer) {
      videos.forEach(refreshVideo);
      return;
    }

    if (!isDesktop() || isReducedMotion()) videos.forEach((video) => video.pause());
  }

  function handleNavigation(event) {
    const button = event.target?.closest?.('button[data-action="nav-tap"]');
    const nextNav = button?.dataset.nav;
    const nextState = getBeforeState(nextNav);
    if (!nextState || nextNav === activeNav) return;

    activeNav = nextNav;
    applyBeforeState();
  }

  function handleMediaChange() {
    if (isDesktop()) {
      applyBeforeState();
    } else {
      cancelBeforeTransition();
    }
    refreshVideos();
  }

  app.addEventListener("click", handleNavigation);
  const unsubscribeDesktopQuery = subscribeMediaQuery(desktopQuery, handleMediaChange);
  const unsubscribeReducedMotion = subscribeMediaQuery(reducedMotion, handleMediaChange);

  if (typeof windowRef.IntersectionObserver === "function") {
    observer = new windowRef.IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const isIntersecting = entry.isIntersecting && entry.intersectionRatio >= 0.15;
          if (intersectionStates.get(entry.target) === isIntersecting) continue;
          intersectionStates.set(entry.target, isIntersecting);
          refreshVideo(entry.target);
        }
      },
      { rootMargin: "120px 0px", threshold: 0.15 },
    );
    videos.forEach((video) => observer.observe(video));
  }

  return () => {
    cancelBeforeTransition();
    app.removeEventListener("click", handleNavigation);
    unsubscribeDesktopQuery();
    unsubscribeReducedMotion();
    observer?.disconnect();
    videos.forEach((video) => video.pause());
  };
}
