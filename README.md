
# การเพิ่มความเร็วและการคืนค่า "อันดับมาแรงประจำสัปดาห์"

เพื่อให้แอปแสดงผลทั้งอันดับรวมและอันดับมาแรงได้รวดเร็ว ให้ทำตามขั้นตอนดังนี้:

### ขั้นตอนที่ 1: สร้างแผ่นงาน TrendingView ใน Google Sheets
ชีตนี้จะใช้นับจำนวนครั้งที่ผู้ใช้ "บันทึกข้อมูล" (Login/Save) ในรอบ 7 วันที่ผ่านมา:
1. สร้างชีตใหม่ชื่อ `TrendingView`
2. ที่เซลล์ **A1** ใส่สูตรนี้ (สมมติว่าชีต loginLog เก็บประวัติการใช้งาน):
   ```excel
   =QUERY(loginLog!A:D, "SELECT B, C, COUNT(A) WHERE A > date '"&TEXT(TODAY()-7, "yyyy-mm-dd")&"' GROUP BY B, C ORDER BY COUNT(A) DESC LIMIT 50 LABEL COUNT(A) 'ActivityCount'", 1)
   ```
   *สูตรนี้จะนับว่าใน 7 วันล่าสุด ใครเข้ามาใช้งานบ่อยที่สุด (ซึ่งสะท้อนถึงความตั้งใจดูแลสุขภาพ)*

### ขั้นตอนที่ 2: อัปเดต Code.gs (Backend)
ปรับปรุงฟังก์ชันให้ส่งข้อมูลแบบ 2-in-1:

```javascript
function getLeaderboardData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // 1. ดึงอันดับรวม
  const mainSheet = ss.getSheetByName("LeaderboardView");
  const mainData = mainSheet ? getRowsAsObjects(mainSheet) : [];
  
  // 2. ดึงอันดับมาแรง (Active ล่าสุด)
  const trendingSheet = ss.getSheetByName("TrendingView");
  const trendingData = trendingSheet ? getRowsAsObjects(trendingSheet) : [];
  
  return createSuccessResponse({
    leaderboard: mainData,
    trending: trendingData
  });
}

// ฟังก์ชันเสริมสำหรับแปลงแถวเป็น Object
function getRowsAsObjects(sheet) {
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const results = [];
  for (let i = 1; i < data.length; i++) {
    let obj = {};
    headers.forEach((h, idx) => obj[h] = data[i][idx]);
    results.push(obj);
  }
  return results;
}
```
