/* ==========================================================================
   CanteenQ / Kantin POLIJE - Contact Form Validation & Direct Gmail Redirect
   Validates email format (requires @ and valid domain) and Indonesian phone
   (11-13 digits starting with 0 or +62, where +62 counts as the 1st digit).
   On valid submit: immediately opens Gmail compose without showing a modal first;
   when the user returns to this web tab after sending, shows "Pesan terkirim".
   ========================================================================== */

(function () {
  "use strict";

  const GMAIL_RECIPIENT = "fdssas771@gmail.com";
  const EMAIL_DOMAIN_PATTERN = /^[^\s@]+\.[^\s@]{2,}$/;
  const RETURN_STATE_KEY = "canteenq_gmail_pending_return";

  function buildGmailComposeUrl(data) {
    const bodyLines = [
      "Halo Admin Kantin POLIJE,",
      "",
      "Nama: " + data.nama,
      "Email: " + data.email,
      "No HP: " + data.no_hp,
      "",
      "Pesan:",
      data.pesan,
    ];

    const params = new URLSearchParams({
      view: "cm",
      fs: "1",
      to: GMAIL_RECIPIENT,
      su: "[CanteenQ] " + data.subject,
      body: bodyLines.join("\n"),
    });

    return "https://mail.google.com/mail/?" + params.toString();
  }

  function validateEmail(value) {
    if (!value) {
      return "Harap isi alamat email Anda.";
    }
    if (/\s/.test(value)) {
      return "Alamat email tidak boleh mengandung spasi.";
    }
    const atIndex = value.indexOf("@");
    if (atIndex === -1) {
      return "Harap sertakan '@' pada alamat email. '" + value + "' tidak memuat '@'.";
    }
    if (value.indexOf("@", atIndex + 1) !== -1) {
      return "Alamat email hanya boleh mengandung satu tanda '@'.";
    }
    const localPart = value.slice(0, atIndex);
    const domainPart = value.slice(atIndex + 1);
    if (!localPart) {
      return "Harap isi nama pengguna sebelum tanda '@' (contoh: nama@gmail.com).";
    }
    if (!domainPart) {
      return "Harap lengkapi alamat domain setelah tanda '@' (contoh: nama@gmail.com).";
    }
    if (!EMAIL_DOMAIN_PATTERN.test(domainPart)) {
      return "Format domain email tidak valid. Gunakan domain lengkap seperti nama@gmail.com.";
    }
    return "";
  }

  function validatePhone(value) {
    if (!value) {
      return "Harap isi nomor HP Anda.";
    }

    const cleaned = value.replace(/[\s-]/g, "");

    if (!/^\+?\d+$/.test(cleaned)) {
      return "Nomor HP hanya boleh berisi angka dengan awalan 0 atau +62.";
    }

    let effectiveLength = 0;

    if (cleaned.startsWith("+62")) {
      const rest = cleaned.slice(3);
      if (!rest) {
        return "Harap lanjutkan nomor HP setelah +62 (minimal 11 digit, +62 dihitung sebagai digit ke-1).";
      }
      effectiveLength = 1 + rest.length;
    } else if (cleaned.startsWith("0")) {
      effectiveLength = cleaned.length;
    } else {
      return "Nomor HP harus diawali angka 0 atau +62 (contoh: 087861448372 atau +6287861448372).";
    }

    if (effectiveLength < 11) {
      return (
        "Nomor HP minimal 11 digit dan maksimal 13 digit (awalan 0 atau +62 dihitung sebagai digit ke-1). Saat ini baru " +
        effectiveLength +
        " digit."
      );
    }

    if (effectiveLength > 13) {
      return (
        "Nomor HP maksimal 13 digit (awalan 0 atau +62 dihitung sebagai digit ke-1). Saat ini " +
        effectiveLength +
        " digit."
      );
    }

    return "";
  }

  function validateField(input) {
    const name = input.name;
    const value = input.value.trim();

    if (name === "nama") {
      if (!value) return "Harap isi nama Anda terlebih dahulu.";
    } else if (name === "email") {
      return validateEmail(value);
    } else if (name === "no_hp") {
      return validatePhone(value);
    } else if (name === "subject") {
      if (!value) return "Harap isi topik atau subject pertanyaan Anda.";
    } else if (name === "pesan") {
      if (!value) return "Harap tulis pesan yang ingin Anda sampaikan.";
    }
    return "";
  }

  function initContactModal() {
    const backdrop = document.getElementById("kontak-success-modal");
    if (!backdrop) return null;

    const closeBtn = backdrop.querySelector("[data-modal-close]");
    let lastFocused = null;

    function openModal() {
      lastFocused = document.activeElement;
      backdrop.hidden = false;
      document.body.style.overflow = "hidden";
      if (closeBtn) {
        closeBtn.focus();
      }
    }

    function closeModal() {
      backdrop.hidden = true;
      document.body.style.overflow = "";
      if (lastFocused && typeof lastFocused.focus === "function") {
        lastFocused.focus();
      }
    }

    if (closeBtn) {
      closeBtn.addEventListener("click", closeModal);
    }

    backdrop.addEventListener("click", (event) => {
      if (event.target === backdrop) {
        closeModal();
      }
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !backdrop.hidden) {
        closeModal();
      }
    });

    return { open: openModal, close: closeModal };
  }

  function setFieldState(fieldWrap, input, errorMessage) {
    const feedbackText = fieldWrap.querySelector("[data-feedback-text]");
    const defaultHelp = fieldWrap.getAttribute("data-default-help") || "";

    if (typeof input.setCustomValidity === "function") {
      input.setCustomValidity(errorMessage || "");
    }

    if (errorMessage) {
      fieldWrap.classList.add("is-error");
      input.setAttribute("aria-invalid", "true");
      if (feedbackText) feedbackText.textContent = errorMessage;
    } else {
      fieldWrap.classList.remove("is-error");
      input.removeAttribute("aria-invalid");
      if (feedbackText) feedbackText.textContent = defaultHelp;
    }
  }

  function setPendingFlag(active) {
    try {
      if (active) {
        window.sessionStorage.setItem(RETURN_STATE_KEY, "1");
      } else {
        window.sessionStorage.removeItem(RETURN_STATE_KEY);
      }
    } catch (_err) {
      // Ignore storage restrictions
    }
  }

  function hasPendingFlag() {
    try {
      return window.sessionStorage.getItem(RETURN_STATE_KEY) === "1";
    } catch (_err) {
      return false;
    }
  }

  function initContactForms() {
    const forms = document.querySelectorAll("[data-kontak-form]");
    if (!forms.length) return;

    const modal = initContactModal();
    let pendingForm = null;
    let leftForGmail = false;

    function notifyReturnedFromGmail() {
      if (!pendingForm && !hasPendingFlag()) return;
      if (pendingForm && !leftForGmail) return;

      const targetForm = pendingForm;
      pendingForm = null;
      leftForGmail = false;
      setPendingFlag(false);

      if (targetForm) {
        targetForm.reset();
        const wraps = targetForm.querySelectorAll(".form-field");
        wraps.forEach((wrap) => {
          const input = wrap.querySelector("input, textarea");
          if (input) setFieldState(wrap, input, "");
        });
      }

      if (modal) {
        modal.open();
      }
    }

    // Track when the user leaves to the Gmail tab and returns to this website
    window.addEventListener("blur", () => {
      if (pendingForm) {
        leftForGmail = true;
      }
    });

    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden" && pendingForm) {
        leftForGmail = true;
      } else if (document.visibilityState === "visible") {
        notifyReturnedFromGmail();
      }
    });

    window.addEventListener("focus", () => {
      notifyReturnedFromGmail();
    });

    window.addEventListener("pageshow", () => {
      if (hasPendingFlag()) {
        leftForGmail = true;
        notifyReturnedFromGmail();
      }
    });

    forms.forEach((form) => {
      const summaryAlert = form.querySelector("[data-form-alert]");
      const fields = Array.from(form.querySelectorAll(".form-field"));

      fields.forEach((fieldWrap) => {
        const input = fieldWrap.querySelector("input, textarea");
        if (!input) return;

        input.addEventListener("input", () => {
          if (typeof input.setCustomValidity === "function") {
            input.setCustomValidity("");
          }
          if (fieldWrap.classList.contains("is-error")) {
            const err = validateField(input);
            setFieldState(fieldWrap, input, err);
            const stillHasErrors = fields.some((wrap) => wrap.classList.contains("is-error"));
            if (!stillHasErrors && summaryAlert) {
              summaryAlert.hidden = true;
            }
          }
        });
      });

      form.addEventListener("submit", (event) => {
        event.preventDefault();

        let firstInvalidInput = null;
        let hasError = false;

        fields.forEach((fieldWrap) => {
          const input = fieldWrap.querySelector("input, textarea");
          if (!input) return;
          const err = validateField(input);
          setFieldState(fieldWrap, input, err);
          if (err) {
            hasError = true;
            if (!firstInvalidInput) firstInvalidInput = input;
          }
        });

        if (hasError) {
          if (summaryAlert) {
            summaryAlert.hidden = false;
          }
          if (firstInvalidInput) {
            firstInvalidInput.focus();
            if (typeof firstInvalidInput.reportValidity === "function") {
              firstInvalidInput.reportValidity();
            }
          }
          return;
        }

        if (summaryAlert) {
          summaryAlert.hidden = true;
        }

        const formData = {
          nama: (form.querySelector('[name="nama"]')?.value || "").trim(),
          email: (form.querySelector('[name="email"]')?.value || "").trim(),
          no_hp: (form.querySelector('[name="no_hp"]')?.value || "").trim(),
          subject: (form.querySelector('[name="subject"]')?.value || "").trim(),
          pesan: (form.querySelector('[name="pesan"]')?.value || "").trim(),
        };

        const gmailUrl = buildGmailComposeUrl(formData);

        // Arm the return notification before opening Gmail; do NOT open modal immediately
        pendingForm = form;
        leftForGmail = false;
        setPendingFlag(true);

        // Direct redirect to Gmail compose in a new tab
        window.open(gmailUrl, "_blank", "noopener,noreferrer");
      });
    });
  }

  document.addEventListener("DOMContentLoaded", initContactForms);
})();
