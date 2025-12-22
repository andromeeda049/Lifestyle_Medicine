
# การเชื่อมต่อ Smart Lifestyle Wellness กับ Google Sheets (เวอร์ชันสมบูรณ์ที่สุด)

คู่มือนี้จะแนะนำวิธีการใช้ Google Sheets เป็นฐานข้อมูลส่วนตัวสำหรับแอปพลิเคชัน เพื่อบันทึกและซิงค์ข้อมูลสุขภาพทั้งหมด รวมถึงระบบสมาชิก (Registration), Gamification, และการประเมินผล

## ขั้นตอนการตั้งค่า

โปรดทำตามขั้นตอนต่อไปนี้อย่างละเอียด:

### ขั้นตอนที่ 1: ปรับโครงสร้าง Google Sheet

1.  ไปที่ [sheets.new](https://sheets.new) เพื่อสร้าง Google Sheet ใหม่
2.  **สร้างชีตย่อย (Tabs)** ทั้งหมด 14 ชีต และตั้งชื่อให้ตรงตามนี้เป๊ะๆ
3.  ในแต่ละชีต ให้ตั้งชื่อคอลัมน์ใน **แถวที่ 1 (Row 1)** ดังนี้:

    *   **ชีตที่ 1: `Profile`** (A1-X1): `timestamp`, `username`, `displayName`, `profilePicture`, `gender`, `age`, `weight`, `height`, `waist`, `hip`, `activityLevel`, `role`, `xp`, `level`, `badges`, `email`, `password`, `healthCondition`, `lineUserId`, `receiveDailyReminders`, `researchId`, `pdpaAccepted`, `pdpaAcceptedDate`, **`organization`**
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

### ขั้นตอนที่ 3: เพิ่มโค้ดสคริปต์ (รองรับ Organization, PDPA, Leaderboard)

1.  ลบโค้ดที่มีอยู่ทั้งหมดในไฟล์ `Code.gs`
2.  คัดลอกโค้ด **ทั้งหมด** ด้านล่างนี้ไปวางแทนที่:
3.  **สำคัญ:** อย่าลืมใส่ Token ของคุณที่บรรทัดบนสุด
4.  กด **Save** และ **Deploy** > New Deployment > Type: Web app > Who has access: **Anyone**

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

const ADMIN_KEY = "ADMIN1234!";
// Token ที่คุณให้มา
const LINE_CHANNEL_ACCESS_TOKEN = "YxGdduOpLZ5IoVNONoPih8Z0n84f7tPK8D7MlFn866YI+XEuQfdI6QvUv6EDoOd8UIC+Iz6Gvfi6zKdiX6/74OKG08yFqlsoxGBlSbEEbByIpTGp+TcywcENUWSgGLggJnbTBAynTQ5r3VctmDUZ8wdB04t89/1O/w1cDnyilFU=";

// !!! ใส่ Link LIFF ของคุณที่นี่เพื่อให้ปุ่มใน Flex Message ทำงานสมบูรณ์ !!!
const APP_URL = "https://liff.line.me/2008705690-V5wrjpTX"; 

function doGet(e) {
  try {
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
    
    if (action === 'verifyUser') return handleVerifyUser(request.email, request.password);
    if (action === 'register') return handleRegisterUser(user, request.password);
    if (action === 'socialAuth') return handleSocialAuth(payload);
    if (action === 'getLeaderboard') return handleGetLeaderboard();
    
    if (!user || !user.username) throw new Error("User information is missing.");
    
    if (action === 'notifyComplete') return handleNotifyComplete(user);
    if (action === 'testNotification') return handleTestNotification(user);

    switch (action) {
      case 'save': return handleSave(type, payload, user);
      case 'clear': return handleClear(type, user);
      default: throw new Error("Invalid action specified.");
    }
  } catch (error) {
    return createErrorResponse(error);
  }
}

function handleGetLeaderboard() {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAMES.PROFILE);
    if (!sheet) return createErrorResponse({ message: "Profile sheet not found" });
    
    // Get all profiles (skip header)
    const data = sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).getValues();
    
    // Map to safe public data (only username, displayName, XP, level, badges, picture)
    // Avoid sensitive info like email, password, health conditions
    const users = data.map(row => {
        let badges = [];
        try { badges = JSON.parse(row[14]); } catch(e) {}
        
        return {
            username: row[1],
            displayName: row[2],
            profilePicture: row[3],
            role: row[11],
            xp: Number(row[12] || 0),
            level: Number(row[13] || 1),
            badges: badges,
            organization: row[23] || 'general' // Column X: Organization
        };
    });
    
    // Filter only role 'user', sort by XP desc, take top 50 (increased for better org stats)
    const topUsers = users
        .filter(u => u.role === 'user')
        .sort((a, b) => b.xp - a.xp)
        .slice(0, 50);
        
    return createSuccessResponse(topUsers);
}

// --- FLEX MESSAGE GENERATORS ---

function getDailyReminderFlex(displayName) {
  return {
    "type": "flex",
    "altText": "☀️ ถึงเวลาดูแลสุขภาพแล้วครับ " + displayName,
    "contents": {
      "type": "bubble",
      "hero": {
        "type": "image",
        "url": "https://images.unsplash.com/photo-1490645935967-10de6ba17061?q=80&w=800&auto=format&fit=crop", 
        "size": "full",
        "aspectRatio": "20:13",
        "aspectMode": "cover"
      },
      "body": {
        "type": "box",
        "layout": "vertical",
        "contents": [
          { "type": "text", "text": "อรุณสวัสดิ์ครับ! ☀️", "weight": "bold", "size": "xl" },
          { "type": "text", "text": "คุณ " + displayName, "weight": "bold", "size": "lg", "margin": "md", "color": "#14b8a6" },
          { "type": "text", "text": "เริ่มวันใหม่ด้วยการดูแลสุขภาพ 6 มิติ", "size": "sm", "color": "#aaaaaa", "wrap": true, "margin": "xs" },
          { "type": "separator", "margin": "md" },
          { "type": "box", "layout": "vertical", "margin": "md", "spacing": "sm", "contents": [
              { "type": "box", "layout": "baseline", "spacing": "sm", "contents": [
                  { "type": "text", "text": "💧", "flex": 1, "size": "md" },
                  { "type": "text", "text": "ดื่มน้ำให้เพียงพอ", "flex": 5, "size": "sm", "color": "#666666" }
                ]
              },
              { "type": "box", "layout": "baseline", "spacing": "sm", "contents": [
                  { "type": "text", "text": "🥗", "flex": 1, "size": "md" },
                  { "type": "text", "text": "เลือกทานอาหารดี", "flex": 5, "size": "sm", "color": "#666666" }
                ]
              },
              { "type": "box", "layout": "baseline", "spacing": "sm", "contents": [
                  { "type": "text", "text": "💪", "flex": 1, "size": "md" },
                  { "type": "text", "text": "ขยับร่างกายบ้าง", "flex": 5, "size": "sm", "color": "#666666" }
                ]
              }
            ]
          }
        ]
      },
      "footer": {
        "type": "box",
        "layout": "vertical",
        "spacing": "sm",
        "contents": [
          {
            "type": "button",
            "style": "primary",
            "height": "sm",
            "color": "#14b8a6",
            "action": { "type": "uri", "label": "เข้าสู่แอปพลิเคชัน", "uri": APP_URL }
          }
        ],
        "flex": 0
      }
    }
  };
}

function getMissionCompleteFlex(displayName) {
  return {
    "type": "flex",
    "altText": "🎉 ยินดีด้วยครับ! ภารกิจสำเร็จ",
    "contents": {
      "type": "bubble",
      "body": {
        "type": "box",
        "layout": "vertical",
        "contents": [
          { "type": "text", "text": "ภารกิจสำเร็จ! 🎉", "weight": "bold", "size": "xl", "color": "#Eab308", "align": "center" },
          { 
            "type": "image", 
            "url": "https://cdn-icons-png.flaticon.com/512/3112/3112946.png", 
            "size": "md", 
            "margin": "md" 
          },
          { "type": "text", "text": "ยอดเยี่ยมมากครับคุณ " + displayName, "weight": "bold", "size": "md", "align": "center", "margin": "md", "wrap": true },
          { "type": "text", "text": "คุณรักษาวินัยได้ดีเยี่ยม การดูแลตัวเองสม่ำเสมอคือหัวใจของสุขภาพที่ยั่งยืน", "size": "xs", "color": "#aaaaaa", "wrap": true, "align": "center", "margin": "sm" },
          { "type": "separator", "margin": "xl" },
          { "type": "text", "text": "พักผ่อนให้เพียงพอนะครับ 🌙", "size": "sm", "align": "center", "margin": "md", "color": "#666666" }
        ]
      },
      "footer": {
        "type": "box",
        "layout": "vertical",
        "contents": [
          {
            "type": "button",
            "style": "secondary",
            "color": "#Eab308",
            "action": { "type": "uri", "label": "ดูบันทึกของฉัน", "uri": APP_URL }
          }
        ]
      }
    }
  };
}

// --- Notification Logic ---

function handleTestNotification(user) {
    const profile = getLatestProfileForUser(user.username);
    if (profile && profile.lineUserId) {
        // Simple text message for test
        const msg = { type: 'text', text: '✅ ทดสอบการแจ้งเตือนสำเร็จ!\nระบบพร้อมส่งการแจ้งเตือนรายวันให้คุณแล้วครับ' };
        sendLinePush(profile.lineUserId, [msg]);
        return createSuccessResponse({ status: "Test notification sent" });
    }
    return createErrorResponse({ message: "LINE ID not found in profile" });
}

function handleNotifyComplete(user) {
    const profile = getLatestProfileForUser(user.username);
    if (profile && profile.lineUserId) {
        const flexMessage = getMissionCompleteFlex(user.displayName);
        sendLinePush(profile.lineUserId, [flexMessage]);
        return createSuccessResponse({ status: "Notification sent" });
    }
    return createErrorResponse({ message: "No LINE User ID found" });
}

// *** ฟังก์ชันนี้ต้องตั้ง Trigger ให้ทำงานทุกเช้า ***
function triggerDailyReminders() {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAMES.PROFILE);
    if (!sheet) return;
    
    const data = sheet.getDataRange().getValues();
    const lineUserIdIndex = 18; // Column S
    const nameIndex = 2; // Column C
    const receiveRemindersIndex = 19; // Column T
    
    const processedIds = new Set();

    for (let i = 1; i < data.length; i++) {
        const lineUserId = data[i][lineUserIdIndex];
        const displayName = data[i][nameIndex];
        const receiveReminders = data[i][receiveRemindersIndex];
        
        // เช็คว่า User เปิดรับการแจ้งเตือนหรือไม่ (ค่าว่างหรือ true ถือว่าเปิด)
        const isOptIn = String(receiveReminders).toLowerCase() !== 'false';

        if (lineUserId && isOptIn && !processedIds.has(lineUserId)) {
            try {
                const flexMessage = getDailyReminderFlex(displayName);
                sendLinePush(lineUserId, [flexMessage]);
                processedIds.add(lineUserId);
            } catch (e) {
                Logger.log("Failed to send to " + displayName);
            }
        }
    }
}

function sendLinePush(userId, messages) {
    if (!LINE_CHANNEL_ACCESS_TOKEN) return;

    const url = 'https://api.line.me/v2/bot/message/push';
    const payload = {
        to: userId,
        messages: messages 
    };

    const options = {
        method: 'post',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + LINE_CHANNEL_ACCESS_TOKEN
        },
        payload: JSON.stringify(payload),
        muteHttpExceptions: true
    };

    try {
        const res = UrlFetchApp.fetch(url, options);
        Logger.log("Response: " + res.getContentText());
    } catch (e) {
        Logger.log("Error sending LINE msg: " + e.message);
    }
}

// --- Existing Logic (Helper Functions) ---

function handleSocialAuth(userInfo) {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAMES.PROFILE);
    const data = sheet.getDataRange().getValues();
    const emailIndex = 15; 
    const lineUserIdIndex = 18; 
    
    for (let i = 1; i < data.length; i++) {
        if (data[i][emailIndex] === userInfo.email) {
             if (userInfo.userId && data[i][lineUserIdIndex] !== userInfo.userId) {
                 sheet.getRange(i + 1, lineUserIdIndex + 1).setValue(userInfo.userId);
             }
             const user = {
                 username: data[i][1],
                 displayName: data[i][2],
                 profilePicture: data[i][3] || userInfo.picture,
                 role: data[i][11] || 'user',
                 email: data[i][15],
                 authProvider: userInfo.provider || 'social'
             };
             return createSuccessResponse(user);
        }
    }

    const provider = userInfo.provider || 'social';
    const username = provider + '_' + new Date().getTime();
    
    const newRow = [
        new Date(), username, userInfo.name, userInfo.picture,
        '', '', '', '', '', '', '', 
        'user', 
        0, 1, '["novice"]', 
        userInfo.email,
        'social_login', 
        '', 
        userInfo.userId || '',
        true,
        '', '', '', 
        'general' // Default Organization
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
    const emailIndex = 15; 
    const usernameIndex = 1;

    for (let i = 1; i < data.length; i++) {
        if (data[i][usernameIndex] === user.username) return createErrorResponse({ message: "Username already exists" });
        if (user.email && data[i][emailIndex] === user.email) return createErrorResponse({ message: "Email already registered" });
    }
    
    const newRow = [
        new Date(), user.username, user.displayName, user.profilePicture,
        '', '', '', '', '', '', '', 
        user.role,
        0, 1, '["novice"]', 
        user.email || '',
        password || '', 
        '', 
        '',
        true,
        '', '', '',
        user.organization || 'general' // Register with Organization
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
      const existingProfile = getLatestProfileForUser(user.username);
      const existingLineId = existingProfile ? existingProfile.lineUserId : '';

      newRow = [ 
          ...commonPrefix, 
          payload.gender, payload.age, payload.weight, payload.height, payload.waist, payload.hip, payload.activityLevel, user.role,
          payload.xp || 0, payload.level || 1, badgesJson,
          user.email || '', '',
          payload.healthCondition || '',
          existingLineId,
          payload.receiveDailyReminders,
          payload.researchId || '', // Column U (20)
          payload.pdpaAccepted,     // Column V (21)
          payload.pdpaAcceptedDate,  // Column W (22)
          payload.organization || 'general' // Column X (23) - NEW
      ];
      break;
    case 'bmiHistory': newRow = [ ...commonPrefix, item.value, item.category ]; break;
    case 'tdeeHistory': newRow = [ ...commonPrefix, item.value, item.bmr ]; break;
    case 'foodHistory': newRow = [ ...commonPrefix, item.analysis.description, item.analysis.calories, JSON.stringify(item.analysis) ]; break;
    case 'plannerHistory': newRow = [ ...commonPrefix, item.cuisine, item.diet, item.tdee, JSON.stringify(item.plan) ]; break;
    case 'waterHistory': newRow = [ ...commonPrefix, item.amount ]; break;
    case 'calorieHistory': newRow = [ ...commonPrefix, item.name, item.calories ]; break;
    case 'activityHistory': newRow = [ ...commonPrefix, item.name, item.caloriesBurned ]; break;
    case 'sleepHistory': newRow = [ ...commonPrefix, item.bedTime, item.wakeTime, item.duration, item.quality, JSON.stringify(item.hygieneChecklist || []) ]; break;
    case 'moodHistory': newRow = [ ...commonPrefix, item.moodEmoji, item.stressLevel, item.gratitude ]; break;
    case 'habitHistory': newRow = [ ...commonPrefix, item.type, item.amount, item.isClean ]; break;
    case 'socialHistory': newRow = [ ...commonPrefix, item.interaction, item.feeling ]; break;
    case 'evaluationHistory': newRow = [ new Date(), user.username, user.displayName, user.role, JSON.stringify(item.satisfaction), JSON.stringify(item.outcomes) ]; break;
    case 'loginLog': newRow = [ new Date(), user.username, user.displayName, user.role ]; break;
    default: throw new Error(`Unknown data type for save: ${type}`);
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
      xp: lastEntry[12], level: lastEntry[13], badges: lastEntry[14], email: lastEntry[15], healthCondition: lastEntry[17], lineUserId: lastEntry[18],
      receiveDailyReminders: String(lastEntry[19]).toLowerCase() !== 'false',
      researchId: lastEntry[20], 
      pdpaAccepted: lastEntry[21],
      pdpaAcceptedDate: lastEntry[22],
      organization: lastEntry[23] || 'general' // NEW
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
    Logger.log("Error parsing history: " + e.message);
    return [];
  }
}

function getAllRowsAsObjects(sheetName) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  if (!sheet || sheet.getLastRow() < 2) return [];
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(h => h.trim());
  const dataRows = sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).getValues();
  return dataRows.map(row => headers.reduce((obj, header, index) => {
      if (header) obj[header] = row[index];
      return obj;
  }, {}));
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

function setupSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const schema = {
    "Profile": ["timestamp", "username", "displayName", "profilePicture", "gender", "age", "weight", "height", "waist", "hip", "activityLevel", "role", "xp", "level", "badges", "email", "password", "healthCondition", "lineUserId", "receiveDailyReminders", "researchId", "pdpaAccepted", "pdpaAcceptedDate", "organization"],
    "BMIHistory": ["timestamp", "username", "displayName", "profilePicture", "bmi", "category"],
    "TDEEHistory": ["timestamp", "username", "displayName", "profilePicture", "tdee", "bmr"],
    "FoodHistory": ["timestamp", "username", "displayName", "profilePicture", "description", "calories", "analysis_json"],
    "PlannerHistory": ["timestamp", "username", "displayName", "profilePicture", "cuisine", "diet", "tdee_goal", "plan_json"],
    "LoginLogs": ["timestamp", "username", "displayName", "role"],
    "WaterHistory": ["timestamp", "username", "displayName", "profilePicture", "amount"],
    "CalorieHistory": ["timestamp", "username", "displayName", "profilePicture", "name", "calories"],
    "ActivityHistory": ["timestamp", "username", "displayName", "profilePicture", "name", "caloriesBurned"],
    "SleepHistory": ["timestamp", "username", "displayName", "profilePicture", "bedTime", "wakeTime", "duration", "quality", "hygieneChecklist"],
    "MoodHistory": ["timestamp", "username", "displayName", "profilePicture", "emoji", "stressLevel", "gratitude"],
    "HabitHistory": ["timestamp", "username", "displayName", "profilePicture", "type", "amount", "isClean"],
    "SocialHistory": ["timestamp", "username", "displayName", "profilePicture", "interaction", "feeling"],
    "EvaluationHistory": ["timestamp", "username", "displayName", "role", "satisfaction_json", "outcome_json"]
  };

  for (const [sheetName, columns] of Object.entries(schema)) {
    let sheet = ss.getSheetByName(sheetName);
    if (!sheet) { sheet = ss.insertSheet(sheetName); }
    const headerRange = sheet.getRange(1, 1, 1, columns.length);
    headerRange.setValues([columns]);
    headerRange.setFontWeight("bold");
    headerRange.setHorizontalAlignment("center");
    sheet.setFrozenRows(1);
  }
}
// --- END OF Code.gs ---
