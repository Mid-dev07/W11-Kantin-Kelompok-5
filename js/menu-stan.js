/* ==========================================================================
   CanteenQ / Kantin POLIJE - Menu & Stan Page Controller (MenuStan.html)
   Mode 1: Pilih Stan (default when no ?stan= param) -> auto slide-left showcase
   Mode 2: Detail Stan (?stan=<slug>) -> static stall profile + menu cards
   ========================================================================== */

(function () {
  "use strict";

  function createMenuCard(item, stallLabel, categoryLabel) {
    const card = document.createElement("article");
    card.className = "menu-card";

    const thumb = document.createElement("div");
    thumb.className = "menu-thumb";

    if (item.img) {
      const img = document.createElement("img");
      img.src = item.img;
      img.alt = item.name + " di " + stallLabel;
      img.width = 221;
      img.height = 128;
      img.loading = "lazy";
      img.decoding = "async";
      img.addEventListener("error", () => {
        thumb.innerHTML = "";
        const fallback = document.createElement("div");
        fallback.className = "menu-thumb-fallback";
        fallback.textContent = "Foto menu belum tersedia";
        thumb.appendChild(fallback);
      });
      thumb.appendChild(img);
    } else {
      const fallback = document.createElement("div");
      fallback.className = "menu-thumb-fallback";
      fallback.textContent = "Foto menu belum tersedia";
      thumb.appendChild(fallback);
    }

    const body = document.createElement("div");
    body.className = "menu-card-body";

    const title = document.createElement("h4");
    title.className = "menu-card-name";
    title.textContent = item.name;

    const meta = document.createElement("p");
    meta.className = "menu-card-meta";
    meta.textContent = stallLabel + " \u00b7 " + categoryLabel;

    const price = document.createElement("p");
    price.className = "menu-card-price";
    price.textContent = item.price;

    body.appendChild(title);
    body.appendChild(meta);
    body.appendChild(price);

    card.appendChild(thumb);
    card.appendChild(body);
    return card;
  }

  function resolveStallIndexFromUrl(stalls) {
    const params = new URLSearchParams(window.location.search);
    const paramSlug = (params.get("stan") || "").trim().toLowerCase();
    const hashId = (window.location.hash || "").replace(/^#/, "").trim().toLowerCase();
    const lookup = paramSlug || hashId;

    if (!lookup) return -1;

    return stalls.findIndex(
      (stall) =>
        stall.slug.toLowerCase() === lookup ||
        stall.id.toLowerCase() === lookup ||
        stall.name.toLowerCase() === lookup
    );
  }

  function initMenuStanPage() {
    const stalls = window.CANTEEN_STALLS || [];
    const pilihView = document.getElementById("view-pilih-stan");
    const detailView = document.getElementById("view-detail-stan");
    const pilihCarouselRoot = document.querySelector("[data-pilih-carousel]");
    const detailCarouselRoot = document.querySelector("[data-menustan-carousel]");

    if (!stalls.length || typeof window.initStallCarousel !== "function") {
      return;
    }

    const categoryEl = document.getElementById("stan-category");
    const descEl = document.getElementById("stan-description");
    const hoursBody = document.getElementById("stan-hours-body");
    const menuNoteEl = document.getElementById("stan-menu-note");
    const makananGroup = document.getElementById("group-makanan");
    const minumanGroup = document.getElementById("group-minuman");
    const makananGrid = document.getElementById("grid-makanan");
    const minumanGrid = document.getElementById("grid-minuman");
    const emptyState = document.getElementById("menu-empty-state");

    let activeMode = "pilih";

    function renderStallDetails(stall) {
      if (categoryEl) categoryEl.textContent = stall.category;
      if (descEl) descEl.textContent = stall.description;
      if (menuNoteEl) menuNoteEl.textContent = stall.menuNote;

      if (hoursBody) {
        hoursBody.innerHTML = "";
        stall.hours.forEach((row) => {
          const tr = document.createElement("tr");
          const tdDay = document.createElement("td");
          tdDay.textContent = row.day;
          const tdTime = document.createElement("td");
          tdTime.textContent = row.time;
          tr.appendChild(tdDay);
          tr.appendChild(tdTime);
          hoursBody.appendChild(tr);
        });
      }

      const hasMakanan = Array.isArray(stall.makanan) && stall.makanan.length > 0;
      const hasMinuman = Array.isArray(stall.minuman) && stall.minuman.length > 0;

      if (makananGroup && makananGrid) {
        makananGroup.hidden = !hasMakanan;
        makananGrid.innerHTML = "";
        if (hasMakanan) {
          stall.makanan.forEach((item) => {
            makananGrid.appendChild(createMenuCard(item, stall.shortName, "Makanan"));
          });
        }
      }

      if (minumanGroup && minumanGrid) {
        minumanGroup.hidden = !hasMinuman;
        minumanGrid.innerHTML = "";
        if (hasMinuman) {
          stall.minuman.forEach((item) => {
            minumanGrid.appendChild(createMenuCard(item, stall.shortName, "Minuman"));
          });
        }
      }

      if (emptyState) {
        emptyState.hidden = hasMakanan || hasMinuman;
      }

      if (activeMode === "detail") {
        document.title = stall.name + " - Menu & Stan - CanteenQ Kantin POLIJE";
        try {
          const nextUrl = new URL(window.location.href);
          nextUrl.searchParams.set("stan", stall.slug);
          window.history.replaceState({ view: "detail", stan: stall.slug }, "", nextUrl.toString());
        } catch (_err) {
          // Ignore history errors on restricted file:// origins
        }
      }
    }

    const initialStallIdx = resolveStallIndexFromUrl(stalls);
    const startInDetail = initialStallIdx >= 0;
    activeMode = startInDetail ? "detail" : "pilih";

    const pilihCarousel = pilihCarouselRoot
      ? window.initStallCarousel(pilihCarouselRoot, {
          initialIndex: startInDetail ? initialStallIdx : 0,
          autoplay: true,
          animateSlide: true,
          wideFraming: true,
          intervalMs: 4000,
          linkToDetail: true,
        })
      : null;

    const detailCarousel = detailCarouselRoot
      ? window.initStallCarousel(detailCarouselRoot, {
          initialIndex: startInDetail ? initialStallIdx : 0,
          autoplay: false,
          animateSlide: false,
          wideFraming: false,
          intervalMs: 4000,
          linkToDetail: false,
          onChange: renderStallDetails,
        })
      : null;

    function showPilihView(updateHistory) {
      activeMode = "pilih";
      if (pilihView) pilihView.hidden = false;
      if (detailView) detailView.hidden = true;
      document.title = "Pilih Stan - Menu & Stan - CanteenQ Kantin POLIJE";

      if (pilihCarousel) {
        pilihCarousel.resume();
      }

      if (updateHistory) {
        try {
          const nextUrl = new URL(window.location.href);
          nextUrl.searchParams.delete("stan");
          nextUrl.hash = "";
          window.history.pushState({ view: "pilih" }, "", nextUrl.toString());
        } catch (_err) {
          // Ignore on file:// origins
        }
      }
      window.scrollTo({ top: 0, behavior: "auto" });
    }

    function showDetailView(index, pushHistory) {
      const safeIndex = Math.max(0, Math.min(index, stalls.length - 1));
      const stall = stalls[safeIndex];
      activeMode = "detail";

      if (pilihCarousel) {
        pilihCarousel.pause();
      }
      if (pilihView) pilihView.hidden = true;
      if (detailView) detailView.hidden = false;

      if (pushHistory && stall) {
        try {
          const nextUrl = new URL(window.location.href);
          nextUrl.searchParams.set("stan", stall.slug);
          nextUrl.hash = "";
          window.history.pushState({ view: "detail", stan: stall.slug }, "", nextUrl.toString());
        } catch (_err) {
          // Ignore on file:// origins
        }
      }

      if (detailCarousel) {
        detailCarousel.jumpTo(safeIndex);
      } else if (stall) {
        renderStallDetails(stall);
      }

      window.scrollTo({ top: 0, behavior: "auto" });
    }

    // Apply initial mode immediately
    if (startInDetail) {
      if (pilihCarousel) pilihCarousel.pause();
      if (pilihView) pilihView.hidden = true;
      if (detailView) detailView.hidden = false;
      document.title = stalls[initialStallIdx].name + " - Menu & Stan - CanteenQ Kantin POLIJE";
    } else {
      if (pilihView) pilihView.hidden = false;
      if (detailView) detailView.hidden = true;
      document.title = "Pilih Stan - Menu & Stan - CanteenQ Kantin POLIJE";
    }

    // Intercept normal left-click on Pilih Stan photo to transition cleanly into Detail Stan
    if (pilihCarouselRoot && pilihCarousel) {
      const pilihLink = pilihCarouselRoot.querySelector("[data-carousel-link]");
      if (pilihLink) {
        pilihLink.addEventListener("click", (event) => {
          if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) {
            return;
          }
          event.preventDefault();
          showDetailView(pilihCarousel.getIndex(), true);
        });
      }
    }

    // Clicking "Menu & Stan" in navbar while already in Detail mode returns to Pilih Stan
    document.querySelectorAll('a[href="MenuStan.html"]').forEach((link) => {
      link.addEventListener("click", (event) => {
        if (activeMode !== "detail") return;
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) {
          return;
        }
        event.preventDefault();
        showPilihView(true);
      });
    });

    // Support browser Back / Forward between Pilih Stan and Detail Stan
    window.addEventListener("popstate", () => {
      const idx = resolveStallIndexFromUrl(stalls);
      if (idx >= 0) {
        showDetailView(idx, false);
      } else {
        showPilihView(false);
      }
    });
  }

  document.addEventListener("DOMContentLoaded", initMenuStanPage);
})();
