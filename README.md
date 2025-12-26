
# การเชื่อมต่อ Smart Lifestyle Wellness กับ Google Sheets (ฉบับ Telegram)

คู่มือนี้แนะนำวิธีการตั้งค่า Backend ใน Google Apps Script เพื่อรองรับการแจ้งเตือน Telegram

### ขั้นตอนการตั้งค่า Telegram Bot
1. คุณได้สร้างบอทและมี Token แล้ว: `8501481610:AAHhn7XclhoWqyMlkd6LkckiEMW9VvsvQsQ`
2. นำรหัส `Code.gs` ด้านล่างไปวางใน Google Apps Script Editor

### ขั้นตอนที่ 1: ปรับโครงสร้าง Google Sheet
*   **ชีต `Profile`**: เพิ่มคอลัมน์ Y (ลำดับที่ 25): หัวตารางชื่อ `telegramUserId`

### ขั้นตอนที่ 2: อัปเดต Code.gs

```javascript
// --- START OF Code.gs ---
const SHEET_NAMES = {
  PROFILE: "Profile",
  // ... (ชีตอื่นๆ เช่น bmiHistory, foodHistory, ฯลฯ)
};

const TELEGRAM_BOT_TOKEN = "8501481610:AAHhn7XclhoWqyMlkd6LkckiEMW9VvsvQsQ"; // *** Token ของคุณถูกใส่ไว้ที่นี่แล้ว ***

function doPost(e) {
  try {
    const request = JSON.parse(e.postData.contents);
    const { action, user } = request;
    
    if (action === 'testTelegramNotification') return handleTestTelegramNotification(user);
    
    // ... (ส่วนการจัดการ Save/Verify อื่นๆ)
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({status: "error", message: error.toString()})).setMimeType(ContentService.MimeType.JSON);
  }
}

function sendTelegramMsg(chatId, text) {
  const url = "https://api.telegram.org/bot" + TELEGRAM_BOT_TOKEN + "/sendMessage";
  const payload = {
    chat_id: chatId,
    text: text,
    parse_mode: "HTML"
  };
  const options = {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };
  UrlFetchApp.fetch(url, options);
}

function handleTestTelegramNotification(user) {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAMES.PROFILE);
    const data = sheet.getDataRange().getValues();
    let chatId = null;
    
    // ค้นหา Telegram ID จาก Username
    for (let i = 1; i < data.length; i++) {
        if (data[i][0] === user.username) {
            chatId = data[i][24]; // คอลัมน์ Y
            break;
        }
    }
    
    if (chatId) {
        sendTelegramMsg(chatId, "✅ <b>การเชื่อมต่อสำเร็จ!</b>\nคุณจะได้รับการแจ้งเตือนสุขภาพผ่านช่องทางนี้ครับ");
        return ContentService.createTextOutput(JSON.stringify({status: "success"})).setMimeType(ContentService.MimeType.JSON);
    }
    return ContentService.createTextOutput(JSON.stringify({status: "error", message: "ไม่พบ Telegram ID"})).setMimeType(ContentService.MimeType.JSON);
}
```
