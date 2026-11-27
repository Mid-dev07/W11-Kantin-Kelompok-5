/* ==========================================================================
   CanteenQ / Kantin POLIJE - Shared Navigation, Hover Dropdown & Footer Toast
   ========================================================================== */

(function () {
  "use strict";

  const MOBILE_BREAKPOINT = 900;

  function isDesktopHoverMode() {
    return (
      window.innerWidth > MOBILE_BREAKPOINT &&
      Boolean(window.matchMedia && window.matchMedia("(hover: hover)").matches)
    );
  }

  function initNavbar() {
    const navToggle = document.querySelector("[data-nav-toggle]");
    const primaryNav = document.getElementById("primary-nav");
    const dropdownItems = Array.from(document.querySelectorAll("[data-dropdown]"));

    function closeAllDropdowns(exceptItem) {
      dropdownItems.forEach((item) => {
        if (item === exceptItem) return;
        item.classList.remove("is-open");
        const trigger = item.querySelector("[data-dropdown-trigger]");
        if (trigger) trigger.setAttribute("aria-expanded", "false");
      });
    }

    function setMobileMenuOpen(open, restoreFocus) {
      if (!navToggle || !primaryNav) return;
      navToggle.setAttribute("aria-expanded", String(open));
      primaryNav.classList.toggle("is-open", open);
      document.body.style.overflow = open ? "hidden" : "";
      const labelEl = navToggle.querySelector("[data-nav-toggle-label]");
      if (labelEl) {
        labelEl.textContent = open ? "Tutup" : "Menu";
      }
      if (!open) {
        closeAllDropdowns();
        if (restoreFocus) navToggle.focus();
      }
    }

    if (navToggle && primaryNav) {
      navToggle.addEventListener("click", () => {
        const isOpen = navToggle.getAttribute("aria-expanded") === "true";
        setMobileMenuOpen(!isOpen, false);
      });

      primaryNav.querySelectorAll("a[href]").forEach((link) => {
        link.addEventListener("click", () => {
          if (window.innerWidth <= MOBILE_BREAKPOINT) {
            setMobileMenuOpen(false, false);
          }
        });
      });
    }

    dropdownItems.forEach((item) => {
      const trigger = item.querySelector("[data-dropdown-trigger]");
      const links = Array.from(item.querySelectorAll(".nav-dropdown-link"));
      if (!trigger) return;

      // Desktop hover mode: open on hover, close cleanly on mouse leave
      item.addEventListener("mouseenter", () => {
        if (!isDesktopHoverMode()) return;
        closeAllDropdowns(item);
        trigger.setAttribute("aria-expanded", "true");
      });

      item.addEventListener("mouseleave", () => {
        if (!isDesktopHoverMode()) return;
        item.classList.remove("is-open");
        trigger.setAttribute("aria-expanded", "false");
      });

      // Touch / mobile drawer & keyboard click fallback
      trigger.addEventListener("click", (event) => {
        event.stopPropagation();
        if (isDesktopHoverMode() && event.detail > 0) {
          // On desktop pointer hover, menu is already opened by hover
          trigger.setAttribute("aria-expanded", "true");
          return;
        }
        const isOpen = item.classList.contains("is-open");
        closeAllDropdowns(isOpen ? null : item);
        item.classList.toggle("is-open", !isOpen);
        trigger.setAttribute("aria-expanded", String(!isOpen));
      });

      // Keyboard navigation: ArrowDown opens and focuses first submenu link
      trigger.addEventListener("keydown", (event) => {
        if (event.key === "ArrowDown") {
          event.preventDefault();
          closeAllDropdowns(item);
          item.classList.add("is-open");
          trigger.setAttribute("aria-expanded", "true");
          if (links[0]) links[0].focus();
        }
      });

      item.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
          closeAllDropdowns();
          trigger.focus();
        }
      });

      item.addEventListener("focusout", (event) => {
        if (!item.contains(event.relatedTarget)) {
          item.classList.remove("is-open");
          trigger.setAttribute("aria-expanded", "false");
        }
      });
    });

    document.addEventListener("click", (event) => {
      const clickedInsideDropdown = dropdownItems.some((item) => item.contains(event.target));
      if (!clickedInsideDropdown) {
        closeAllDropdowns();
      }
    });

    document.addEventListener("keydown", (event) => {
      if (event.key !== "Escape") return;
      closeAllDropdowns();
      if (navToggle && navToggle.getAttribute("aria-expanded") === "true") {
        setMobileMenuOpen(false, true);
      }
    });

    window.addEventListener("resize", () => {
      if (window.innerWidth > MOBILE_BREAKPOINT && navToggle && navToggle.getAttribute("aria-expanded") === "true") {
        setMobileMenuOpen(false, false);
      }
    });
  }

  function initFooterSocials() {
    const socialButtons = document.querySelectorAll("[data-social]");
    if (!socialButtons.length) return;

    let toast = document.getElementById("site-status-toast");
    if (!toast) {
      toast = document.createElement("div");
      toast.id = "site-status-toast";
      toast.className = "site-toast";
      toast.setAttribute("role", "status");
      toast.setAttribute("aria-live", "polite");
      document.body.appendChild(toast);
    }

    let hideTimer = null;

    socialButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        const platform = btn.getAttribute("data-social") || "Media sosial";
        toast.textContent = "Akun " + platform + " resmi CanteenQ belum tersedia (simulasi proyek kampus).";
        toast.classList.add("is-visible");
        window.clearTimeout(hideTimer);
        hideTimer = window.setTimeout(() => {
          toast.classList.remove("is-visible");
        }, 3600);
      });
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    initNavbar();
    initFooterSocials();
  });
})();
