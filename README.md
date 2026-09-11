# Uma Auto Sign TW

Uma Auto Sign TW 是一個用於《賽馬娘 Pretty Derby》台港澳版每日簽到頁的 Chrome 擴充功能。

主要用途是協助處理每日簽到流程：開啟簽到頁後，擴充功能會偵測登入狀態、協助填入 KOMOE 帳號與密碼、切換帳號密碼登入模式、處理 Email 建議項目、勾選使用條款，並在登入完成後接續執行簽到。

> 本專案為非官方工具，與 Cygames、KOMOE GAME 及遊戲營運方無關。

---

## 功能

- 每日指定時間自動開啟簽到頁（Chrome 必須正在執行）
- 支援「立即測試」
- 自動偵測 KOMOE 登入視窗
- 自動切換至「帳號密碼」登入模式
- 自動填入帳號與密碼
- 自動選擇 Email 建議項目
- 可選擇自動勾選「我已閱讀並同意」
- 將游標停在圖形驗證碼欄位，方便手動輸入
- 登入完成後自動接續簽到
- 自動偵測「簽到成功 / 恭喜獲得」彈窗
- 自動關閉簽到成功彈窗
- 可選擇簽到成功後自動關閉該分頁
- 可開啟頁面 Debug 狀態顯示
- 可搭配 Windows 工作排程器，在 Chrome 完全關閉時自動啟動 Chrome

---

## 重要限制

### 圖形驗證碼仍需手動輸入

本擴充功能不會破解、辨識或繞過 KOMOE 的圖形驗證碼。

當登入狀態失效時，流程大致如下：

```text
開啟每日簽到頁
→ 出現 KOMOE 登入視窗
→ 自動切換「帳號密碼」
→ 自動輸入帳號
→ 自動選擇 Email
→ 自動輸入密碼
→ 自動勾選同意條款（可關閉）
→ 游標移至圖形驗證碼
→ 使用者手動輸入驗證碼並登入
→ 登入成功後自動接續簽到
→ 偵測簽到成功
```

若網站仍保留登入 Session，通常不需要再次輸入驗證碼，會直接進行簽到。

---

## 安裝方式

### 1. 下載專案

下載本專案 ZIP 並解壓縮，或使用 Git Clone。

### 2. 開啟 Chrome 擴充功能管理頁

在 Chrome 網址列輸入：

```text
chrome://extensions/
```

### 3. 開啟開發人員模式

打開右上角的「開發人員模式」。

### 4. 載入擴充功能

點選：

```text
載入未封裝項目
```

選擇包含 `manifest.json` 的專案根目錄。

安裝完成後，建議將 Uma Auto Sign TW 固定在 Chrome 工具列上。

---

## 基本設定

點擊 Chrome 工具列上的 Uma Auto Sign TW 圖示後，可設定：

- KOMOE 帳號 / Email
- KOMOE 密碼
- 每日簽到時間
- 自動勾選使用條款
- 簽到成功後自動關閉分頁
- Debug 顯示

設定完成後按「儲存設定」。

第一次使用建議先按一次「立即測試」，確認目前網站登入流程是否正常。

---

## 排程機制：Chrome 內建排程 + Windows 雙保險

本專案保留擴充功能自己的「每日簽到時間」。這是主要簽到排程，不建議刪除。

### Chrome 已開啟

只要 Chrome 正在執行，擴充功能會在你設定的每日簽到時間自動開啟：

```text
https://uma.komoejoy.com/event/dailygift/
```

並開始登入與簽到流程。

### Chrome 完全關閉

Chrome 擴充功能無法自行啟動已完全關閉的 Chrome，因此可另外搭配 Windows 工作排程器，在簽到時間前先把 Chrome 啟動。

推薦配置：

```text
插件簽到時間：08:00
Windows 啟動 Chrome：07:59
```

也就是 Windows 只負責確保 Chrome 在簽到前已經啟動，真正的簽到時間仍由插件內的設定負責。這樣可以避免 Windows 排程與插件同時打開兩個簽到頁。

整體流程：

```text
Chrome 原本有開
→ 08:00 插件自行執行簽到

Chrome 原本沒開
→ 07:59 Windows 啟動 Chrome
→ 08:00 插件自行執行簽到
```

---

# Windows 自動啟動 Chrome

以下為 Windows 10 / Windows 11 設定方式。

## 1. 確認 Chrome 路徑

在 Chrome 網址列輸入：

```text
chrome://version/
```

找到「可執行檔的路徑」。

一般常見位置為：

```text
C:\Program Files\Google\Chrome\Application\chrome.exe
```

如果你的路徑不同，後面的設定請改成自己的實際路徑。

---

## 2. 開啟 Windows 工作排程器

按：

```text
Win + R
```

輸入：

```text
taskschd.msc
```

按 Enter。

---

## 3. 建立工作

建議選擇：

```text
建立工作
```

名稱可填：

```text
Uma Auto Sign TW
```

建議使用：

```text
只有使用者登入時才執行
```

因為 Chrome 擴充功能需要正常的桌面 Chrome Session。

---

## 4. 設定觸發時間

進入：

```text
觸發程序 → 新增
```

建議設定在插件簽到時間的 **1 分鐘前**。

例如插件內設定：

```text
每日簽到時間：08:00
```

Windows 工作排程器就設定：

```text
每天 07:59
```

Windows 的工作只是提前把 Chrome 啟動，真正執行簽到的時間仍以插件內的設定為準。

---

## 5. 設定 Chrome 啟動動作

進入：

```text
動作 → 新增 → 啟動程式
```

### 程式或指令碼

```text
C:\Program Files\Google\Chrome\Application\chrome.exe
```

### 新增引數

```text
--profile-directory="Default"
```

Windows 排程這裡不需要直接開啟 UMA 簽到網址。插件會在自己設定的簽到時間到達後，自動開啟簽到頁。這樣可以避免 Windows 與插件在同一時間各開一次簽到頁。

### 開始位置

```text
C:\Program Files\Google\Chrome\Application
```

如果你的 Chrome 使用的不是 `Default` 設定檔，請先至：

```text
chrome://version/
```

查看「設定檔路徑」。

例如：

```text
C:\Users\你的帳號\AppData\Local\Google\Chrome\User Data\Profile 1
```

則引數中的：

```text
--profile-directory="Default"
```

需改成：

```text
--profile-directory="Profile 1"
```

---

## 6. 建議的 Windows 排程設定

可在「條件」中開啟：

```text
喚醒電腦以執行此工作
```

可在「設定」中開啟：

```text
如果錯過排定的開始時間，則立即執行工作
```

這樣電腦從睡眠恢復，或錯過原本執行時間時，Windows 仍有機會補執行。

> 電腦如果是完全關機狀態，單靠此 Chrome 擴充功能無法自行開機。

---

## 測試 Windows 排程

建立完成後：

1. 打開「工作排程器程式庫」
2. 找到 `Uma Auto Sign TW`
3. 右鍵
4. 選擇「執行」

正常情況下會啟動指定的 Chrome Profile。

若只是測試 Windows 排程，看到 Chrome 能正常啟動即可；真正的 UMA 簽到頁會等到插件內設定的簽到時間才自動開啟。

---

## 帳號與密碼安全

帳號與密碼儲存在目前 Chrome Profile 的 `chrome.storage.local` 中，並限制擴充功能的一般頁面直接存取。

但 `chrome.storage.local` **不是專業密碼管理器，也不是獨立的加密保管庫**。

因此建議：

- 不要將含有個人 Chrome Profile、Cookies 或 Local Storage 的資料夾上傳 GitHub
- 不要把自己的帳號或密碼直接寫入程式碼
- 如果該密碼與其他重要服務共用，建議先改成獨立密碼
- 共用電腦不建議保存帳密
- 不需要自動登入時，可使用插件內的「清除帳密」功能

---

## 專案結構

```text
UmaAutoSign/
├─ assets/
│  ├─ icon16.png
│  ├─ icon48.png
│  └─ icon128.png
├─ content/
│  └─ uma-sign.js
├─ popup/
│  ├─ popup.html
│  ├─ popup.css
│  └─ popup.js
├─ background.js
├─ manifest.json
├─ LICENSE
└─ README.md
```

---

## 更新方式

如果是使用「載入未封裝項目」安裝：

1. 使用新版檔案覆蓋原本專案資料夾
2. 開啟：

```text
chrome://extensions/
```

3. 找到 Uma Auto Sign TW
4. 點擊「重新載入」
5. 建議重新開啟 UMA 簽到頁再測試

若 `manifest.json` 有更動，重新載入是必要步驟。

---

## 常見問題

### 登入視窗出現，但沒有自動輸入

先確認：

- 擴充功能已重新載入
- 舊的 UMA 分頁已關閉後重新打開
- 插件內已儲存帳號與密碼
- 沒有同時啟用舊版 Uma 簽到插件

必要時可開啟插件內的 Debug 顯示，查看流程目前停在哪一步。

### 為什麼還要自己輸入圖形驗證碼？

圖形驗證碼屬於網站的驗證機制，本專案不會嘗試破解或繞過。

### Chrome 關掉後為什麼沒有自動簽到？

Chrome 擴充功能無法自行啟動完全關閉的 Chrome。請依上方說明設定 Windows 工作排程器，並讓 Windows 在插件簽到時間前約 1 分鐘啟動 Chrome。

例如：

```text
Windows：07:59 啟動 Chrome
插件：08:00 執行簽到
```

### 簽到成功後分頁沒有關閉

確認插件內的：

```text
簽到成功後自動關閉分頁
```

是否已開啟。

### 網站改版後不能用了怎麼辦？

本專案依賴 UMA / KOMOE 登入頁的 DOM 結構。若官方修改登入或簽到頁面，可能需要更新 selector 或操作流程。

---

## 隱私權

本專案本身不會將帳號、密碼或其他設定傳送至作者的伺服器。

擴充功能僅針對：

```text
https://uma.komoejoy.com/*
```

執行頁面操作。

實際登入與簽到仍由 UMA / KOMOE 官方網站處理。

---

## 原始靈感與說明

本專案為獨立重新實作版本，程式碼與介面重新建立，功能設計參考實際 UMA 每日簽到操作流程，以及社群中既有的自動簽到工具概念。

曾參考的社群討論：

https://forum.gamer.com.tw/C.php?bsn=34421&snA=14178

感謝原分享者提供使用情境與功能靈感。

---

## 免責聲明

本工具僅供個人研究與方便日常操作使用。

使用者應自行承擔使用自動化工具所產生的風險，包括但不限於網站改版、登入失效、帳號安全、服務條款變更或功能失效。

本專案不保證任何時間皆能正常運作，也不對因使用本工具造成的任何損失負責。

---

## License

本專案採用 MIT License。

詳細內容請參閱 `LICENSE`。
