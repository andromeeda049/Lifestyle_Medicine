
# การติดตั้ง Backend (Code.gs) และโครงสร้างชีต

กรุณาตรวจสอบว่าชื่อแผ่นงาน (Sheet Name) และสูตรใน Google Sheets ของคุณตรงตามนี้:

### 1. ชื่อชีตข้อมูลหลัก
- **profile**: (ไม่มี s) เก็บข้อมูลผู้ใช้ (A: username, J: xp, K: level, M: organization)
- **loginLogs**: (มี s) เก็บประวัติการเข้าใช้งาน (A: timestamp, B: username)

### 2. ชีตสำหรับแสดงผล (View Sheets)
สร้างชีตใหม่ 2 ชีต และใส่สูตรที่เซลล์ **A1**:
- **LeaderboardView**: 
  `=QUERY(profile!A:M, "SELECT A, B, C, J, K, L, M WHERE A IS NOT NULL ORDER BY J DESC LIMIT 100", 1)`
- **TrendingView**: 
  `=QUERY(loginLogs!A:C, "SELECT B, C, COUNT(A) WHERE A > date '"&TEXT(TODAY()-7, "yyyy-mm-dd")&"' GROUP BY B, C ORDER BY COUNT(A) DESC LIMIT 50 LABEL COUNT(A) 'ActivityCount'", 1)`

### 3. โค้ดใน Code.gs (Apps Script)
คัดลอกส่วนนี้ไปไว้ในไฟล์ **Code.gs**:

```javascript
function doPost(e) {
  try {
    var requestData = JSON.parse(e.postData.contents);
    var action = requestData.action;

    if (action === 'getLeaderboard') {
      return getUnifiedLeaderboard();
    }
    
    // ... action อื่นๆ (save, register, etc.)
    
    return createErrorResponse("Invalid action: " + action);
  } catch (err) {
    return createErrorResponse(err.toString());
  }
}

function getUnifiedLeaderboard() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // ดึงจากชีต View ที่เราใส่สูตร QUERY ไว้
  const mainSheet = ss.getSheetByName("LeaderboardView");
  const trendingSheet = ss.getSheetByName("TrendingView");
  
  const mainData = mainSheet ? getRowsAsObjects(mainSheet) : [];
  const trendingData = trendingSheet ? getRowsAsObjects(trendingSheet) : [];
  
  return createSuccessResponse({
    leaderboard: mainData,
    trending: trendingData
  });
}

function getRowsAsObjects(sheet) {
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return []; // ถ้ามีแต่หัวตาราง หรือไม่มีข้อมูลเลย จะคืนค่าอาเรย์ว่าง
  
  const headers = data[0];
  const results = [];
  
  for (let i = 1; i < data.length; i++) {
    let obj = {};
    let hasData = false;
    headers.forEach((h, idx) => {
      let val = data[i][idx];
      if (val !== "" && val !== null) hasData = true;
      
      if (h === 'badges' && typeof val === 'string' && val.startsWith('[')) {
        try { val = JSON.parse(val); } catch(e) {}
      }
      obj[h] = val;
    });
    if (hasData) results.push(obj);
  }
  return results;
}

function createSuccessResponse(data) {
  return ContentService.createTextOutput(JSON.stringify({
    status: 'success',
    data: data
  })).setMimeType(ContentService.MimeType.JSON);
}

function createErrorResponse(msg) {
  return ContentService.createTextOutput(JSON.stringify({
    status: 'error',
    message: msg
  })).setMimeType(ContentService.MimeType.JSON);
}
```
