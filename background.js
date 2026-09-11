const DAILY_URL = "https://uma.komoejoy.com/event/dailygift/";
const ALARM_NAME = "uma-daily-sign";

chrome.runtime.onInstalled.addListener(async () => {
  await lockDownStorage();
  await scheduleNextAlarm();
});

chrome.runtime.onStartup.addListener(async () => {
  await lockDownStorage();
  await scheduleNextAlarm();
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name !== ALARM_NAME) return;
  await openDailyPage(false);
  await scheduleNextAlarm();
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  (async () => {
    switch (message?.type) {
      case "settingsChanged":
        await scheduleNextAlarm();
        sendResponse({ ok: true });
        break;

      case "testNow":
        await openDailyPage(true);
        sendResponse({ ok: true });
        break;

      case "getLoginPayload": {
        const data = await chrome.storage.local.get([
          "account",
          "password",
          "autoAgree",
          "closeTabOnSuccess",
          "debugEnabled"
        ]);
        sendResponse({ ok: true, ...data });
        break;
      }

      case "signSucceeded": {
        const { closeTabOnSuccess = true } = await chrome.storage.local.get("closeTabOnSuccess");
        if (closeTabOnSuccess && sender.tab?.id) {
          setTimeout(() => chrome.tabs.remove(sender.tab.id).catch(() => {}), 1500);
        }
        sendResponse({ ok: true });
        break;
      }

      default:
        sendResponse({ ok: false, error: "unknown_message" });
    }
  })();
  return true;
});

async function lockDownStorage() {
  try {
    await chrome.storage.local.setAccessLevel({ accessLevel: "TRUSTED_CONTEXTS" });
  } catch (_) {}
}

async function scheduleNextAlarm() {
  const { signTime } = await chrome.storage.local.get("signTime");
  await chrome.alarms.clear(ALARM_NAME);
  if (!signTime) return;

  const next = nextOccurrence(signTime);
  if (!next) return;
  await chrome.alarms.create(ALARM_NAME, { when: next });
}

function nextOccurrence(signTime) {
  const match = /^(\d{2}):(\d{2})$/.exec(signTime || "");
  if (!match) return null;

  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour > 23 || minute > 59) return null;

  const now = new Date();
  const target = new Date(now);
  target.setHours(hour, minute, 0, 0);
  if (target <= now) target.setDate(target.getDate() + 1);
  return target.getTime();
}

async function openDailyPage(active) {
  await chrome.tabs.create({ url: DAILY_URL, active });
}
