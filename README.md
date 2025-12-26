
# การเพิ่มความเร็วในการโหลด Leaderboard (ลำดับคนรักสุขภาพ)

เพื่อให้แอปโหลดข้อมูลอันดับได้รวดเร็ว (ภายใน 1-2 วินาที) แม้จะมีผู้ใช้จำนวนมาก ให้ทำตามขั้นตอนดังนี้:

### ขั้นตอนที่ 1: สร้างแผ่นงาน LeaderboardView ใน Google Sheets
1. เปิด Google Sheet ของคุณ
2. สร้างชีตใหม่ (Sheet Tab) ตั้งชื่อว่า `LeaderboardView`
3. ที่เซลล์ **A1** ให้ใส่สูตรนี้ (ปรับตำแหน่งคอลัมน์ตามความจริง):
   ```excel
   =QUERY(Profile!A:Z, "SELECT A, C, Q, O, P, R, E ORDER BY O DESC, Q DESC LIMIT 100", 1)
   ```
   *หมายเหตุ: ในสูตรนี้สมมติว่า A=Username, C=DisplayName, Q=XP, O=Level, P=Badges, R=Org, E=ProfilePic*

### ขั้นตอนที่ 2: อัปเดต Code.gs (Backend)
เพิ่มฟังก์ชันนี้ใน GAS เพื่อให้ดึงข้อมูลจากชีตที่เตรียมไว้แล้ว:

```javascript
function getLeaderboardFast() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("LeaderboardView");
  if (!sheet) return createErrorResponse("LeaderboardView sheet not found");
  
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const results = [];
  
  for (let i = 1; i < data.length; i++) {
    let obj = {};
    headers.forEach((header, index) => {
      obj[header] = data[i][index];
    });
    results.push(obj);
  }
  
  return createSuccessResponse(results);
}

// ใน doPost เพิ่ม case:
// case 'getLeaderboard': return getLeaderboardFast();
```
