
# การเพิ่มความเร็วในการโหลด Leaderboard (ลำดับคนรักสุขภาพ)

เพื่อให้แอปโหลดข้อมูลอันดับได้รวดเร็ว (ภายใน 1-2 วินาที) แม้จะมีผู้ใช้จำนวนมาก ให้ทำตามขั้นตอนดังนี้:

### ขั้นตอนที่ 1: สร้างแผ่นงาน LeaderboardView ใน Google Sheets
1. เปิด Google Sheet ของคุณ
2. สร้างชีตใหม่ (Sheet Tab) ตั้งชื่อว่า `LeaderboardView`
3. ที่เซลล์ **A1** ให้ใส่สูตรนี้ เพื่อดึงเฉพาะข้อมูลที่จำเป็นและเรียงลำดับตาม Level และ XP:
   ```excel
   =QUERY(Profile!A:Z, "SELECT A, C, Q, O, P, R, E ORDER BY O DESC, Q DESC LIMIT 100", 1)
   ```
   *คำอธิบายคอลัมน์ในสูตร:*
   - A: username, C: displayName, Q: XP, O: level, P: badges, R: organization, E: profilePicture

### ขั้นตอนที่ 2: อัปเดต Code.gs (Backend ใน Google Apps Script)
เพิ่มฟังก์ชันนี้ในไฟล์ `Code.gs` และเรียกใช้ผ่าน `doPost` เพื่อให้ดึงข้อมูลจากชีตที่คำนวณไว้แล้ว:

```javascript
// ฟังก์ชันดึงข้อมูลจาก LeaderboardView โดยตรง
function getLeaderboardFast() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("LeaderboardView");
  if (!sheet) return createErrorResponse("LeaderboardView sheet not found. Please create it and add the QUERY formula.");
  
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const results = [];
  
  for (let i = 1; i < data.length; i++) {
    let obj = {};
    headers.forEach((header, index) => {
      // ตรวจสอบคอลัมน์ Badges ว่าเป็น JSON หรือไม่
      let value = data[i][index];
      if (header === 'badges' && typeof value === 'string' && value.startsWith('[')) {
        try { value = JSON.parse(value); } catch(e) {}
      }
      obj[header] = value;
    });
    results.push(obj);
  }
  
  return createSuccessResponse(results);
}

// ในฟังก์ชัน doPost ให้เพิ่ม Case นี้:
// if (action === 'getLeaderboard') return getLeaderboardFast();
```

### ขั้นตอนที่ 3: อัปเดต Telegram Bot Token
หากคุณยังไม่ได้ใส่ Token ให้เข้าไปแก้ที่บรรทัดด้านบนของ `Code.gs`:
```javascript
const TELEGRAM_BOT_TOKEN = "8501481610:AAHhn7XclhoWqyMlkd6LkckiEMW9VvsvQsQ";
```
