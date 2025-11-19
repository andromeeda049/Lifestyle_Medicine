# การเชื่อมต่อศูนย์โภชนาการอัจฉริยะกับ Google Sheets (เวอร์ชันสมบูรณ์)

คู่มือนี้จะแนะนำวิธีการใช้ Google Sheets เป็นฐานข้อมูลส่วนตัวสำหรับแอปพลิเคชัน เพื่อบันทึกและซิงค์ข้อมูลสุขภาพทั้งหมดของคุณ

## ขั้นตอนการตั้งค่า

โปรดทำตามขั้นตอนต่อไปนี้อย่างละเอียด:

### ขั้นตอนที่ 1: ปรับโครงสร้าง Google Sheet

1.  ไปที่ [sheets.new](https://sheets.new) เพื่อสร้าง Google Sheet ใหม่ และตั้งชื่อไฟล์ตามที่คุณต้องการ
2.  ลบชีตเริ่มต้น (`Sheet1`) หรือเปลี่ยนชื่อเป็น `Profile`
3.  **สร้างชีตย่อย (Tabs)** ที่ด้านล่างและตั้งชื่อให้ตรงตามนี้ **(สำคัญมาก: ชื่อต้องตรงทุกตัวอักษร)**
4.  ในแต่ละชีต ให้ตั้งชื่อคอลัมน์ในแถวแรก (Row 1) ให้ตรงตามนี้ทุกประการ:

    *   **ชีตที่ 1: `Profile`** (A1-L1): `timestamp`, `username`, `displayName`, `profilePicture`, `gender`, `age`, `weight`, `height`, `waist`, `hip`, `activityLevel`, `role`
    *   **ชีตที่ 2: `BMIHistory`** (A1-F1): `timestamp`, `username`, `displayName`, `profilePicture`, `bmi`, `category`
    *   **ชีตที่ 3: `TDEEHistory`** (A1-F1): `timestamp`, `username`, `displayName`, `profilePicture`, `tdee`, `bmr`
    *   **ชีตที่ 4: `FoodHistory`** (A1-G1): `timestamp`, `username`, `displayName`, `profilePicture`, `description`, `calories`, `analysis_json`
    *   **ชีตที่ 5: `PlannerHistory`** (A1-H1): `timestamp`, `username`, `displayName`, `profilePicture`, `cuisine`, `diet`, `tdee_goal`, `plan_json`
    *   **ชีตที่ 6: `LoginLogs`** (A1-D1): `timestamp`, `username`, `displayName`, `role`
    *   **ชีตที่ 7: `WaterHistory`** (A1-E1): `timestamp`, `username`, `displayName`, `profilePicture`, `amount`
    *   **ชีตที่ 8: `CalorieHistory` (ใหม่!)** (A1-F1): `timestamp`, `username`, `displayName`, `profilePicture`, `name`, `calories`
    *   **ชีตที่ 9: `ActivityHistory` (ใหม่!)** (A1-F1): `timestamp`, `username`, `displayName`, `profilePicture`, `name`, `caloriesBurned`


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
  LOGIN_LOGS: "LoginLogs"
};

// !!! สำคัญ: ตั้งค่า Admin Key ของคุณที่นี่ !!!
const ADMIN_KEY = "ADMIN1234!";

function doGet(e) {
  try {
    if (e.parameter.action === 'getAllData' && e.parameter.adminKey === ADMIN_KEY) {
       const allData = {
          profiles: getAllRowsAsObjects(SHEET_NAMES.PROFILE),
          bmiHistory: getAllRowsAsObjects(SHEET_NAMES.BMI),
          tdeeHistory: getAllRowsAsObjects(SHEET_NAMES.TDEE),
          foodHistory: getAllRowsAsObjects(SHEET_NAMES.FOOD),
          plannerHistory: getAllRowsAsObjects(SHEET_NAMES.PLANNER),
          waterHistory: getAllRowsAsObjects(SHEET_NAMES.WATER),
          calorieHistory: getAllRowsAsObjects(SHEET_NAMES.CALORIE),
          activityHistory: getAllRowsAsObjects(SHEET_NAMES.ACTIVITY),
          loginLogs: getAllRowsAsObjects(SHEET_NAMES.LOGIN_LOGS)
       };
       return createSuccessResponse(allData);
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
    
    if (!user || !user.username) throw new Error("User information is missing.");
    if (user.role === 'admin' && type !== 'profile' && type !== 'loginLog') {
        return createSuccessResponse({ status: "Admin history-saving action ignored."});
    }

    switch (action) {
      case 'save': return handleSave(type, payload, user);
      case 'clear': return handleClear(type, user);
      default: throw new Error("Invalid action specified.");
    }
  } catch (error) {
    return createErrorResponse(error);
  }
}

function handleSave(type, payload, user) {
  const sheetNameMap = {
    profile: SHEET_NAMES.PROFILE, bmiHistory: SHEET_NAMES.BMI, tdeeHistory: SHEET_NAMES.TDEE,
    foodHistory: SHEET_NAMES.FOOD, plannerHistory: SHEET_NAMES.PLANNER, waterHistory: SHEET_NAMES.WATER,
    calorieHistory: SHEET_NAMES.CALORIE, activityHistory: SHEET_NAMES.ACTIVITY, loginLog: SHEET_NAMES.LOGIN_LOGS
  };
  
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetNameMap[type]);
  if (!sheet) throw new Error(`Sheet not found for type: ${type}`);
  
  let newRow;
  const lastItem = Array.isArray(payload) ? payload[0] : null;

  switch (type) {
    case 'profile':
      newRow = [ new Date(), user.username, user.displayName, user.profilePicture, payload.gender, payload.age, payload.weight, payload.height, payload.waist, payload.hip, payload.activityLevel, user.role ];
      break;
    case 'bmiHistory':
      if (!lastItem) return createSuccessResponse({ status: "No new BMI data."});
      newRow = [ new Date(), user.username, user.displayName, user.profilePicture, lastItem.value, lastItem.category ];
      break;
    case 'tdeeHistory':
      if (!lastItem) return createSuccessResponse({ status: "No new TDEE data."});
      newRow = [ new Date(), user.username, user.displayName, user.profilePicture, lastItem.value, lastItem.bmr ];
      break;
    case 'foodHistory':
      if (!lastItem) return createSuccessResponse({ status: "No new Food data."});
      newRow = [ new Date(), user.username, user.displayName, user.profilePicture, lastItem.analysis.description, lastItem.analysis.calories, JSON.stringify(lastItem.analysis) ];
      break;
    case 'plannerHistory':
       if (!lastItem) return createSuccessResponse({ status: "No new Planner data."});
       newRow = [ new Date(), user.username, user.displayName, user.profilePicture, lastItem.cuisine, lastItem.diet, lastItem.tdee, JSON.stringify(lastItem.plan) ];
       break;
    case 'waterHistory':
       if (!lastItem) return createSuccessResponse({ status: "No new Water data."});
       newRow = [ new Date(), user.username, user.displayName, user.profilePicture, lastItem.amount ];
       break;
    case 'calorieHistory':
        if (!lastItem) return createSuccessResponse({ status: "No new Calorie data." });
        newRow = [ new Date(), user.username, user.displayName, user.profilePicture, lastItem.name, lastItem.calories ];
        break;
    case 'activityHistory':
        if (!lastItem) return createSuccessResponse({ status: "No new Activity data." });
        newRow = [ new Date(), user.username, user.displayName, user.profilePicture, lastItem.name, lastItem.caloriesBurned ];
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
  return { gender: lastEntry[4], age: lastEntry[5], weight: lastEntry[6], height: lastEntry[7], waist: lastEntry[8], hip: lastEntry[9], activityLevel: lastEntry[10] };
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
  return ContentService.createTextOutput(JSON.stringify({ status: "error", message: error.message }))
    .setMimeType(ContentService.MimeType.JSON);
}

// --- END OF Code.gs ---
```

3.  กดที่ไอคอนรูปแผ่นดิสก์ (💾) เพื่อ **บันทึกโปรเจกต์**

### ขั้นตอนที่ 4: ทำให้สคริปต์ใช้งานได้อีกครั้ง (สำคัญมาก!)

1.  ที่มุมบนขวาของหน้าจอ กดปุ่มสีน้ำเงิน `ทำให้ใช้งานได้ (Deploy)` > `การทำให้ใช้งานได้รายการใหม่ (New deployment)`
2.  คลิกไอคอนฟันเฟือง (⚙️) และเลือกประเภทเป็น `เว็บแอป (Web app)`
3.  ตั้งค่า "ผู้ที่เข้าถึงได้" เป็น **`ทุกคน (Anyone)`**
4.  กดปุ่ม `ทำให้ใช้งานได้ (Deploy)`
5.  **ให้สิทธิ์การเข้าถึง (Authorize access)** ตามขั้นตอน
6.  คัดลอก **URL ของเว็บแอป** อันใหม่ และนำไปวางในช่องตั้งค่าในแอปพลิเคชัน

**เรียบร้อย!** ตอนนี้แอปของคุณรองรับฟีเจอร์ใหม่ทั้งหมดแล้ว