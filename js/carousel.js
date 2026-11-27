/* ==========================================================================
   CanteenQ / Kantin POLIJE - Reusable 12-Stall Carousel Controller
   Smooth directional slide-left transition, calibrated stall framing,
   arrows, 12 indicator dots, Jeda/Lanjut toggle, touch swipe & keyboard
   ========================================================================== */

(function () {
  "use strict";

  const SLIDE_DURATION_MS = 560;

  function initStallCarousel(rootEl, options) {
    const stalls = window.CANTEEN_STALLS || [];
    if (!rootEl || !stalls.length) return null;

    const opts = Object.assign(
      {
        initialIndex: 0,
        autoplay: false,
        animateSlide: true,
        wideFraming: false,
        intervalMs: 4000,
        linkToDetail: false,
        onChange: null,
      },
      options || {}
    );

    const stageEl = rootEl.querySelector(".stall-photo-link");
    let activePhotoEl = rootEl.querySelector("[data-carousel-photo]");
    const linkEl = rootEl.querySelector("[data-carousel-link]");
    const badgeEl = rootEl.querySelector("[data-carousel-badge]");
    const prevBtn = rootEl.querySelector("[data-carousel-prev]");
    const nextBtn = rootEl.querySelector("[data-carousel-next]");
    const dotsWrap = rootEl.querySelector("[data-carousel-dots]");
    const statusEl = rootEl.querySelector("[data-carousel-status]");
    const playbackBtn = rootEl.querySelector("[data-carousel-playback]");
    const mediaBox = rootEl.querySelector(".stall-media");

    let currentIndex = Math.max(0, Math.min(opts.initialIndex, stalls.length - 1));
    const prefersReducedMotion =
      window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let isPlaying = Boolean(opts.autoplay) && !prefersReducedMotion;
    let timerId = null;
    let cleanupSlideTimer = null;
    const preloadedSrcs = new Set();

    function preloadAdjacent(index) {
      const neighbors = [
        stalls[(index + 1) % stalls.length],
        stalls[(index - 1 + stalls.length) % stalls.length],
      ];
      neighbors.forEach((stall) => {
        if (!stall || !stall.photo || preloadedSrcs.has(stall.photo)) return;
        preloadedSrcs.add(stall.photo);
        const img = new Image();
        img.src = stall.photo;
      });
    }

    function applyPhotoMeta(imgEl, stall) {
      imgEl.src = stall.photo;
      imgEl.alt = "Foto stan " + stall.name + " di Kantin Politeknik Negeri Jember";
      const pos = opts.wideFraming
        ? stall.widePhotoPosition || stall.photoPosition || "50% 24%"
        : stall.photoPosition || "50% 25%";
      imgEl.style.objectPosition = pos;
    }

    function finalizePendingSlide() {
      if (cleanupSlideTimer !== null) {
        window.clearTimeout(cleanupSlideTimer);
        cleanupSlideTimer = null;
      }
      if (!stageEl) return;
      const imgs = Array.from(stageEl.querySelectorAll("img.stall-photo"));
      imgs.forEach((img) => {
        if (img !== activePhotoEl) {
          img.remove();
        }
      });
      if (activePhotoEl) {
        activePhotoEl.classList.remove("is-sliding");
        activePhotoEl.style.transform = "";
      }
    }

    function transitionPhoto(stall, slideDirection) {
      if (!activePhotoEl) return;

      if (!stageEl || !opts.animateSlide || !slideDirection || prefersReducedMotion) {
        finalizePendingSlide();
        applyPhotoMeta(activePhotoEl, stall);
        return;
      }

      finalizePendingSlide();

      const outgoingEl = activePhotoEl;
      const incomingEl = document.createElement("img");
      incomingEl.className = "stall-photo";
      incomingEl.setAttribute("data-carousel-photo", "");
      incomingEl.width = 696;
      incomingEl.height = 352;
      incomingEl.decoding = "async";
      applyPhotoMeta(incomingEl, stall);

      // Slide left: outgoing 0 -> -100%, incoming +100% -> 0
      // Slide right: outgoing 0 -> +100%, incoming -100% -> 0
      const enterFrom = slideDirection === "right" ? "-100%" : "100%";
      const exitTo = slideDirection === "right" ? "100%" : "-100%";

      outgoingEl.removeAttribute("data-carousel-photo");
      outgoingEl.style.transform = "translate3d(0, 0, 0)";
      incomingEl.style.transform = "translate3d(" + enterFrom + ", 0, 0)";

      stageEl.appendChild(incomingEl);
      activePhotoEl = incomingEl;

      // Force layout flush so the starting transform commits before transition begins
      void incomingEl.offsetWidth;

      outgoingEl.classList.add("is-sliding");
      incomingEl.classList.add("is-sliding");
      outgoingEl.style.transform = "translate3d(" + exitTo + ", 0, 0)";
      incomingEl.style.transform = "translate3d(0, 0, 0)";

      const finish = () => {
        if (cleanupSlideTimer !== null) {
          window.clearTimeout(cleanupSlideTimer);
          cleanupSlideTimer = null;
        }
        outgoingEl.removeEventListener("transitionend", onEnd);
        if (outgoingEl.parentNode) {
          outgoingEl.remove();
        }
        incomingEl.classList.remove("is-sliding");
        incomingEl.style.transform = "";
      };

      const onEnd = (event) => {
        if (event.propertyName === "transform") {
          finish();
        }
      };

      outgoingEl.addEventListener("transitionend", onEnd);
      cleanupSlideTimer = window.setTimeout(finish, SLIDE_DURATION_MS + 90);
    }

    // Build 12 passive visual indicator markers (penanda saja)
    const dotMarkers = [];
    if (dotsWrap) {
      dotsWrap.innerHTML = "";
      stalls.forEach(() => {
        const dot = document.createElement("span");
        dot.className = "carousel-dot";
        dot.setAttribute("aria-hidden", "true");
        dotsWrap.appendChild(dot);
        dotMarkers.push(dot);
      });
    }

    function updatePlaybackButton() {
      if (!playbackBtn) return;
      playbackBtn.textContent = isPlaying ? "Jeda" : "Lanjut";
      playbackBtn.setAttribute("aria-pressed", String(!isPlaying));
      playbackBtn.setAttribute(
        "aria-label",
        isPlaying ? "Jeda pergantian foto stan otomatis" : "Lanjutkan pergantian foto stan otomatis"
      );
    }

    function render(triggerCallback, slideDirection) {
      const stall = stalls[currentIndex];
      if (!stall) return;

      transitionPhoto(stall, slideDirection);
      preloadAdjacent(currentIndex);

      if (badgeEl) {
        badgeEl.textContent = stall.name;
      }

      if (statusEl) {
        statusEl.textContent = "Stan " + (currentIndex + 1) + " dari " + stalls.length + ": " + stall.name;
      }

      if (linkEl && opts.linkToDetail) {
        linkEl.href = "MenuStan.html?stan=" + encodeURIComponent(stall.slug);
        linkEl.setAttribute("aria-label", "Lihat detail menu " + stall.name);
      }

      dotMarkers.forEach((dot, idx) => {
        dot.classList.toggle("is-active", idx === currentIndex);
      });

      if (triggerCallback && typeof opts.onChange === "function") {
        opts.onChange(stall, currentIndex);
      }
    }

    function stopTimer() {
      if (timerId !== null) {
        window.clearInterval(timerId);
        timerId = null;
      }
    }

    function startTimer() {
      stopTimer();
      if (!isPlaying) return;
      timerId = window.setInterval(() => {
        goTo((currentIndex + 1) % stalls.length, false, "left");
      }, opts.intervalMs);
    }

    function goTo(index, userInitiated, slideDirection) {
      const nextIndex = ((index % stalls.length) + stalls.length) % stalls.length;
      if (nextIndex === currentIndex) return;
      const dir = slideDirection || (nextIndex > currentIndex ? "left" : "right");
      currentIndex = nextIndex;
      render(true, dir);
      if (userInitiated && isPlaying) {
        startTimer();
      }
    }

    if (prevBtn) {
      prevBtn.addEventListener("click", () => {
        goTo(currentIndex - 1, true, "right");
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener("click", () => {
        goTo(currentIndex + 1, true, "left");
      });
    }

    if (playbackBtn) {
      playbackBtn.addEventListener("click", () => {
        isPlaying = !isPlaying;
        updatePlaybackButton();
        if (isPlaying) {
          startTimer();
        } else {
          stopTimer();
        }
      });
    }

    // Keyboard navigation when focused inside carousel
    rootEl.addEventListener("keydown", (event) => {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        goTo(currentIndex - 1, true, "right");
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        goTo(currentIndex + 1, true, "left");
      }
    });

    // Pause autoplay while hovered or focused for accessibility
    rootEl.addEventListener("mouseenter", stopTimer);
    rootEl.addEventListener("mouseleave", () => {
      if (isPlaying) startTimer();
    });
    rootEl.addEventListener("focusin", stopTimer);
    rootEl.addEventListener("focusout", () => {
      if (isPlaying) startTimer();
    });

    // Touch swipe support on mobile / tablet
    if (mediaBox) {
      let touchStartX = 0;
      let touchEndX = 0;

      mediaBox.addEventListener(
        "touchstart",
        (event) => {
          touchStartX = event.changedTouches[0].clientX;
        },
        { passive: true }
      );

      mediaBox.addEventListener(
        "touchend",
        (event) => {
          touchEndX = event.changedTouches[0].clientX;
          const diff = touchStartX - touchEndX;
          if (Math.abs(diff) > 40) {
            if (diff > 0) {
              goTo(currentIndex + 1, true, "left");
            } else {
              goTo(currentIndex - 1, true, "right");
            }
          }
        },
        { passive: true }
      );
    }

    updatePlaybackButton();
    render(true, null);
    if (isPlaying) startTimer();

    return {
      goTo: function (idx, direction) {
        goTo(idx, true, direction || "left");
      },
      jumpTo: function (idx) {
        currentIndex = ((idx % stalls.length) + stalls.length) % stalls.length;
        render(true, null);
      },
      pause: function () {
        stopTimer();
      },
      resume: function () {
        if (isPlaying) startTimer();
      },
      getIndex: function () {
        return currentIndex;
      },
      getCurrentStall: function () {
        return stalls[currentIndex];
      },
    };
  }

  window.initStallCarousel = initStallCarousel;

  // Auto-initialize Home carousel if present
  document.addEventListener("DOMContentLoaded", () => {
    const homeCarousel = document.querySelector("[data-home-carousel]");
    if (homeCarousel) {
      initStallCarousel(homeCarousel, {
        initialIndex: 0,
        autoplay: true,
        intervalMs: 4000,
        linkToDetail: true,
      });
    }
  });
})();
