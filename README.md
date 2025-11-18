# การเชื่อมต่อศูนย์โภชนาการอัจฉริยะกับ Google Sheets (เวอร์ชันสมบูรณ์)

คู่มือนี้จะแนะนำวิธีการใช้ Google Sheets เป็นฐานข้อมูลส่วนตัวสำหรับแอปพลิเคชัน เพื่อบันทึกและซิงค์ข้อมูลสุขภาพทั้งหมดของคุณ (ข้อมูลส่วนตัว, ประวัติ BMI, TDEE, อาหาร, แผนโภชนาการ และการดื่มน้ำ)

## ขั้นตอนการตั้งค่า

โปรดทำตามขั้นตอนต่อไปนี้อย่างละเอียด:

### ขั้นตอนที่ 1: ปรับโครงสร้าง Google Sheet

1.  ไปที่ [sheets.new](https://sheets.new) เพื่อสร้าง Google Sheet ใหม่ และตั้งชื่อไฟล์ตามที่คุณต้องการ
2.  ลบชีตเริ่มต้น (`Sheet1`) หรือเปลี่ยนชื่อเป็น `Profile`
3.  **สร้างชีตย่อย (Tabs)** ที่ด้านล่างและตั้งชื่อให้ตรงตามนี้ **(สำคัญมาก: ชื่อต้องตรงทุกตัวอักษร)**
4.  ในแต่ละชีต ให้ตั้งชื่อคอลัมน์ในแถวแรก (Row 1) ให้ตรงตามนี้ทุกประการ:

    *   **ชีตที่ 1: `Profile`**
        *   `A1`: `timestamp`
        *   `B1`: `username`
        *   `C1`: `displayName`
        *   `D1`: `profilePicture`
        *   `E1`: `gender`
        *   `F1`: `age`
        *   `G1`: `weight`
        *   `H1`: `height`
        *   `I1`: `waist`
        *   `J1`: `hip`
        *   `K1`: `activityLevel`
        *   `L1`: `role`

    *   **ชีตที่ 2: `BMIHistory`**
        *   `A1`: `timestamp`
        *   `B1`: `username`
        *   `C1`: `displayName`
        *   `D1`: `profilePicture`
        *   `E1`: `bmi`
        *   `F1`: `category`

    *   **ชีตที่ 3: `TDEEHistory`**
        *   `A1`: `timestamp`
        *   `B1`: `username`
        *   `C1`: `displayName`
        *   `D1`: `profilePicture`
        *   `E1`: `tdee`
        *   `F1`: `bmr`

    *   **ชีตที่ 4: `FoodHistory`**
        *   `A1`: `timestamp`
        *   `B1`: `username`
        *   `C1`: `displayName`
        *   `D1`: `profilePicture`
        *   `E1`: `description`
        *   `F1`: `calories`
        *   `G1`: `analysis_json`

    *   **ชีตที่ 5: `PlannerHistory`**
        *   `A1`: `timestamp`
        *   `B1`: `username`
        *   `C1`: `displayName`
        *   `D1`: `profilePicture`
        *   `E1`: `cuisine`
        *   `F1`: `diet`
        *   `G1`: `tdee_goal`
        *   `H1`: `plan_json`
    
    *   **ชีตที่ 6: `LoginLogs`**
        *   `A1`: `timestamp`
        *   `B1`: `username`
        *   `C1`: `displayName`
        *   `D1`: `role`
        
    *   **ชีตที่ 7: `WaterHistory`**  **(ใหม่!)**
        *   `A1`: `timestamp`
        *   `B1`: `username`
        *   `C1`: `displayName`
        *   `D1`: `profilePicture`
        *   `E1`: `amount`

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
  LOGIN_LOGS: "LoginLogs"
};

// !!! สำคัญ: ตั้งค่า Admin Key ของคุณที่นี่ !!!
// นี่คือรหัสผ่านสำหรับเข้าสู่โหมดผู้ดูแลระบบในแอป
const ADMIN_KEY = "ADMIN1234!";

function doGet(e) {
  try {
    // --- Admin Path: ดึงข้อมูลทั้งหมดสำหรับหน้า Dashboard ของ Admin ---
    if (e.parameter.action === 'getAllData' && e.parameter.adminKey === ADMIN_KEY) {
       const allData = {
          profiles: getAllRowsAsObjects(SHEET_NAMES.PROFILE),
          bmiHistory: getAllRowsAsObjects(SHEET_NAMES.BMI),
          tdeeHistory: getAllRowsAsObjects(SHEET_NAMES.TDEE),
          foodHistory: getAllRowsAsObjects(SHEET_NAMES.FOOD),
          plannerHistory: getAllRowsAsObjects(SHEET_NAMES.PLANNER),
          waterHistory: getAllRowsAsObjects(SHEET_NAMES.WATER),
          loginLogs: getAllRowsAsObjects(SHEET_NAMES.LOGIN_LOGS)
       };
       return createSuccessResponse(allData);
    }

    // --- User Path: ดึงข้อมูลเฉพาะของผู้ใช้ที่ล็อกอิน ---
    const username = e.parameter.username;
    if (!username) {
      throw new Error("Username parameter is required.");
    }

    const profile = getLatestProfileForUser(username);
    const bmiHistory = getAllHistoryForUser(SHEET_NAMES.BMI, username);
    const tdeeHistory = getAllHistoryForUser(SHEET_NAMES.TDEE, username);
    const foodHistory = getAllHistoryForUser(SHEET_NAMES.FOOD, username);
    const plannerHistory = getAllHistoryForUser(SHEET_NAMES.PLANNER, username);
    const waterHistory = getAllHistoryForUser(SHEET_NAMES.WATER, username);

    const userData = {
      profile: profile,
      bmiHistory: bmiHistory,
      tdeeHistory: tdeeHistory,
      foodHistory: foodHistory,
      plannerHistory: plannerHistory,
      waterHistory: waterHistory
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
    
    if (!user || !user.username) {
        throw new Error("User information is missing.");
    }
    // Admin ไม่ควรบันทึกข้อมูลประวัติ (ยกเว้น login log)
    if (user.role === 'admin' && type !== 'profile' && type !== 'loginLog') {
        return createSuccessResponse({ status: "Admin history-saving action ignored."});
    }

    switch (action) {
      case 'save':
        return handleSave(type, payload, user);
      case 'clear':
        return handleClear(type, user);
      default:
        throw new Error("Invalid action specified.");
    }
  } catch (error) {
    return createErrorResponse(error);
  }
}

// --- Handler Functions ---

function handleSave(type, payload, user) {
  if (!payload) throw new Error("Payload is missing for save action.");

  const sheetNameMap = {
    profile: SHEET_NAMES.PROFILE,
    bmiHistory: SHEET_NAMES.BMI,
    tdeeHistory: SHEET_NAMES.TDEE,
    foodHistory: SHEET_NAMES.FOOD,
    plannerHistory: SHEET_NAMES.PLANNER,
    waterHistory: SHEET_NAMES.WATER,
    loginLog: SHEET_NAMES.LOGIN_LOGS
  };
  
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetNameMap[type]);
  if (!sheet) throw new Error(`Sheet not found for type: ${type}`);
  
  let newRow;

  switch (type) {
    case 'profile':
      newRow = [ 
        new Date(), user.username, user.displayName, user.profilePicture, 
        payload.gender, payload.age, payload.weight, payload.height, payload.waist, payload.hip, payload.activityLevel,
        user.role
      ];
      break;
    case 'bmiHistory':
      const lastBmi = payload[0];
      if (!lastBmi) return createSuccessResponse({ status: "No new BMI data to save."});
      newRow = [ 
        new Date(), user.username, user.displayName, user.profilePicture,
        lastBmi.value, lastBmi.category 
      ];
      break;
    case 'tdeeHistory':
      const lastTdee = payload[0];
      if (!lastTdee) return createSuccessResponse({ status: "No new TDEE data to save."});
      newRow = [ 
        new Date(), user.username, user.displayName, user.profilePicture,
        lastTdee.value, lastTdee.bmr 
      ];
      break;
    case 'foodHistory':
      const lastFood = payload[0];
      if (!lastFood) return createSuccessResponse({ status: "No new Food data to save."});
      newRow = [ 
        new Date(), user.username, user.displayName, user.profilePicture,
        lastFood.analysis.description, lastFood.analysis.calories, JSON.stringify(lastFood.analysis) 
      ];
      break;
    case 'plannerHistory':
       const lastPlan = payload[0];
       if (!lastPlan) return createSuccessResponse({ status: "No new Planner data to save."});
       newRow = [ 
         new Date(), user.username, user.displayName, user.profilePicture,
         lastPlan.cuisine, lastPlan.diet, lastPlan.tdee, JSON.stringify(lastPlan.plan) 
       ];
       break;
    case 'waterHistory':
       const lastWater = payload[0];
       if (!lastWater) return createSuccessResponse({ status: "No new Water data to save."});
       newRow = [ 
         new Date(), user.username, user.displayName, user.profilePicture,
         lastWater.amount
       ];
       break;
    case 'loginLog':
       newRow = [
         new Date(), user.username, user.displayName, user.role
       ];
       break;
    default:
      throw new Error(`Unknown data type for save: ${type}`);
  }
  
  sheet.appendRow(newRow);
  
  return createSuccessResponse({ status: `${type} saved successfully.` });
}


function handleClear(type, user) {
  const sheetNameMap = {
    bmiHistory: SHEET_NAMES.BMI,
    tdeeHistory: SHEET_NAMES.TDEE,
    foodHistory: SHEET_NAMES.FOOD,
    waterHistory: SHEET_NAMES.WATER,
  };
  const sheetName = sheetNameMap[type];
  if (!sheetName) throw new Error(`Unknown data type for clear: ${type}`);
  
  clearSheetForUser(sheetName, user.username);
  return createSuccessResponse({ status: `${type} cleared successfully.` });
}


// --- Data Fetching Functions ---

function getLatestProfileForUser(username) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAMES.PROFILE);
  if (!sheet || sheet.getLastRow() < 2) return null;

  const allData = sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).getValues();
  const userData = allData.filter(row => row[1] === username); 
  if (userData.length === 0) return null;

  const lastEntry = userData[userData.length - 1];
  
  return {
    gender: lastEntry[4], age: lastEntry[5], weight: lastEntry[6], height: lastEntry[7],
    waist: lastEntry[8], hip: lastEntry[9], activityLevel: lastEntry[10]
  };
}

function getAllHistoryForUser(sheetName, username) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  if (!sheet || sheet.getLastRow() < 2) return [];
  
  const allData = sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).getValues();
  const userData = allData.filter(row => row[1] === username);

  try {
    if (sheetName === SHEET_NAMES.BMI) {
      return userData.map(row => ({ date: row[0], value: row[4], category: row[5] }));
    }
    if (sheetName === SHEET_NAMES.TDEE) {
      return userData.map(row => ({ date: row[0], value: row[4], bmr: row[5] }));
    }
    if (sheetName === SHEET_NAMES.FOOD) {
      return userData.map(row => ({ date: row[0], id: new Date(row[0]).toISOString(), analysis: JSON.parse(row[6]) }));
    }
    if (sheetName === SHEET_NAMES.PLANNER) {
       return userData.map(row => ({ date: row[0], id: new Date(row[0]).toISOString(), cuisine: row[4], diet: row[5], tdee: row[6], plan: JSON.parse(row[7]) }));
    }
    if (sheetName === SHEET_NAMES.WATER) {
       return userData.map(row => ({ date: row[0], id: new Date(row[0]).toISOString(), amount: row[4] }));
    }
  } catch(e) {
    Logger.log("Error parsing history data for user " + username + " in sheet: " + sheetName + ". Error: " + e.message);
    return [];
  }
  return [];
}

function getAllRowsAsObjects(sheetName) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  if (!sheet || sheet.getLastRow() < 2) {
    return [];
  }
  
  try {
    const lastCol = sheet.getLastColumn();
    const values = sheet.getRange(1, 1, sheet.getLastRow(), lastCol).getValues();
    
    const headers = values[0].map(header => typeof header === 'string' ? header.trim() : '');
    
    const dataRows = values.slice(1);
    
    const objects = dataRows.map(row => {
      const obj = {};
      headers.forEach((header, index) => {
        if (header && index < row.length) {
          obj[header] = row[index];
        }
      });
      return obj;
    });
    
    return objects;
  } catch (e) {
    Logger.log("Error in getAllRowsAsObjects for sheet '" + sheetName + "': " + e.message);
    return [];
  }
}


// --- Utility Functions ---

function clearSheetForUser(sheetName, username) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  if (!sheet || sheet.getLastRow() < 2) return;
  
  const data = sheet.getRange(1, 1, sheet.getLastRow(), sheet.getLastColumn()).getValues();
  const rowsToDelete = [];
  
  for (let i = data.length - 1; i >= 1; i--) { // Iterate backwards
    if (data[i][1] === username) {
      rowsToDelete.push(i + 1);
    }
  }
  
  rowsToDelete.forEach(rowIndex => {
      sheet.deleteRow(rowIndex);
  });
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

เนื่องจากเราได้เปลี่ยนแปลงโค้ดและโครงสร้างข้อมูลครั้งใหญ่ คุณจำเป็นต้อง **Deploy ใหม่** เพื่อให้การเปลี่ยนแปลงมีผล

1.  ที่มุมบนขวาของหน้าจอ กดปุ่มสีน้ำเงิน `ทำให้ใช้งานได้ (Deploy)` > `การทำให้ใช้งานได้รายการใหม่ (New deployment)`
2.  คลิกไอคอนฟันเฟือง (⚙️) ข้าง "เลือกประเภท" และเลือกประเภทเป็น `เว็บแอป (Web app)`
3.  ตั้งค่า "ผู้ที่เข้าถึงได้" เป็น **`ทุกคน (Anyone)`** (สำคัญมาก!)
4.  กดปุ่ม `ทำให้ใช้งานได้ (Deploy)`
5.  **ให้สิทธิ์การเข้าถึง (Authorize access)** ตามขั้นตอนที่ปรากฏขึ้นอีกครั้ง
6.  คัดลอก **URL ของเว็บแอป** อันใหม่ที่ได้รับมา และนำไปวางในช่องตั้งค่าในแอปพลิเคชัน

**เรียบร้อย!** ตอนนี้แอปพลิเคชันของคุณได้เชื่อมต่อกับ Google Sheets เวอร์ชันสมบูรณ์พร้อมระบบ Admin และระบบบันทึกการเข้าใช้งานแล้ว