
# การตั้งค่า Google Sheets (Final Fixed v3.5 - Strict Mode)

### วิธีการอัปเดต (สำคัญมาก!)
1. ไปที่ **Google Apps Script** ของโปรเจกต์คุณ
2. **ลบโค้ดเก่าทั้งหมด** ในไฟล์ `Code.gs`
3. **คัดลอกโค้ดฉบับเต็มด้านล่างนี้ (v3.5)** ไปวางแทนที่
4. กด **Save** (รูปแผ่นดิสก์)
5. กด **Deploy** > **New deployment** > กด **Deploy** อีกครั้ง (เพื่อให้ URL เดิมใช้งานกับโค้ดใหม่ได้)

### 1. ไฟล์ Code.gs (ฉบับเต็ม v3.5 - Force 'LoginLogs' ONLY)

```javascript
/**
 * Smart Lifestyle Wellness - Backend Script (v3.5 Strict)
 * - Forces 'LoginLogs' sheet name (Exact Match Only)
 * - Removes fuzzy matching to prevent using 'loginLog' or 'loginLogs'
 */

const SHEET_NAMES = {
  PROFILE: 'profile',
  USERS: 'users',
  LOGIN_LOGS: 'LoginLogs', // บังคับใช้ชื่อนี้เป๊ะๆ (ตัว L ใหญ่ มี s)
  LEADERBOARD_VIEW: 'LeaderboardView', 
  TRENDING_VIEW: 'TrendingView'
};

// ฟังก์ชันค้นหา Sheet แบบแม่นยำ (Exact Match Only)
// แก้ปัญหาหาชีตผิด หรือไปใช้ชีตเก่าที่ชื่อคล้ายกัน
function getSheet(ss, name) {
  let sheet = ss.getSheetByName(name);
  
  // ถ้าไม่เจอ ให้สร้างใหม่ด้วยชื่อที่ถูกต้องเป๊ะๆ ทันที
  if (!sheet) {
    sheet = ss.insertSheet(name);
  }
  return sheet;
}

function setupSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // Setup Profile
  let profileSheet = getSheet(ss, SHEET_NAMES.PROFILE);
  const headers = [
    "timestamp", "username", "displayName", "profilePicture", "gender", 
    "age", "weight", "height", "waist", "hip", "activityLevel", 
    "role", "xp", "level", "badges", "email", "password", 
    "healthCondition", "lineUserId", "receiveDailyReminders", 
    "researchId", "pdpaAccepted", "pdpaAcceptedDate", "organization", "deltaXp"
  ];
  if (profileSheet.getLastRow() === 0) {
    profileSheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    profileSheet.setFrozenRows(1);
  }
  
  // Setup Users
  const usersSheet = getSheet(ss, SHEET_NAMES.USERS);
  if (usersSheet.getLastRow() === 0) usersSheet.appendRow(["email", "password", "username", "userDataJson", "timestamp"]);
  
  // Setup LoginLogs (ใช้ชีต LoginLogs เท่านั้น)
  const logSheet = getSheet(ss, SHEET_NAMES.LOGIN_LOGS);
  if (logSheet.getLastRow() === 0) {
    logSheet.appendRow(["timestamp", "username", "displayName", "role", "organization"]);
  }
  
  return "Setup Complete (v3.5 - LoginLogs Strict)";
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
  let sheet = getSheet(ss, type);
  const timestamp = new Date();
  
  if (type === SHEET_NAMES.PROFILE) {
    const oldXp = getMaxXpForUser(user.username);
    const newXpTotal = Number(payload.xp || 0);
    const deltaXp = Math.max(0, newXpTotal - oldXp);

    const rowData = [
      timestamp, String(user.username), String(user.displayName), String(user.profilePicture),
      String(payload.gender || ''), payload.age || '', payload.weight || '', payload.height || '',
      String(payload.waist || ''), String(payload.hip || ''), payload.activityLevel || '',
      (typeof user.role === 'string') ? user.role : 'user', 
      newXpTotal, payload.level || 1, JSON.stringify(payload.badges || []),
      String(payload.email || user.email || ''), '', String(payload.healthCondition || ''),
      String(payload.lineUserId || ''), payload.receiveDailyReminders, String(payload.researchId || ''),
      payload.pdpaAccepted, String(payload.pdpaAcceptedDate || ''), String(payload.organization || 'general'),
      deltaXp
    ];
    sheet.appendRow(rowData);
  } else {
    // General Logs
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
  const sheet = getSheet(ss, SHEET_NAMES.PROFILE);
  if (sheet.getLastRow() < 2) return 0;
  const data = sheet.getRange(2, 2, sheet.getLastRow() - 1, 12).getValues(); 
  let max = 0;
  for (let i = 0; i < data.length; i++) {
    if (data[i][0] === username) { 
      const val = Number(data[i][11]);
      if (val > max) max = val;
    }
  }
  return max;
}

function handleGetLeaderboard() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const getData = (sheetName) => {
    const sheet = getSheet(ss, sheetName);
    if (!sheet || sheet.getLastRow() < 2) return [];
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    return data.slice(1).map(row => {
      let obj = {};
      headers.forEach((h, i) => {
        let cleanKey = h.replace(/^(MAX|SUM)\s|\(|\)/g, '').trim(); 
        if(cleanKey === 'totalXp') cleanKey = 'xp';
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
  const profileSheet = getSheet(ss, SHEET_NAMES.PROFILE);
  let userProfile = null;
  
  if (profileSheet.getLastRow() > 1) {
    const data = profileSheet.getDataRange().getValues();
    for (let i = data.length - 1; i >= 1; i--) {
      if (data[i][1] === username) {
        const row = data[i];
        userProfile = {
          username: row[1], displayName: row[2], profilePicture: row[3],
          gender: row[4], age: row[5], weight: row[6], height: row[7],
          waist: row[8], hip: row[9], activityLevel: row[10],
          xp: row[12], level: row[13], badges: row[14], email: row[15],
          healthCondition: row[17], lineUserId: row[18], receiveDailyReminders: row[19],
          researchId: row[20], pdpaAccepted: row[21], pdpaAcceptedDate: row[22],
          organization: row[23]
        };
        break;
      }
    }
  }

  const getHistory = (name) => {
    const s = getSheet(ss, name);
    if (!s || s.getLastRow() < 2) return [];
    return s.getDataRange().getValues()
      .filter(r => r[1] === username)
      .map(r => { try { return JSON.parse(r[2]); } catch(e) { return null; } })
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
  let sheet = getSheet(ss, SHEET_NAMES.USERS);
  const data = sheet.getDataRange().getValues();
  if (data.length > 1 && data.some(r => r[0] === user.email)) return createResponse('error', 'Email already exists');
  
  const safeUser = { ...user, role: user.role || 'user' };
  sheet.appendRow([safeUser.email, password, safeUser.username, JSON.stringify(safeUser), new Date()]);
  return createResponse('success', 'Registered');
}

function handleVerify(email, password) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = getSheet(ss, SHEET_NAMES.USERS);
  if (sheet.getLastRow() < 2) return createResponse('error', 'No users found');
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
  let sheet = getSheet(ss, SHEET_NAMES.USERS);
  
  let data = [];
  if (sheet.getLastRow() > 1) {
      data = sheet.getDataRange().getValues();
  }
  
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
  // ใช้ getSheet เพื่อหา LoginLogs ให้เจอแน่นอน (จะไม่หา loginLog ตัวเล็กแล้ว)
  let sheet = getSheet(ss, SHEET_NAMES.LOGIN_LOGS);
  
  sheet.appendRow([
    new Date(), 
    user.username, 
    user.displayName, 
    user.role, 
    user.organization || 'general'
  ]);
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
    } else if (name === SHEET_NAMES.LOGIN_LOGS) { 
        // Strict match: Only read from 'LoginLogs'
        const data = s.getDataRange().getValues();
        result['loginLogs'] = data.slice(1).map(row => {
            return {
                timestamp: row[0],
                username: row[1],
                displayName: row[2],
                role: row[3],
                organization: row[4]
            };
        });
    } else if (name !== SHEET_NAMES.LEADERBOARD_VIEW && name !== SHEET_NAMES.TRENDING_VIEW && name !== 'loginLog') {
        // Exclude 'loginLog' explicitly if it exists to avoid duplication
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

function createResponse(status, content) {
  const response = { status: status };
  if (status === 'success') {
    response.data = content;
  } else {
    response.message = content;
    response.data = content; 
  }
  return ContentService.createTextOutput(JSON.stringify(response)).setMimeType(ContentService.MimeType.JSON);
}
```
