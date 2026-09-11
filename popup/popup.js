const ids = ["account", "password", "signTime", "autoAgree", "closeTabOnSuccess", "debugEnabled"];
const el = Object.fromEntries(ids.map((id) => [id, document.getElementById(id)]));
const status = document.getElementById("status");

init();

async function init() {
  const defaults = {
    account: "",
    password: "",
    signTime: "",
    autoAgree: true,
    closeTabOnSuccess: true,
    debugEnabled: false
  };

  const saved = await chrome.storage.local.get(Object.keys(defaults));
  const data = { ...defaults, ...saved };

  el.account.value = data.account;
  el.password.value = data.password;
  el.signTime.value = data.signTime;
  el.autoAgree.checked = data.autoAgree;
  el.closeTabOnSuccess.checked = data.closeTabOnSuccess;
  el.debugEnabled.checked = data.debugEnabled;
}

document.getElementById("save").addEventListener("click", async () => {
  const signTime = el.signTime.value;
  if (!signTime) {
    setStatus("請先選擇簽到時間。", false);
    return;
  }

  await chrome.storage.local.set({
    account: el.account.value.trim(),
    password: el.password.value,
    signTime,
    autoAgree: el.autoAgree.checked,
    closeTabOnSuccess: el.closeTabOnSuccess.checked,
    debugEnabled: el.debugEnabled.checked
  });

  await chrome.runtime.sendMessage({ type: "settingsChanged" });
  setStatus("設定已儲存。", true);
});

document.getElementById("test").addEventListener("click", async () => {
  await chrome.runtime.sendMessage({ type: "testNow" });
  setStatus("已開啟測試分頁。", true);
});

document.getElementById("clear").addEventListener("click", async () => {
  await chrome.storage.local.remove(["account", "password"]);
  el.account.value = "";
  el.password.value = "";
  setStatus("帳號與密碼已清除。", true);
});

function setStatus(text, ok) {
  status.textContent = text;
  status.style.color = ok ? "#047857" : "#b91c1c";
}
