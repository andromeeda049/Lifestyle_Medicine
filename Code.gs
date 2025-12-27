
/**
 * Smart Lifestyle Wellness - Backend Script (v6.0 Direct Index Access)
 * - Reads Profile sheet directly using array indexes
 * - Bypasses headers and QUERY formulas entirely for maximum reliability
 */

const SHEET_NAMES = {
  PROFILE: "Profile",
  USERS: "Users",
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
  EVALUATION: "EvaluationHistory",
  LEADERBOARD_VIEW: "LeaderboardView", // Legacy (Not used in this version)
  TRENDING_VIEW: "TrendingView" // Legacy (Not used in this version)
};

const ADMIN_KEY = "ADMIN1234!";
const LINE_CHANNEL_ACCESS_TOKEN = "YxGdduOpLZ5IoVNONoPih8Z0n84f7tPK8D7MlFn866YI+XEuQfdI6QvUv6EDoOd8UIC+Iz6Gvfi6zKdiX6/74OKG08yFqlsoxGBlSbEEbByIpTGp+TcywcENUWSgGLggJnbTBAynTQ5r3VctmDUZ8wdB04t89/1O/w1cDnyilFU=";

// --- CORE HANDLERS ---

function doGet(e) {
  try {
    if (e.parameter.action === 'getAllData' && e.parameter.adminKey === ADMIN_KEY) {
       return handleAdminFetch();
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
      evaluationHistory: getAllHistoryForUser(SHEET_NAMES.EVALUATION, username),
      quizHistory: getAllHistoryForUser('QuizHistory', username)
    };
    return createSuccessResponse(userData);
  } catch (error) {
    return createErrorResponse(error);
  }
}

function doPost(e) {
  try {
    const request = JSON.parse(e.postData.contents);
    const { action, type, payload, user, password } = request;
    
    // Auth Actions
    if (action === 'verifyUser') return handleVerifyUser(request.email, password);
    if (action === 'register') return handleRegisterUser(user, password);
    if (action === 'socialAuth') return handleSocialAuth(payload);

    if (!user || !user.username) throw new Error("User information is missing.");
    
    // Notification Actions
    if (action === 'notifyComplete') return handleNotifyComplete(user);
    if (action === 'testNotification') return handleTestNotification(user);
    if (action === 'testTelegramNotification') return createSuccessResponse({ message: "Telegram Test OK" });

    // Data Actions
    switch (action) {
      case 'save': return handleSave(type, payload, user);
      case 'clear': return handleClear(type, user);
      case 'getLeaderboard': return handleGetLeaderboard();
      default: throw new Error("Invalid action specified.");
    }
  } catch (error) {
    return createErrorResponse(error);
  }
}

// --- DATA HANDLERS ---

function handleGetLeaderboard() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAMES.PROFILE);
  
  if (!sheet || sheet.getLastRow() < 2) {
    return createSuccessResponse({ leaderboard: [], trending: [] });
  }

  // Read all raw data from Profile sheet
  // We use direct index access based on setupSheets structure:
  // Col B (Index 1): username
  // Col C (Index 2): displayName
  // Col D (Index 3): profilePicture
  // Col L (Index 11): role
  // Col M (Index 12): xp
  // Col N (Index 13): level
  // Col X (Index 23): organization
  // Col Y (Index 24): deltaXp
  
  const rawData = sheet.getRange(2, 1, sheet.getLastRow() - 1, 25).getValues();
  
  // Use a Map to get the latest entry for each user (in case of duplicates)
  const userMap = new Map();

  rawData.forEach(row => {
    const username = row[1];
    if (!username) return;

    // Only process users, ignore admins/guests if needed
    const role = String(row[11] || '').toLowerCase();
    if (role !== 'user') return;

    // Since we read from top to bottom, and appendRow adds to bottom,
    // later rows will overwrite earlier rows in the Map, ensuring latest data.
    userMap.set(username, {
      username: row[1],
      displayName: row[2],
      profilePicture: row[3],
      xp: Number(row[12] || 0),
      level: Number(row[13] || 1),
      organization: row[23] || 'general',
      deltaXp: Number(row[24] || 0)
    });
  });

  const allUsers = Array.from(userMap.values());

  // 1. Leaderboard: Sort by XP Descending
  const leaderboard = [...allUsers]
    .sort((a, b) => b.xp - a.xp)
    .slice(0, 100); // Limit to top 100

  // 2. Trending: Sort by Weekly XP (deltaXp) Descending, Filter > 0
  const trending = [...allUsers]
    .filter(u => u.deltaXp > 0)
    .sort((a, b) => b.deltaXp - a.deltaXp)
    .slice(0, 50);

  return createSuccessResponse({
    leaderboard: leaderboard,
    trending: trending
  });
}

function getXpForUser(username) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(SHEET_NAMES.PROFILE);
    if (!sheet || sheet.getLastRow() < 2) return 0;
    
    const data = sheet.getDataRange().getValues();
    for (let i = data.length - 1; i >= 1; i--) {
        if (data[i][1] === username) {
            return Number(data[i][12] || 0); 
        }
    }
    return 0;
}

function handleSave(type, payload, user) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  let sheetName = "";
  if (type === 'profile') sheetName = SHEET_NAMES.PROFILE;
  else if (type === 'loginLog') sheetName = SHEET_NAMES.LOGIN_LOGS; 
  else if (Object.values(SHEET_NAMES).includes(type)) sheetName = type;
  else {
      const key = Object.keys(SHEET_NAMES).find(k => k.toLowerCase() === type.toLowerCase().replace('history',''));
      if (key) sheetName = SHEET_NAMES[key];
      else sheetName = type.charAt(0).toUpperCase() + type.slice(1);
  }

  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) sheet = ss.insertSheet(sheetName);

  const timestamp = new Date();
  let newRow = [];
  const item = Array.isArray(payload) ? payload[0] : payload;
  const commonPrefix = [timestamp, user.username, user.displayName, user.profilePicture];

  switch (sheetName) {
    case SHEET_NAMES.PROFILE:
      const currentXP = getXpForUser(user.username);
      const newXP = Number(item.xp || 0);
      const deltaXp = Math.max(0, newXP - currentXP); 

      const badgesJson = JSON.stringify(item.badges || []);
      const updatedOrg = item.organization || user.organization || 'general';

      newRow = [ 
          timestamp, user.username, item.displayName || user.displayName, item.profilePicture || user.profilePicture,
          item.gender, item.age, item.weight, item.height, item.waist, item.hip, item.activityLevel, 
          user.role, 
          newXP, item.level || 1, badgesJson,
          item.email || user.email || '', '', 
          item.healthCondition || '',
          item.lineUserId || '',
          item.receiveDailyReminders,
          item.researchId || '', 
          item.pdpaAccepted,     
          item.pdpaAcceptedDate,  
          updatedOrg, // Save organization
          deltaXp 
      ];

      const userWithNewOrg = { 
          ...user, 
          displayName: item.displayName || user.displayName,
          profilePicture: item.profilePicture || user.profilePicture,
          organization: updatedOrg 
      };
      logLogin(userWithNewOrg);
      break;

    case SHEET_NAMES.LOGIN_LOGS:
        newRow = [timestamp, user.username, user.displayName, user.role, user.organization || 'general'];
        break;
    case SHEET_NAMES.BMI: newRow = [...commonPrefix, item.value, item.category]; break;
    case SHEET_NAMES.TDEE: newRow = [...commonPrefix, item.value, item.bmr]; break;
    case SHEET_NAMES.FOOD: newRow = [...commonPrefix, item.analysis.description, item.analysis.calories, JSON.stringify(item.analysis)]; break;
    case SHEET_NAMES.WATER: newRow = [...commonPrefix, item.amount]; break;
    case SHEET_NAMES.CALORIE: newRow = [...commonPrefix, item.name, item.calories]; break;
    case SHEET_NAMES.ACTIVITY: newRow = [...commonPrefix, item.name, item.caloriesBurned]; break;
    case SHEET_NAMES.SLEEP: newRow = [...commonPrefix, item.bedTime, item.wakeTime, item.duration, item.quality, JSON.stringify(item.hygieneChecklist)]; break;
    case SHEET_NAMES.MOOD: newRow = [...commonPrefix, item.moodEmoji, item.stressLevel, item.gratitude]; break;
    case SHEET_NAMES.HABIT: newRow = [...commonPrefix, item.type, item.amount, item.isClean]; break;
    case SHEET_NAMES.SOCIAL: newRow = [...commonPrefix, item.interaction, item.feeling]; break;
    case SHEET_NAMES.PLANNER: newRow = [...commonPrefix, item.cuisine, item.diet, item.tdee, JSON.stringify(item.plan)]; break;
    case SHEET_NAMES.EVALUATION: newRow = [timestamp, user.username, user.displayName, user.role, JSON.stringify(item.satisfaction), JSON.stringify(item.outcomes)]; break;
    default:
        newRow = [timestamp, user.username, JSON.stringify(item)];
  }

  sheet.appendRow(newRow);
  return createSuccessResponse({ status: "Saved" });
}

function handleClear(type, user) {
  let sheetName = type;
  if (Object.values(SHEET_NAMES).includes(type)) sheetName = type;
  else sheetName = type.charAt(0).toUpperCase() + type.slice(1);

  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  if (!sheet) return createSuccessResponse({ status: "Sheet not found" });

  const data = sheet.getRange(1, 1, sheet.getLastRow(), sheet.getLastColumn()).getValues();
  const rowsToDelete = [];
  
  for (let i = 1; i < data.length; i++) {
      if (data[i][1] === user.username) {
          rowsToDelete.push(i + 1);
      }
  }
  
  for (let i = rowsToDelete.length - 1; i >= 0; i--) {
      sheet.deleteRow(rowsToDelete[i]);
  }
  
  return createSuccessResponse({ status: "Cleared" });
}

function handleSocialAuth(userInfo) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(SHEET_NAMES.USERS);
    if (!sheet) sheet = ss.insertSheet(SHEET_NAMES.USERS);

    const data = sheet.getDataRange().getValues();
    let foundRowIndex = -1;
    let userData = null;

    for (let i = 1; i < data.length; i++) {
        const row = data[i];
        let json = {};
        try { json = JSON.parse(row[3]); } catch(e) {}

        if (row[0] === userInfo.email || json.userId === userInfo.userId) {
            foundRowIndex = i + 1;
            userData = json;
            break;
        }
    }

    if (userData) {
        if (userInfo.picture && userData.profilePicture !== userInfo.picture) {
            userData.profilePicture = userInfo.picture;
            sheet.getRange(foundRowIndex, 4).setValue(JSON.stringify(userData));
        }
        logLogin(userData);
        return createSuccessResponse(userData);
    } else {
        const username = (userInfo.provider || 'social') + '_' + Date.now();
        userData = {
            username: username,
            displayName: userInfo.name,
            profilePicture: userInfo.picture,
            role: 'user',
            email: userInfo.email,
            organization: 'general', 
            authProvider: userInfo.provider,
            userId: userInfo.userId
        };
        sheet.appendRow([userInfo.email, 'SOCIAL_LOGIN', username, JSON.stringify(userData), new Date()]);
        
        const profileSheet = ss.getSheetByName(SHEET_NAMES.PROFILE);
        if (profileSheet) {
             profileSheet.appendRow([
                new Date(), username, userInfo.name, userInfo.picture,
                '', '', '', '', '', '', '', 'user', 0, 1, '["novice"]', userInfo.email, '', '', userInfo.userId, true, '', '', '', 'general', 0
             ]);
        }

        logLogin(userData);
        return createSuccessResponse(userData);
    }
}

function handleVerifyUser(email, password) {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAMES.USERS);
    if (!sheet) return createErrorResponse({ message: "Users sheet missing" });
    
    const data = sheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
        if (data[i][0] === email && String(data[i][1]) === String(password)) {
            const user = JSON.parse(data[i][3]);
            logLogin(user);
            return createSuccessResponse(user);
        }
    }
    return createErrorResponse({ message: "Invalid email or password" });
}

function handleRegisterUser(user, password) {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAMES.USERS);
    if (!sheet) return createErrorResponse({ message: "System error" });
    
    const data = sheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
        if (data[i][0] === user.email) return createErrorResponse({ message: "Email already exists" });
    }
    
    const safeUser = { ...user, role: user.role || 'user', organization: 'general' }; 
    sheet.appendRow([user.email, password, user.username, JSON.stringify(safeUser), new Date()]);
    
    const profileSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAMES.PROFILE);
    if (profileSheet) {
         profileSheet.appendRow([
            new Date(), user.username, user.displayName, user.profilePicture,
            '', '', '', '', '', '', '', safeUser.role, 0, 1, '["novice"]', user.email, password, '', '', true, '', '', '', 'general', 0
         ]);
    }

    return createSuccessResponse({ status: "Registered" });
}

function logLogin(user) {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAMES.LOGIN_LOGS);
    if (sheet) {
        sheet.appendRow([new Date(), user.username, user.displayName, user.role, user.organization || 'general']);
    }
}

function getLatestProfileForUser(username) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAMES.PROFILE);
  if (!sheet || sheet.getLastRow() < 2) return null;
  
  const data = sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).getValues();
  const userRows = data.filter(row => row[1] === username);
  if (userRows.length === 0) return null;
  
  const lastEntry = userRows[userRows.length - 1];
  let badges = [];
  try { badges = JSON.parse(lastEntry[14]); } catch(e) { badges = ['novice']; }

  return { 
      gender: lastEntry[4], age: lastEntry[5], weight: lastEntry[6], height: lastEntry[7], 
      waist: lastEntry[8], hip: lastEntry[9], activityLevel: lastEntry[10],
      xp: Number(lastEntry[12] || 0), level: Number(lastEntry[13] || 1), badges: badges, 
      email: lastEntry[15], healthCondition: lastEntry[17], lineUserId: lastEntry[18],
      receiveDailyReminders: String(lastEntry[19]).toLowerCase() !== 'false',
      researchId: lastEntry[20], 
      pdpaAccepted: lastEntry[21],
      pdpaAcceptedDate: lastEntry[22],
      organization: lastEntry[23] || 'general' 
  };
}

function getAllHistoryForUser(sheetName, username) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  if (!sheet || sheet.getLastRow() < 2) return [];
  const data = sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).getValues();
  const rows = data.filter(row => row[1] === username);

  try {
    if (sheetName === SHEET_NAMES.BMI) return rows.map(r => ({ date: r[0], value: r[4], category: r[5] }));
    if (sheetName === SHEET_NAMES.TDEE) return rows.map(r => ({ date: r[0], value: r[4], bmr: r[5] }));
    if (sheetName === SHEET_NAMES.WATER) return rows.map(r => ({ date: r[0], id: new Date(r[0]).toISOString(), amount: r[4] }));
    if (sheetName === SHEET_NAMES.CALORIE) return rows.map(r => ({ date: r[0], id: new Date(r[0]).toISOString(), name: r[4], calories: r[5] }));
    if (sheetName === SHEET_NAMES.ACTIVITY) return rows.map(r => ({ date: r[0], id: new Date(r[0]).toISOString(), name: r[4], caloriesBurned: r[5] }));
    if (sheetName === SHEET_NAMES.FOOD) return rows.map(r => ({ date: r[0], id: new Date(r[0]).toISOString(), analysis: JSON.parse(r[6]) }));
    if (sheetName === SHEET_NAMES.SLEEP) return rows.map(r => ({ date: r[0], id: new Date(r[0]).toISOString(), bedTime: r[4], wakeTime: r[5], duration: r[6], quality: r[7], hygieneChecklist: JSON.parse(r[8] || "[]") }));
    if (sheetName === SHEET_NAMES.MOOD) return rows.map(r => ({ date: r[0], id: new Date(r[0]).toISOString(), moodEmoji: r[4], stressLevel: r[5], gratitude: r[6] }));
    if (sheetName === SHEET_NAMES.HABIT) return rows.map(r => ({ date: r[0], id: new Date(r[0]).toISOString(), type: r[4], amount: r[5], isClean: r[6] }));
    if (sheetName === SHEET_NAMES.SOCIAL) return rows.map(r => ({ date: r[0], id: new Date(r[0]).toISOString(), interaction: r[4], feeling: r[5] }));
    if (sheetName === SHEET_NAMES.PLANNER) return rows.map(r => ({ date: r[0], id: new Date(r[0]).toISOString(), cuisine: r[4], diet: r[5], tdee: r[6], plan: JSON.parse(r[7]) }));
    if (sheetName === SHEET_NAMES.EVALUATION) return rows.map(r => ({ date: r[0], id: new Date(r[0]).toISOString(), satisfaction: JSON.parse(r[4]||'{}'), outcomes: JSON.parse(r[5]||'{}') }));
    if (sheetName === 'QuizHistory') return rows.map(r => ({ date: r[0], id: new Date(r[0]).toISOString(), score: r[4], totalQuestions: r[5], correctAnswers: r[6], type: r[7] }));
    
    return [];
  } catch(e) { return []; }
}

function handleAdminFetch() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const result = {};
  
  ss.getSheets().forEach(s => {
    const name = s.getName();
    if (name === 'loginLog' || name === 'login_logs') return;

    const data = s.getDataRange().getValues();
    const headers = data[0];
    
    if (name === SHEET_NAMES.PROFILE) {
        result['profiles'] = data.slice(1).map(row => {
            let obj = {};
            headers.forEach((h, i) => obj[h] = row[i]);
            return obj;
        });
    } else if (name === SHEET_NAMES.LOGIN_LOGS) {
        result['loginLogs'] = data.slice(1).map(row => ({
            timestamp: row[0],
            username: row[1],
            displayName: row[2],
            role: row[3],
            organization: row[4] || 'general'
        }));
    } else {
        if (name === SHEET_NAMES.BMI) result['bmiHistory'] = data.slice(1).map(r => ({ timestamp: r[0], username: r[1], bmi: r[4], category: r[5] }));
        else if (name === SHEET_NAMES.TDEE) result['tdeeHistory'] = data.slice(1).map(r => ({ timestamp: r[0], username: r[1], tdee: r[4] }));
        else if (name === SHEET_NAMES.FOOD) result['foodHistory'] = data.slice(1).map(r => ({ timestamp: r[0], username: r[1], calories: r[5] }));
        else if (name === SHEET_NAMES.WATER) result['waterHistory'] = data.slice(1).map(r => ({ timestamp: r[0], username: r[1], amount: r[4] }));
        else if (name === SHEET_NAMES.ACTIVITY) result['activityHistory'] = data.slice(1).map(r => ({ timestamp: r[0], username: r[1], calories: r[5] }));
        else if (name === SHEET_NAMES.CALORIE) result['calorieHistory'] = data.slice(1).map(r => ({ timestamp: r[0], username: r[1], calories: r[5] }));
        else if (name === SHEET_NAMES.EVALUATION) result['evaluationHistory'] = data.slice(1).map(r => ({ timestamp: r[0], username: r[1], satisfaction_json: r[4], outcome_json: r[5] }));
    }
  });
  return createSuccessResponse(result);
}

function setupSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  const ensureSheet = (name, headers) => {
      let sheet = ss.getSheetByName(name);
      if (!sheet) {
          sheet = ss.insertSheet(name);
          if (headers) {
              sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
              sheet.setFrozenRows(1);
          }
      }
      return sheet;
  };

  // 1. Core Sheets
  const profileHeaders = [
    "timestamp", "username", "displayName", "profilePicture", "gender", 
    "age", "weight", "height", "waist", "hip", "activityLevel", 
    "role", "xp", "level", "badges", "email", "password", 
    "healthCondition", "lineUserId", "receiveDailyReminders", 
    "researchId", "pdpaAccepted", "pdpaAcceptedDate", "organization", "deltaXp"
  ];
  ensureSheet(SHEET_NAMES.PROFILE, profileHeaders);
  ensureSheet(SHEET_NAMES.LOGIN_LOGS, ["timestamp", "username", "displayName", "role", "organization"]);
  ensureSheet(SHEET_NAMES.USERS, ["email", "password", "username", "userDataJson", "timestamp"]);

  // 2. History Sheets
  const common = ["timestamp", "username", "displayName", "profilePicture"];
  ensureSheet(SHEET_NAMES.BMI, [...common, "bmi", "category"]);
  ensureSheet(SHEET_NAMES.TDEE, [...common, "tdee", "bmr"]);
  ensureSheet(SHEET_NAMES.WATER, [...common, "amount"]);
  ensureSheet(SHEET_NAMES.CALORIE, [...common, "name", "calories"]);
  ensureSheet(SHEET_NAMES.ACTIVITY, [...common, "name", "caloriesBurned"]);
  ensureSheet(SHEET_NAMES.FOOD, [...common, "description", "calories", "analysis_json"]);
  ensureSheet(SHEET_NAMES.SLEEP, [...common, "bedTime", "wakeTime", "duration", "quality", "hygieneChecklist"]);
  ensureSheet(SHEET_NAMES.MOOD, [...common, "emoji", "stressLevel", "gratitude"]);
  ensureSheet(SHEET_NAMES.HABIT, [...common, "type", "amount", "isClean"]);
  ensureSheet(SHEET_NAMES.SOCIAL, [...common, "interaction", "feeling"]);
  ensureSheet(SHEET_NAMES.PLANNER, [...common, "cuisine", "diet", "tdee_goal", "plan_json"]);
  ensureSheet(SHEET_NAMES.EVALUATION, ["timestamp", "username", "displayName", "role", "satisfaction_json", "outcome_json"]);
  ensureSheet("QuizHistory", [...common, "score", "totalQuestions", "correctAnswers", "type"]);

  // 3. Setup Complete
  return "Setup Complete (v6.0 Direct Index)";
}

function createSuccessResponse(data) {
  return ContentService.createTextOutput(JSON.stringify({ status: "success", data: data }))
    .setMimeType(ContentService.MimeType.JSON);
}

function createErrorResponse(error) {
  return ContentService.createTextOutput(JSON.stringify({ status: "error", message: error.toString() }))
    .setMimeType(ContentService.MimeType.JSON);
}

// --- NOTIFICATION HANDLERS (Legacy) ---
function handleTestNotification(user) {
    const profile = getLatestProfileForUser(user.username);
    if (profile && profile.lineUserId) {
        sendLinePush(profile.lineUserId, [{ type: 'text', text: '✅ ทดสอบการแจ้งเตือนสำเร็จ!' }]);
        return createSuccessResponse({ status: "Sent" });
    }
    return createErrorResponse("No LINE ID");
}

function handleNotifyComplete(user) {
    const profile = getLatestProfileForUser(user.username);
    if (profile && profile.lineUserId) {
        sendLinePush(profile.lineUserId, [{ type: 'text', text: '🎉 ภารกิจวันนี้สำเร็จแล้ว! ยอดเยี่ยมมากครับ' }]);
        return createSuccessResponse({ status: "Sent" });
    }
    return createSuccessResponse({ status: "No ID" });
}

function sendLinePush(userId, messages) {
    if (!LINE_CHANNEL_ACCESS_TOKEN) return;
    try {
        UrlFetchApp.fetch('https://api.line.me/v2/bot/message/push', {
            method: 'post',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + LINE_CHANNEL_ACCESS_TOKEN },
            payload: JSON.stringify({ to: userId, messages: messages }),
            muteHttpExceptions: true
        });
    } catch (e) { Logger.log(e); }
}
