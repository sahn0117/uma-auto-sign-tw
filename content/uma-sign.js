(() => {
  if (window.__UMA_AUTO_SIGN_V31__) return;
  window.__UMA_AUTO_SIGN_V31__ = true;

  const state = {
    payload: {},
    busy: false,
    loginWasVisible: false,
    toggleClickedAt: 0,
    accountCommitted: false,
    passwordFilled: false,
    agreementHandledFor: null,
    captchaPreparedFor: null,
    signAttempts: 0,
    nextSignAt: Date.now() + 1200,
    resumeAfterLoginAt: 0,
    success: false,
    debugBox: null,
    lastDebug: ""
  };

  const SIGN_BUTTON = "#uma img.sign-btn, img.sign-btn, .sign-btn";
  const MAX_SIGN_ATTEMPTS = 3;

  start();

  async function start() {
    state.payload = await getPayload();
    debug("啟動完成，等待簽到頁狀態");

    const observer = new MutationObserver(queueTick);
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["class", "style"]
    });

    setInterval(queueTick, 350);
    queueTick();
  }

  function queueTick() {
    if (state.busy || state.success) return;
    state.busy = true;
    Promise.resolve(tick()).finally(() => {
      state.busy = false;
    });
  }

  async function tick() {
    if (handleSuccessPopup()) return;

    const loginBox = visibleOne(document, ".login-container .login-box, .login-box");
    if (loginBox) {
      state.loginWasVisible = true;
      await handleLogin(loginBox);
      return;
    }

    if (state.loginWasVisible) {
      // 登入視窗剛關閉：先讓網站更新 Session，再接續簽到。
      state.loginWasVisible = false;
      resetLoginState();
      state.signAttempts = 0;
      state.resumeAfterLoginAt = Date.now() + 1500;
      state.nextSignAt = state.resumeAfterLoginAt;
      debug("登入視窗已關閉，稍後自動接續簽到");
      return;
    }

    if (Date.now() < state.nextSignAt) return;
    attemptSign();
  }

  async function handleLogin(loginBox) {
    const passwordInput = getPasswordInput(loginBox);

    // KOMOE 預設先顯示「驗證碼登入」。這一步必須先精確點 .other-login，
    // 不能用包含文字的外層 div，否則看似找到元素但實際不會切換模式。
    if (!passwordInput) {
      const passwordModeButton = visibleOne(loginBox, ".other-login") || visibleOne(document, ".other-login");
      if (!passwordModeButton) {
        debug("看到登入框，但尚未找到『帳號密碼』按鈕");
        return;
      }

      if (Date.now() - state.toggleClickedAt >= 1200) {
        state.toggleClickedAt = Date.now();
        debug("點『帳號密碼』，切換登入模式");
        safeClick(passwordModeButton);
      }
      return;
    }

    const accountInput = getAccountInput(loginBox);
    const captchaInput = getCaptchaInput(loginBox);
    if (!accountInput || !passwordInput) {
      debug(`等待登入欄位：帳號=${!!accountInput} 密碼=${!!passwordInput}`);
      return;
    }

    if (!state.payload.account || !state.payload.password) {
      debug("尚未在插件中儲存帳號或密碼");
      return;
    }

    // 1. 帳號
    if (!state.accountCommitted) {
      if (accountInput.value !== state.payload.account) {
        debug("寫入帳號");
        setFrameworkInput(accountInput, state.payload.account);
        await sleep(220);
      }

      // 2. KOMOE 會跳 Email 建議清單，先把目前帳號點選提交。
      const committed = await commitEmailSuggestion(loginBox, state.payload.account, accountInput);
      if (!committed) {
        debug("帳號已寫入，等待 Email 建議項目");
        return;
      }
      state.accountCommitted = true;
      await sleep(220);
    }

    // Vue 可能在 Email 項目被點擊後重建 password input，因此這裡重新抓一次。
    const currentPasswordInput = getPasswordInput(loginBox) || getPasswordInput(document);
    if (!currentPasswordInput) {
      debug("帳號已提交，等待密碼欄位");
      return;
    }

    // 3. 密碼：只寫一次，不 focus，不再搶使用者游標。
    if (!state.passwordFilled) {
      if (currentPasswordInput.value !== state.payload.password) {
        debug("寫入密碼");
        setFrameworkInput(currentPasswordInput, state.payload.password);
        await sleep(180);
      }

      if (currentPasswordInput.value !== state.payload.password) {
        debug("密碼被網站清除，稍後重試");
        return;
      }
      state.passwordFilled = true;
    }

    // 4. 同意條款：同一個登入框最多自動點一次，避免反覆勾選/取消。
    if (state.payload.autoAgree && state.agreementHandledFor !== loginBox) {
      const agreement = findAgreementBox(loginBox);
      if (agreement) {
        state.agreementHandledFor = loginBox;
        if (!looksChecked(agreement)) {
          debug("勾選『我已閱讀並同意』");
          safeClick(agreement);
          await sleep(180);
        }
      }
    }

    // 5. 最後才把控制權交給圖形驗證碼，而且同一個欄位只 focus 一次。
    const currentCaptcha = captchaInput || getCaptchaInput(loginBox);
    if (currentCaptcha && state.captchaPreparedFor !== currentCaptcha) {
      state.captchaPreparedFor = currentCaptcha;
      currentCaptcha.focus({ preventScroll: true });
      debug("帳密與同意已處理，請輸入圖形驗證碼");
    }
  }

  async function commitEmailSuggestion(root, account, accountInput) {
    // 最多等約 1.4 秒；有清單就優先點目前帳號。
    for (let i = 0; i < 10; i += 1) {
      const list = visibleOne(root, "#emaillist, .email-area-list") || visibleOne(document, "#emaillist, .email-area-list");
      if (list) {
        const items = visibleAll(list, ".item");
        const target = items.find((el) => (el.textContent || "").includes(account))
          || items.find((el) => el.classList.contains("selected"))
          || items[0];
        if (target) {
          debug("點選 Email 建議項目");
          safeClick(target);
          return true;
        }
      }
      await sleep(140);
    }

    // 網站有時不顯示清單，只要帳號仍正確就繼續。
    return accountInput.value === account;
  }

  function findAgreementBox(root) {
    const boxes = visibleAll(root, ".tip-line .radio-box, .radio-box");
    return boxes.find((box) => {
      const row = box.closest(".tip-line") || box.parentElement;
      const text = (row?.innerText || row?.textContent || "").replace(/\s+/g, "");
      return text.includes("我已閱讀並同意") || text.includes("使用者協議") || text.includes("隱私權政策");
    }) || null;
  }

  function looksChecked(box) {
    if (!box) return false;
    if (box.matches("input[type='checkbox']")) return box.checked;

    const combinedClass = `${box.className || ""} ${box.parentElement?.className || ""}`.toLowerCase();
    if (/(^|\s)(checked|active|selected|on)(\s|$)/.test(combinedClass)) return true;
    if (box.getAttribute("aria-checked") === "true") return true;
    if (box.getAttribute("data-checked") === "true") return true;

    // KOMOE 的已勾選 radio-box 常會帶子元素/圖示；有就視為已勾，避免再點一次把它取消。
    return box.children.length > 0;
  }

  function getAccountInput(root) {
    return visibleOne(root,
      'input.cus-input-input[placeholder="請輸入信箱地址/手機號"], input[placeholder*="信箱地址"], input[placeholder*="手機號"]'
    );
  }

  function getPasswordInput(root) {
    return visibleOne(root,
      'input.cus-input-input[type="password"], input[type="password"], input[placeholder="請輸入密碼"]'
    );
  }

  function getCaptchaInput(root) {
    return visibleOne(root,
      '.cus-input-wrapper.verify-code input, input[placeholder="請輸入驗證碼"], input[placeholder*="驗證碼"]'
    );
  }

  function attemptSign() {
    if (state.signAttempts >= MAX_SIGN_ATTEMPTS) {
      state.nextSignAt = Number.POSITIVE_INFINITY;
      debug("已達簽到重試上限，停止重複點擊");
      return;
    }

    const button = visibleOne(document, SIGN_BUTTON);
    if (!button) {
      state.nextSignAt = Date.now() + 900;
      return;
    }

    state.signAttempts += 1;
    safeClick(button);
    state.nextSignAt = Date.now() + 4500;
    debug(`點擊簽到按鈕（${state.signAttempts}/${MAX_SIGN_ATTEMPTS}）`);
  }

  function handleSuccessPopup() {
    const candidates = visibleAll(document, ".popup-fixed, .popup-box.popup-tip, .popup-item");
    const popup = candidates.find((el) => {
      const text = (el.innerText || el.textContent || "").replace(/\s+/g, "");
      return !!el.querySelector('img[src*="/popup/sign.png"], img[src*="sign.png"]')
        || text.includes("恭喜獲得")
        || text.includes("簽到成功");
    });

    if (!popup) return false;

    const closeButton = visibleOne(popup, ".popup-close") || visibleOne(document, ".popup-fixed .popup-close");
    if (closeButton) safeClick(closeButton);

    state.success = true;
    debug("簽到成功，已關閉成功彈窗");
    chrome.runtime.sendMessage({ type: "signSucceeded" }).catch(() => {});
    return true;
  }

  function resetLoginState() {
    state.accountCommitted = false;
    state.passwordFilled = false;
    state.agreementHandledFor = null;
    state.captchaPreparedFor = null;
    state.toggleClickedAt = 0;
  }

  function visibleOne(root, selector) {
    return visibleAll(root, selector)[0] || null;
  }

  function visibleAll(root, selector) {
    return [...root.querySelectorAll(selector)].filter(isVisible);
  }

  function isVisible(el) {
    if (!(el instanceof Element)) return false;
    const style = getComputedStyle(el);
    const rect = el.getBoundingClientRect();
    return style.display !== "none"
      && style.visibility !== "hidden"
      && Number(style.opacity || "1") !== 0
      && rect.width > 0
      && rect.height > 0;
  }

  function safeClick(el) {
    if (!el) return;
    el.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, cancelable: true, view: window }));
    el.dispatchEvent(new MouseEvent("mouseup", { bubbles: true, cancelable: true, view: window }));
    el.click();
  }

  function setFrameworkInput(input, value) {
    const descriptor = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value");
    if (descriptor?.set) descriptor.set.call(input, value);
    else input.value = value;

    input.dispatchEvent(new InputEvent("input", {
      bubbles: true,
      cancelable: true,
      inputType: "insertText",
      data: value
    }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
  }

  function getPayload() {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage({ type: "getLoginPayload" }, (response) => {
        if (chrome.runtime.lastError || !response?.ok) return resolve({});
        resolve(response);
      });
    });
  }

  function debug(message) {
    if (!state.payload.debugEnabled) return;
    if (state.lastDebug === message) return;
    state.lastDebug = message;

    if (!state.debugBox) {
      const box = document.createElement("div");
      box.style.cssText = [
        "position:fixed",
        "left:12px",
        "bottom:12px",
        "z-index:2147483647",
        "max-width:420px",
        "padding:10px 12px",
        "border-radius:8px",
        "background:rgba(0,0,0,.82)",
        "color:#fff",
        "font:12px/1.45 system-ui,sans-serif",
        "box-shadow:0 4px 18px rgba(0,0,0,.25)",
        "pointer-events:none"
      ].join(";");
      document.documentElement.appendChild(box);
      state.debugBox = box;
    }

    state.debugBox.textContent = `UMA DEBUG v3.1 — ${message}`;
  }

  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
})();
