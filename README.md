
# การเชื่อมต่อ Smart Lifestyle Wellness กับ Google Sheets (เวอร์ชันสมบูรณ์ที่สุด)

คู่มือนี้จะแนะนำวิธีการใช้ Google Sheets เป็นฐานข้อมูลส่วนตัวสำหรับแอปพลิเคชัน เพื่อบันทึกและซิงค์ข้อมูลสุขภาพทั้งหมด รวมถึงระบบสมาชิก (Registration), Gamification, และการประเมินผล

## ขั้นตอนการตั้งค่า

โปรดทำตามขั้นตอนต่อไปนี้อย่างละเอียด:

### ขั้นตอนที่ 1: ปรับโครงสร้าง Google Sheet

1.  ไปที่ [sheets.new](https://sheets.new) เพื่อสร้าง Google Sheet ใหม่
2.  **สร้างชีตย่อย (Tabs)** ทั้งหมด 14 ชีต และตั้งชื่อให้ตรงตามนี้เป๊ะๆ
3.  ในแต่ละชีต ให้ตั้งชื่อคอลัมน์ใน **แถวที่ 1 (Row 1)** ดังนี้:

    *   **ชีตที่ 1: `Profile`** (A1-S1): `timestamp`, `username`, `displayName`, `profilePicture`, `gender`, `age`, `weight`, `height`, `waist`, `hip`, `activityLevel`, `role`, `xp`, `level`, `badges`, `email`, `password`, `healthCondition`, `lineUserId`
    *   **ชีตที่ 2: `BMIHistory`** (A1-F1): `timestamp`, `username`, `displayName`, `profilePicture`, `bmi`, `category`
    *   **ชีตที่ 3: `TDEEHistory`** (A1-F1): `timestamp`, `username`, `displayName`, `profilePicture`, `tdee`, `bmr`
    *   **ชีตที่ 4: `FoodHistory`** (A1-G1): `timestamp`, `username`, `displayName`, `profilePicture`, `description`, `calories`, `analysis_json`
    *   **ชีตที่ 5: `PlannerHistory`** (A1-H1): `timestamp`, `username`, `displayName`, `profilePicture`, `cuisine`, `diet`, `tdee_goal`, `plan_json`
    *   **ชีตที่ 6: `LoginLogs`** (A1-D1): `timestamp`, `username`, `displayName`, `role`
    *   **ชีตที่ 7: `WaterHistory`** (A1-E1): `timestamp`, `username`, `displayName`, `profilePicture`, `amount`
    *   **ชีตที่ 8: `CalorieHistory`** (A1-F1): `timestamp`, `username`, `displayName`, `profilePicture`, `name`, `calories`
    *   **ชีตที่ 9: `ActivityHistory`** (A1-F1): `timestamp`, `username`, `displayName`, `profilePicture`, `name`, `caloriesBurned`
    *   **ชีตที่ 10: `SleepHistory`** (A1-I1): `timestamp`, `username`, `displayName`, `profilePicture`, `bedTime`, `wakeTime`, `duration`, `quality`, `hygieneChecklist`
    *   **ชีตที่ 11: `MoodHistory`** (A1-G1): `timestamp`, `username`, `displayName`, `profilePicture`, `emoji`, `stressLevel`, `gratitude`
    *   **ชีตที่ 12: `HabitHistory`** (A1-G1): `timestamp`, `username`, `displayName`, `profilePicture`, `type`, `amount`, `isClean`
    *   **ชีตที่ 13: `SocialHistory`** (A1-F1): `timestamp`, `username`, `displayName`, `profilePicture`, `interaction`, `feeling`
    *   **ชีตที่ 14: `EvaluationHistory`** (A1-F1): `timestamp`, `username`, `displayName`, `role`, `satisfaction_json`, `outcome_json`


### ขั้นตอนที่ 2: เปิด Apps Script Editor

1.  ใน Google Sheet ของคุณ ไปที่เมนู `ส่วนขยาย (Extensions)` > `Apps Script`

### ขั้นตอนที่ 3: เพิ่มโค้ดสคริปต์ (เวอร์ชันล่าสุด)

1.  ลบโค้ดที่มีอยู่ทั้งหมดในไฟล์ `Code.gs`
2.  คัดลอกโค้ด **ทั้งหมด** ด้านล่างนี้ไปวางแทนที่:

```javascript
// --- START OF Code.gs ---

const SHEET_NAMES = {
  PROFILE: "Profile",
  BMI: "BMIHistory",
  TDEE: "TDEEHistory",
  FOOD: "FoodHistory",
  PLANNER: "PlannerHistory",
  WATER: "WaterHistory",
  CALORIE: "CalorieHistory",
  ACTIVITY: "ActivityHistory",
  LOGIN_LOGS: "LoginLogs",
  SLEEP: "SleepHistory",
  MOOD: "MoodHistory",
  HABIT: "HabitHistory",
  SOCIAL: "SocialHistory",
  EVALUATION: "EvaluationHistory"
};

// !!! สำคัญ: ตั้งค่า Admin Key ของคุณที่นี่ !!!
const ADMIN_KEY = "ADMIN1234!";

function doGet(e) {
  try {
    // Admin: Get All Data
    if (e.parameter.action === 'getAllData' && e.parameter.adminKey === ADMIN_KEY) {
       const allData = {};
       for (const key in SHEET_NAMES) {
           allData[key] = getAllRowsAsObjects(SHEET_NAMES[key]);
       }
       return createSuccessResponse({ 
           profiles: allData.PROFILE,
           bmiHistory: allData.BMI,
           tdeeHistory: allData.TDEE,
           foodHistory: allData.FOOD,
           plannerHistory: allData.PLANNER,
           waterHistory: allData.WATER,
           calorieHistory: allData.CALORIE,
           activityHistory: allData.ACTIVITY,
           loginLogs: allData.LOGIN_LOGS,
           evaluationHistory: allData.EVALUATION
       });
    }

    // User: Get User Data
    const username = e.parameter.username;
    if (!username) throw new Error("Username parameter is required.");

    const userData = {
      profile: getLatestProfileForUser(username),
      bmiHistory: getAllHistoryForUser(SHEET_NAMES.BMI, username),
      tdeeHistory: getAllHistoryForUser(SHEET_NAMES.TDEE, username),
      foodHistory: getAllHistoryForUser(SHEET_NAMES.FOOD, username),
      plannerHistory: getAllHistoryForUser(SHEET_NAMES.PLANNER, username),
      waterHistory: getAllHistoryForUser(SHEET_NAMES.WATER, username),
      calorieHistory: getAllHistoryForUser(SHEET_NAMES.CALORIE, username),
      activityHistory: getAllHistoryForUser(SHEET_NAMES.ACTIVITY, username),
      sleepHistory: getAllHistoryForUser(SHEET_NAMES.SLEEP, username),
      moodHistory: getAllHistoryForUser(SHEET_NAMES.MOOD, username),
      habitHistory: getAllHistoryForUser(SHEET_NAMES.HABIT, username),
      socialHistory: getAllHistoryForUser(SHEET_NAMES.SOCIAL, username),
    };
    return createSuccessResponse(userData);
  } catch (error) {
    return createErrorResponse(error);
  }
}

function doPost(e) {
  try {
    const request = JSON.parse(e.postData.contents);
    const { action, type, payload, user } = request;
    
    if (action === 'verifyUser') {
        return handleVerifyUser(request.email, request.password);
    }

    if (action === 'register') {
        return handleRegisterUser(user, request.password);
    }

    if (action === 'socialAuth') {
        return handleSocialAuth(payload);
    }
    
    if (!user || !user.username) throw new Error("User information is missing.");
    
    switch (action) {
      case 'save': return handleSave(type, payload, user);
      case 'clear': return handleClear(type, user);
      default: throw new Error("Invalid action specified.");
    }
  } catch (error) {
    return createErrorResponse(error);
  }
}

function handleSocialAuth(userInfo) {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAMES.PROFILE);
    const data = sheet.getDataRange().getValues();
    const emailIndex = 15; // Column P
    const lineUserIdIndex = 18; // Column S
    
    // 1. Check if email exists
    for (let i = 1; i < data.length; i++) {
        if (data[i][emailIndex] === userInfo.email) {
             // Found existing user
             
             // Update lineUserId if present and different (for notification linkage)
             if (userInfo.userId && data[i][lineUserIdIndex] !== userInfo.userId) {
                 sheet.getRange(i + 1, lineUserIdIndex + 1).setValue(userInfo.userId);
             }

             const user = {
                 username: data[i][1],
                 displayName: data[i][2], // Keep existing display name
                 profilePicture: data[i][3] || userInfo.picture,
                 role: data[i][11] || 'user',
                 email: data[i][15],
                 authProvider: userInfo.provider || 'social'
             };
             return createSuccessResponse(user);
        }
    }

    // 2. Not found, create new user
    const provider = userInfo.provider || 'social';
    const username = provider + '_' + new Date().getTime();
    
    const newRow = [
        new Date(), username, userInfo.name, userInfo.picture,
        '', '', '', '', '', '', '', // Gender...
        'user', // Role
        0, 1, '["novice"]', // XP
        userInfo.email,
        'social_login', // Dummy password
        '', // healthCondition
        userInfo.userId || '' // lineUserId
    ];
    sheet.appendRow(newRow);

    return createSuccessResponse({
        username: username,
        displayName: userInfo.name,
        profilePicture: userInfo.picture,
        role: 'user',
        email: userInfo.email,
        authProvider: provider
    });
}

function handleRegisterUser(user, password) {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAMES.PROFILE);
    const data = sheet.getDataRange().getValues();
    
    // Check if email already exists (Column 16 = Index 15)
    const emailIndex = 15; 
    const usernameIndex = 1;

    for (let i = 1; i < data.length; i++) {
        if (data[i][usernameIndex] === user.username) {
             return createErrorResponse({ message: "Username already exists" });
        }
        if (user.email && data[i][emailIndex] === user.email) {
             return createErrorResponse({ message: "Email already registered" });
        }
    }
    
    // Append new user
    const newRow = [
        new Date(), user.username, user.displayName, user.profilePicture,
        '', '', '', '', '', '', '', // Gender, Age... Activity (Empty initially)
        user.role,
        0, 1, '["novice"]', // XP, Level, Badges
        user.email || '',
        password || '', // Store password
        '', // healthCondition (Empty initially)
        '' // lineUserId
    ];
    
    sheet.appendRow(newRow);
    return createSuccessResponse({ status: "User registered successfully" });
}

function handleVerifyUser(email, password) {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAMES.PROFILE);
    const data = sheet.getDataRange().getValues();
    const emailIndex = 15;
    const passwordIndex = 16;
    
    for (let i = 1; i < data.length; i++) {
        if (data[i][emailIndex] === email) {
            if (String(data[i][passwordIndex]) === String(password)) {
                 const user = {
                     username: data[i][1],
                     displayName: data[i][2],
                     profilePicture: data[i][3],
                     role: data[i][11] || 'user',
                     email: data[i][15],
                     authProvider: 'email'
                 };
                 return createSuccessResponse(user);
            } else {
                 return createErrorResponse({ message: "Incorrect password" });
            }
        }
    }
    return createErrorResponse({ message: "User not found" });
}

function handleSave(type, payload, user) {
  const sheetNameMap = {
    profile: SHEET_NAMES.PROFILE, bmiHistory: SHEET_NAMES.BMI, tdeeHistory: SHEET_NAMES.TDEE,
    foodHistory: SHEET_NAMES.FOOD, plannerHistory: SHEET_NAMES.PLANNER, waterHistory: SHEET_NAMES.WATER,
    calorieHistory: SHEET_NAMES.CALORIE, activityHistory: SHEET_NAMES.ACTIVITY, loginLog: SHEET_NAMES.LOGIN_LOGS,
    sleepHistory: SHEET_NAMES.SLEEP, moodHistory: SHEET_NAMES.MOOD, habitHistory: SHEET_NAMES.HABIT, socialHistory: SHEET_NAMES.SOCIAL,
    evaluationHistory: SHEET_NAMES.EVALUATION
  };
  
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetNameMap[type]);
  if (!sheet) throw new Error(`Sheet not found for type: ${type}`);
  
  let newRow;
  const item = Array.isArray(payload) ? payload[0] : null;
  const commonPrefix = [new Date(), user.username, user.displayName, user.profilePicture];

  switch (type) {
    case 'profile':
      const badgesJson = JSON.stringify(payload.badges || []);
      // Ensure healthCondition is saved (index 17)
      // Note: We don't overwrite lineUserId (index 18) here to prevent data loss if not passed
      
      // Update logic: Use the known username to find the row and update specific columns is safer,
      // but appendRow is current architecture for simplicity (except socialAuth which does lookups).
      // For this simple app, we are appending new snapshots of profile data.
      
      // However, ideally 'profile' should update the existing row for that user.
      // Let's modify handleSave for PROFILE to update instead of append, OR ensure we carry over lineUserId.
      
      // For simplicity in this demo structure where we mostly append history, 
      // but for Profile we should probably find and update or append with all data.
      // Since `getLatestProfileForUser` fetches the last row, appending works fine as a "version history".
      
      // We need to fetch existing lineUserId to preserve it if not in payload
      const existingProfile = getLatestProfileForUser(user.username);
      const existingLineId = existingProfile ? existingProfile.lineUserId : '';

      newRow = [ 
          ...commonPrefix, 
          payload.gender, payload.age, payload.weight, payload.height, payload.waist, payload.hip, payload.activityLevel, user.role,
          payload.xp || 0, payload.level || 1, badgesJson,
          user.email || '', '', // password empty on update
          payload.healthCondition || '',
          existingLineId // Preserve LINE User ID
      ];
      break;
    case 'bmiHistory': newRow = [ ...commonPrefix, item.value, item.category ]; break;
    case 'tdeeHistory': newRow = [ ...commonPrefix, item.value, item.bmr ]; break;
    case 'foodHistory': newRow = [ ...commonPrefix, item.analysis.description, item.analysis.calories, JSON.stringify(item.analysis) ]; break;
    case 'plannerHistory': newRow = [ ...commonPrefix, item.cuisine, item.diet, item.tdee, JSON.stringify(item.plan) ]; break;
    case 'waterHistory': newRow = [ ...commonPrefix, item.amount ]; break;
    case 'calorieHistory': newRow = [ ...commonPrefix, item.name, item.calories ]; break;
    case 'activityHistory': newRow = [ ...commonPrefix, item.name, item.caloriesBurned ]; break;
    case 'sleepHistory': 
        // Include hygieneChecklist at the end
        newRow = [ ...commonPrefix, item.bedTime, item.wakeTime, item.duration, item.quality, JSON.stringify(item.hygieneChecklist || []) ]; 
        break;
    case 'moodHistory': newRow = [ ...commonPrefix, item.moodEmoji, item.stressLevel, item.gratitude ]; break;
    case 'habitHistory': newRow = [ ...commonPrefix, item.type, item.amount, item.isClean ]; break;
    case 'socialHistory': newRow = [ ...commonPrefix, item.interaction, item.feeling ]; break;
    case 'evaluationHistory': 
        newRow = [ new Date(), user.username, user.displayName, user.role, JSON.stringify(item.satisfaction), JSON.stringify(item.outcomes) ];
        break;
    case 'loginLog':
       newRow = [ new Date(), user.username, user.displayName, user.role ];
       break;
    default:
      throw new Error(`Unknown data type for save: ${type}`);
  }
  
  sheet.appendRow(newRow);
  return createSuccessResponse({ status: `${type} saved successfully.` });
}

function handleClear(type, user) {
  const sheetNameMap = {
    bmiHistory: SHEET_NAMES.BMI, tdeeHistory: SHEET_NAMES.TDEE, foodHistory: SHEET_NAMES.FOOD,
    waterHistory: SHEET_NAMES.WATER, calorieHistory: SHEET_NAMES.CALORIE, activityHistory: SHEET_NAMES.ACTIVITY,
    sleepHistory: SHEET_NAMES.SLEEP, moodHistory: SHEET_NAMES.MOOD, habitHistory: SHEET_NAMES.HABIT, socialHistory: SHEET_NAMES.SOCIAL
  };
  const sheetName = sheetNameMap[type];
  if (!sheetName) throw new Error(`Unknown data type for clear: ${type}`);
  
  clearSheetForUser(sheetName, user.username);
  return createSuccessResponse({ status: `${type} cleared successfully.` });
}

function getLatestProfileForUser(username) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAMES.PROFILE);
  if (!sheet || sheet.getLastRow() < 2) return null;
  const allData = sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).getValues();
  const userData = allData.filter(row => row[1] === username); 
  if (userData.length === 0) return null;
  const lastEntry = userData[userData.length - 1];
  
  return { 
      gender: lastEntry[4], age: lastEntry[5], weight: lastEntry[6], height: lastEntry[7], waist: lastEntry[8], hip: lastEntry[9], activityLevel: lastEntry[10],
      xp: lastEntry[12], level: lastEntry[13], badges: lastEntry[14], email: lastEntry[15], healthCondition: lastEntry[17], lineUserId: lastEntry[18]
  };
}

function getAllHistoryForUser(sheetName, username) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  if (!sheet || sheet.getLastRow() < 2) return [];
  const allData = sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).getValues();
  const userData = allData.filter(row => row[1] === username);

  try {
    switch(sheetName) {
        case SHEET_NAMES.BMI: return userData.map(row => ({ date: row[0], value: row[4], category: row[5] }));
        case SHEET_NAMES.TDEE: return userData.map(row => ({ date: row[0], value: row[4], bmr: row[5] }));
        case SHEET_NAMES.FOOD: return userData.map(row => ({ date: row[0], id: new Date(row[0]).toISOString(), analysis: JSON.parse(row[6]) }));
        case SHEET_NAMES.PLANNER: return userData.map(row => ({ date: row[0], id: new Date(row[0]).toISOString(), cuisine: row[4], diet: row[5], tdee: row[6], plan: JSON.parse(row[7]) }));
        case SHEET_NAMES.WATER: return userData.map(row => ({ date: row[0], id: new Date(row[0]).toISOString(), amount: row[4] }));
        case SHEET_NAMES.CALORIE: return userData.map(row => ({ date: row[0], id: new Date(row[0]).toISOString(), name: row[4], calories: row[5] }));
        case SHEET_NAMES.ACTIVITY: return userData.map(row => ({ date: row[0], id: new Date(row[0]).toISOString(), name: row[4], caloriesBurned: row[5] }));
        case SHEET_NAMES.SLEEP: return userData.map(row => ({ date: row[0], id: new Date(row[0]).toISOString(), bedTime: row[4], wakeTime: row[5], duration: row[6], quality: row[7], hygieneChecklist: JSON.parse(row[8] || "[]") }));
        case SHEET_NAMES.MOOD: return userData.map(row => ({ date: row[0], id: new Date(row[0]).toISOString(), moodEmoji: row[4], stressLevel: row[5], gratitude: row[6] }));
        case SHEET_NAMES.HABIT: return userData.map(row => ({ date: row[0], id: new Date(row[0]).toISOString(), type: row[4], amount: row[5], isClean: row[6] }));
        case SHEET_NAMES.SOCIAL: return userData.map(row => ({ date: row[0], id: new Date(row[0]).toISOString(), interaction: row[4], feeling: row[5] }));
        default: return [];
    }
  } catch(e) {
    Logger.log("Error parsing history for user " + username + " in sheet: " + sheetName + ". Error: " + e.message);
    return [];
  }
}

function getAllRowsAsObjects(sheetName) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  if (!sheet || sheet.getLastRow() < 2) return [];
  try {
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(h => h.trim());
    const dataRows = sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).getValues();
    return dataRows.map(row => headers.reduce((obj, header, index) => {
        if (header) obj[header] = row[index];
        return obj;
    }, {}));
  } catch (e) {
    Logger.log("Error in getAllRowsAsObjects for sheet '" + sheetName + "': " + e.message);
    return [];
  }
}

function clearSheetForUser(sheetName, username) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  if (!sheet || sheet.getLastRow() < 2) return;
  const data = sheet.getRange(1, 1, sheet.getLastRow(), sheet.getLastColumn()).getValues();
  const rowsToDelete = data.reduce((acc, row, index) => {
    if (index > 0 && row[1] === username) acc.push(index + 1);
    return acc;
  }, []);
  rowsToDelete.reverse().forEach(rowIndex => sheet.deleteRow(rowIndex));
}

function createSuccessResponse(data) {
  return ContentService.createTextOutput(JSON.stringify({ status: "success", data: data }))
    .setMimeType(ContentService.MimeType.JSON);
}

function createErrorResponse(error) {
  Logger.log(error);
  return ContentService.createTextOutput(JSON.stringify({ status: "error", message: error.message || error }))
    .setMimeType(ContentService.MimeType.JSON);
}

// --- ฟังก์ชันสำหรับสร้างชีตและคอลัมน์อัตโนมัติ (Helper Utility) ---
// วิธีใช้: เลือกฟังก์ชันนี้แล้วกด Run เพื่อสร้าง/รีเซ็ตหัวตารางทั้งหมด

function setupSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // รายชื่อชีตและคอลัมน์ทั้งหมดตามสเปค
  const schema = {
    "Profile": [
      "timestamp", "username", "displayName", "profilePicture", 
      "gender", "age", "weight", "height", "waist", "hip", "activityLevel", 
      "role", "xp", "level", "badges", "email", "password", "healthCondition", "lineUserId"
    ],
    "BMIHistory": [
      "timestamp", "username", "displayName", "profilePicture", "bmi", "category"
    ],
    "TDEEHistory": [
      "timestamp", "username", "displayName", "profilePicture", "tdee", "bmr"
    ],
    "FoodHistory": [
      "timestamp", "username", "displayName", "profilePicture", "description", "calories", "analysis_json"
    ],
    "PlannerHistory": [
      "timestamp", "username", "displayName", "profilePicture", "cuisine", "diet", "tdee_goal", "plan_json"
    ],
    "LoginLogs": [
      "timestamp", "username", "displayName", "role"
    ],
    "WaterHistory": [
      "timestamp", "username", "displayName", "profilePicture", "amount"
    ],
    "CalorieHistory": [
      "timestamp", "username", "displayName", "profilePicture", "name", "calories"
    ],
    "ActivityHistory": [
      "timestamp", "username", "displayName", "profilePicture", "name", "caloriesBurned"
    ],
    "SleepHistory": [
      "timestamp", "username", "displayName", "profilePicture", "bedTime", "wakeTime", "duration", "quality", "hygieneChecklist"
    ],
    "MoodHistory": [
      "timestamp", "username", "displayName", "profilePicture", "emoji", "stressLevel", "gratitude"
    ],
    "HabitHistory": [
      "timestamp", "username", "displayName", "profilePicture", "type", "amount", "isClean"
    ],
    "SocialHistory": [
      "timestamp", "username", "displayName", "profilePicture", "interaction", "feeling"
    ],
    "EvaluationHistory": [
      "timestamp", "username", "displayName", "role", "satisfaction_json", "outcome_json"
    ]
  };

  // วนลูปสร้าง/อัปเดตทีละชีต
  for (const [sheetName, columns] of Object.entries(schema)) {
    let sheet = ss.getSheetByName(sheetName);
    
    // 1. ถ้าไม่มีชีต ให้สร้างใหม่
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
      Logger.log(`Created new sheet: ${sheetName}`);
    } else {
      Logger.log(`Found existing sheet: ${sheetName}`);
    }

    // 2. เขียนหัวคอลัมน์ทับแถวที่ 1 เสมอ
    const headerRange = sheet.getRange(1, 1, 1, columns.length);
    headerRange.setValues([columns]);
    
    // จัดรูปแบบหัวตาราง (ตัวหนา, จัดกึ่งกลาง, แช่แข็งแถวที่ 1)
    headerRange.setFontWeight("bold");
    headerRange.setHorizontalAlignment("center");
    sheet.setFrozenRows(1);
    
    Logger.log(`Updated headers for: ${sheetName}`);
  }

  Logger.log("--- Setup Complete! All sheets are ready. ---");
}

// --- END OF Code.gs ---
```

### ขั้นตอนที่ 4: Deploy ใหม่ (สำคัญที่สุด!)

1.  กดปุ่มสีน้ำเงิน **`ทำให้ใช้งานได้ (Deploy)`** > **`การทำให้ใช้งานได้รายการใหม่ (New deployment)`**
2.  เลือกประเภท: **เว็บแอป (Web app)**
3.  การตั้งค่า:
    *   **ผู้ดำเนินการ:** *ฉัน (Me)*
    *   **ผู้ที่เข้าถึงได้:** ***ทุกคน (Anyone)***  <-- **ต้องเลือกอันนี้เท่านั้น**
4.  กด `ทำให้ใช้งานได้ (Deploy)` และ **ให้สิทธิ์การเข้าถึง (Authorize)**
5.  คัดลอก **URL** ใหม่ที่ได้ ไปอัปเดตในหน้า **ตั้งค่า (Settings)** ของแอปพลิเคชัน

### ขั้นตอนที่ 5: การตั้งค่า Google Login (OAuth 2.0)

1.  ไปที่ **[Google Cloud Console](https://console.cloud.google.com/)**
2.  สร้าง Project หรือเลือก Project
3.  เมนู **APIs & Services** > **Credentials** > **+ CREATE CREDENTIALS** > **OAuth client ID**
4.  Application type: **Web application**
5.  **Authorized JavaScript origins:** ใส่ URL ของแอปที่คุณรันอยู่
6.  คัดลอก **Client ID** ไปแทนที่ในไฟล์ `App.tsx`

### ขั้นตอนที่ 6: การตั้งค่า LINE Login (LIFF)

เพื่อให้ปุ่ม "Log in with LINE" ใช้งานได้จริง คุณต้องสร้าง LIFF App:

1.  ไปที่ **[LINE Developers Console](https://developers.line.biz/)** และล็อกอิน
2.  กด **Create a new provider** (ถ้ายังไม่มี)
3.  กด **Create a new channel** เลือก **LINE Login**
    *   กรอกข้อมูลให้ครบถ้วน (Channel Name, Description, etc.)
4.  เมื่อสร้างเสร็จ ไปที่แท็บ **LIFF** แล้วกด **Add**
    *   **LIFF app name:** ตั้งชื่อแอป
    *   **Size:** Full, Tall หรือ Compact (แนะนำ Full)
    *   **Endpoint URL:** ใส่ URL ของแอปที่คุณรันอยู่ (ต้องเป็น HTTPS เท่านั้น หาก Localhost ให้ใช้ ngrok หรือ Cloudflare Tunnel)
    *   **Scopes:** เลือก `profile` และ `openid` (ถ้าต้องการอีเมลต้องกดขออนุญาตเพิ่มในแท็บ Basic Settings > OpenID Connect)
5.  กด **Add** แล้วคุณจะได้ **LIFF ID** (รูปแบบ `1234567890-AbCdEfGh`)
6.  นำ LIFF ID ไปแทนที่ในไฟล์ `components/Auth.tsx` ตรงบรรทัด:
    ```javascript
    const LINE_LIFF_ID = "YOUR_LIFF_ID_HERE"; 
    ```
