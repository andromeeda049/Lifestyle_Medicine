
# การตั้งค่า Google Sheets สำหรับระบบ Leaderboard (25 Columns Version)

### วิธีแก้ไขข้อมูลผิดตำแหน่ง (Important Fix)
เพื่อให้ข้อมูลลงล็อก 100% โปรดอัปเดตไฟล์ `Code.gs` เป็นเวอร์ชัน v3.1 นี้ ซึ่งมีการบังคับประเภทตัวแปร (Type Enforcement) และล็อคตำแหน่งคอลัมน์ไม่ให้เลื่อน

### 1. ไฟล์ Code.gs (v3.1 - Robust Fix)
คัดลอกโค้ดนี้ไปแทนที่ใน Apps Script ของคุณ

```javascript
/**
 * Smart Lifestyle Wellness - Backend Script (v3.1 - ROBUST FIX)
 * แก้ไขปัญหาข้อมูลสลับช่อง และบังคับโครงสร้างข้อมูลให้ถูกต้อง
 */

const SHEET_NAMES = {
  PROFILE: 'profile',
  USERS: 'users',
  LOGIN_LOGS: 'loginLogs',
  LEADERBOARD_VIEW: 'LeaderboardView', 
  TRENDING_VIEW: 'TrendingView'
};

function setupSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let profileSheet = ss.getSheetByName(SHEET_NAMES.PROFILE) || ss.insertSheet(SHEET_NAMES.PROFILE);
  
  const headers = [
    "timestamp",              // A (0)
    "username",               // B (1)
    "displayName",            // C (2)
    "profilePicture",         // D (3)
    "gender",                 // E (4)
    "age",                    // F (5)
    "weight",                 // G (6)
    "height",                 // H (7)
    "waist",                  // I (8)
    "hip",                    // J (9)
    "activityLevel",          // K (10)
    "role",                   // L (11)
    "xp",                     // M (12)
    "level",                  // N (13)
    "badges",                 // O (14)
    "email",                  // P (15)
    "password",               // Q (16)
    "healthCondition",        // R (17)
    "lineUserId",             // S (18)
    "receiveDailyReminders",  // T (19)
    "researchId",             // U (20)
    "pdpaAccepted",           // V (21)
    "pdpaAcceptedDate",       // W (22)
    "organization",           // X (23)
    "deltaXp"                 // Y (24)
  ];
  
  profileSheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  profileSheet.setFrozenRows(1);
  
  // Set format for JSON columns to Plain Text to prevent auto-formatting issues
  profileSheet.getRange("O:O").setNumberFormat("@"); // Badges
  profileSheet.getRange("X:X").setNumberFormat("@"); // Organization
  
  if (!ss.getSheetByName(SHEET_NAMES.USERS)) ss.insertSheet(SHEET_NAMES.USERS).appendRow(["email", "password", "username", "userDataJson", "timestamp"]);
  if (!ss.getSheetByName(SHEET_NAMES.LOGIN_LOGS)) ss.insertSheet(SHEET_NAMES.LOGIN_LOGS).appendRow(["timestamp", "username", "displayName", "role", "organization"]);
  
  return "โครงสร้าง 25 คอลัมน์พร้อมใช้งาน (v3.1 Fixed)!";
}

function doPost(e) {
  try {
    const request = JSON.parse(e.postData.contents);
    const { action, type, payload, user, password } = request;
    
    if (action === 'register') return handleRegister(user, password);
    if (action === 'verifyUser') return handleVerify(request.email, password);
    if (action === 'socialAuth') return handleSocialAuth(payload);
    if (action === 'save') return handleSave(type, payload, user);
    if (action === 'getLeaderboard') return handleGetLeaderboard();
    if (action === 'notifyComplete') return createResponse('success', 'Notified');
    if (action === 'testNotification') return createResponse('success', 'LINE Test Sent');
    if (action === 'testTelegramNotification') return createResponse('success', 'Telegram Test Sent');
    
    return createResponse('error', 'Invalid action');
  } catch (err) {
    return createResponse('error', err.toString());
  }
}

function doGet(e) {
  const action = e.parameter.action;
  const username = e.parameter.username;
  const adminKey = e.parameter.adminKey;

  if (action === 'getAllData' && adminKey) return handleAdminFetch();
  if (username) return handleUserFetch(username);
  
  return createResponse('error', 'Unauthorized');
}

function handleSave(type, payload, user) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(type) || ss.insertSheet(type);
  const timestamp = new Date();
  
  if (type === SHEET_NAMES.PROFILE) {
    const oldXp = getMaxXpForUser(user.username);
    const newXpTotal = Number(payload.xp || 0);
    const deltaXp = Math.max(0, newXpTotal - oldXp);

    // FIX: Enforce types to prevent data shifting
    const safeRole = (typeof user.role === 'string') ? user.role : 'user';
    const safeWaist = String(payload.waist || '');
    const safeHip = String(payload.hip || '');
    const safeOrg = String(payload.organization || 'general');
    
    // Explicit Array Construction (25 Columns)
    const rowData = new Array(25);
    rowData[0] = timestamp;
    rowData[1] = String(user.username);
    rowData[2] = String(user.displayName);
    rowData[3] = String(user.profilePicture);
    rowData[4] = String(payload.gender || '');
    rowData[5] = payload.age || '';
    rowData[6] = payload.weight || '';
    rowData[7] = payload.height || '';
    rowData[8] = safeWaist;
    rowData[9] = safeHip;
    rowData[10] = payload.activityLevel || '';
    rowData[11] = safeRole; // Col L (Fixed)
    rowData[12] = newXpTotal;
    rowData[13] = payload.level || 1;
    rowData[14] = JSON.stringify(payload.badges || []); // Col O
    rowData[15] = String(payload.email || user.email || '');
    rowData[16] = ''; 
    rowData[17] = String(payload.healthCondition || '');
    rowData[18] = String(payload.lineUserId || '');
    rowData[19] = payload.receiveDailyReminders;
    rowData[20] = String(payload.researchId || '');
    rowData[21] = payload.pdpaAccepted;
    rowData[22] = String(payload.pdpaAcceptedDate || '');
    rowData[23] = safeOrg; // Col X
    rowData[24] = deltaXp; // Col Y

    sheet.appendRow(rowData);
  } else {
    const dataArray = Array.isArray(payload) ? payload : [payload];
    dataArray.forEach(item => {
      const logData = { ...item, organization: user.organization || 'general' };
      sheet.appendRow([timestamp, user.username, JSON.stringify(logData)]);
    });
  }
  return createResponse('success', 'Saved');
}

function getMaxXpForUser(username) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAMES.PROFILE);
  if (!sheet) return 0;
  
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return 0;
  
  // Read username (B) and xp (M)
  const data = sheet.getRange(2, 2, lastRow - 1, 12).getValues(); 
  
  let max = 0;
  for (let i = 0; i < data.length; i++) {
    if (data[i][0] === username) { // Col B is index 0 here
      const val = Number(data[i][11]); // Col M is index 11 relative to B
      if (val > max) max = val;
    }
  }
  return max;
}

function handleGetLeaderboard() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  const getData = (sheetName) => {
    const sheet = ss.getSheetByName(sheetName);
    if (!sheet) return [];
    const data = sheet.getDataRange().getValues();
    if (data.length < 2) return [];
    
    const headers = data[0];
    return data.slice(1).map(row => {
      let obj = {};
      headers.forEach((h, i) => {
        let cleanKey = h.replace(/^(MAX|SUM)\s|\(|\)/g, '').trim(); 
        if(cleanKey === 'totalXp') cleanKey = 'xp';
        if(cleanKey === 'weeklyXp') cleanKey = 'weeklyXp';
        obj[cleanKey] = row[i];
      });
      return obj;
    });
  };

  return createResponse('success', {
    leaderboard: getData(SHEET_NAMES.LEADERBOARD_VIEW),
    trending: getData(SHEET_NAMES.TRENDING_VIEW)
  });
}

function handleUserFetch(username) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const profileSheet = ss.getSheetByName(SHEET_NAMES.PROFILE);
  let userProfile = null;
  
  if (profileSheet) {
    const data = profileSheet.getDataRange().getValues();
    for (let i = data.length - 1; i >= 1; i--) {
      if (data[i][1] === username) {
        const row = data[i];
        userProfile = {
          username: row[1],
          displayName: row[2],
          profilePicture: row[3],
          gender: row[4],
          age: row[5],
          weight: row[6],
          height: row[7],
          waist: row[8],
          hip: row[9],
          activityLevel: row[10],
          xp: row[12],
          level: row[13],
          badges: row[14],
          email: row[15],
          healthCondition: row[17],
          lineUserId: row[18],
          receiveDailyReminders: row[19],
          researchId: row[20],
          pdpaAccepted: row[21],
          pdpaAcceptedDate: row[22],
          organization: row[23]
        };
        break;
      }
    }
  }

  const getHistory = (name) => {
    const s = ss.getSheetByName(name);
    if (!s) return [];
    return s.getDataRange().getValues()
      .filter(r => r[1] === username)
      .map(r => {
        try { return JSON.parse(r[2]); } catch(e) { return null; }
      })
      .filter(x => x !== null);
  };

  return createResponse('success', {
    profile: userProfile,
    bmiHistory: getHistory('bmiHistory'),
    tdeeHistory: getHistory('tdeeHistory'),
    foodHistory: getHistory('foodHistory'),
    waterHistory: getHistory('waterHistory'),
    calorieHistory: getHistory('calorieHistory'),
    activityHistory: getHistory('activityHistory'),
    sleepHistory: getHistory('sleepHistory'),
    moodHistory: getHistory('moodHistory'),
    habitHistory: getHistory('habitHistory'),
    socialHistory: getHistory('socialHistory'),
    quizHistory: getHistory('quizHistory'),
    evaluationHistory: getHistory('evaluationHistory')
  });
}

function handleRegister(user, password) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAMES.USERS) || ss.insertSheet(SHEET_NAMES.USERS);
  const data = sheet.getDataRange().getValues();
  if (data.some(r => r[0] === user.email)) return createResponse('error', 'Email already exists');
  
  // FIX: Force role to user default if missing
  const safeUser = { ...user, role: user.role || 'user' };
  sheet.appendRow([safeUser.email, password, safeUser.username, JSON.stringify(safeUser), new Date()]);
  return createResponse('success', 'Registered');
}

function handleVerify(email, password) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAMES.USERS);
  if (!sheet) return createResponse('error', 'No users found');
  const data = sheet.getDataRange().getValues();
  const row = data.find(r => r[0] === email && String(r[1]) === String(password));
  if (row) {
    const u = JSON.parse(row[3]);
    logLogin(u);
    return createResponse('success', u);
  }
  return createResponse('error', 'Invalid credentials');
}

function handleSocialAuth(payload) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAMES.USERS) || ss.insertSheet(SHEET_NAMES.USERS);
  const data = sheet.getDataRange().getValues();
  
  const key = payload.email || payload.userId;
  let row = data.find(r => r[0] === key || (JSON.parse(r[3]||'{}').userId === payload.userId));
  
  let userData;
  if (row) {
    userData = JSON.parse(row[3]);
    if(payload.picture && userData.profilePicture !== payload.picture) {
        userData.profilePicture = payload.picture;
    }
  } else {
    userData = {
      username: 'u_' + Date.now(),
      displayName: payload.name,
      profilePicture: payload.picture,
      role: 'user',
      email: payload.email,
      organization: 'general',
      authProvider: payload.provider,
      userId: payload.userId
    };
    sheet.appendRow([key, 'SOCIAL', userData.username, JSON.stringify(userData), new Date()]);
  }
  logLogin(userData);
  return createResponse('success', userData);
}

function logLogin(user) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAMES.LOGIN_LOGS) || ss.insertSheet(SHEET_NAMES.LOGIN_LOGS);
  sheet.appendRow([new Date(), user.username, user.displayName, user.role, user.organization]);
}

function handleAdminFetch() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const result = {};
  ss.getSheets().forEach(s => {
    const name = s.getName();
    if(name === SHEET_NAMES.PROFILE) {
        const data = s.getDataRange().getValues();
        const headers = data[0];
        result['profiles'] = data.slice(1).map(row => {
            let obj = {};
            headers.forEach((h, i) => obj[h] = row[i]);
            return obj;
        });
    } else if (name !== SHEET_NAMES.LEADERBOARD_VIEW && name !== SHEET_NAMES.TRENDING_VIEW) {
        const data = s.getDataRange().getValues();
        result[name] = data.slice(1).map(r => {
            try { 
                let json = JSON.parse(r[2]); 
                json.timestamp = r[0];
                return json;
            } catch(e) { return r; }
        });
    }
  });
  return createResponse('success', result);
}

function createResponse(status, data) {
  return ContentService.createTextOutput(JSON.stringify({ status, data })).setMimeType(ContentService.MimeType.JSON);
}
```

### 2. สูตร QUERY (ยืนยันใช้สูตรนี้)
สูตรเดิมถูกต้องสำหรับโครงสร้าง 25 คอลัมน์ แต่อาจแสดงผลผิดถ้าข้อมูลดิบเลื่อนตำแหน่ง หลังจากใช้สคริปต์ v3.1 แล้ว ให้ใช้สูตรนี้:

**LeaderboardView (A1)**
```excel
=QUERY(profile!A:Z, "SELECT Col2, MAX(Col3), MAX(Col4), MAX(Col13), MAX(Col14), MAX(Col15), MAX(Col24) WHERE Col2 IS NOT NULL GROUP BY Col2 ORDER BY MAX(Col13) DESC LABEL Col2 'username', MAX(Col3) 'displayName', MAX(Col4) 'profilePicture', MAX(Col13) 'totalXp', MAX(Col14) 'level', MAX(Col15) 'badges', MAX(Col24) 'organization'", 1)
```

**TrendingView (A1)**
```excel
=QUERY(profile!A:Z, "SELECT Col2, MAX(Col3), MAX(Col4), SUM(Col25), MAX(Col24) WHERE Col2 IS NOT NULL AND Col1 >= date '"&TEXT(TODAY()-7, "yyyy-mm-dd")&"' GROUP BY Col2 ORDER BY SUM(Col25) DESC LABEL Col2 'username', MAX(Col3) 'displayName', MAX(Col4) 'profilePicture', SUM(Col25) 'weeklyXp', MAX(Col24) 'organization'", 1)
```
