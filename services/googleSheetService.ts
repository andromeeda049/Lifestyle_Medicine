
import { UserProfile, BMIHistoryEntry, TDEEHistoryEntry, FoodHistoryEntry, PlannerHistoryEntry, WaterHistoryEntry, CalorieHistoryEntry, ActivityHistoryEntry, SleepEntry, MoodEntry, HabitEntry, SocialEntry, EvaluationEntry, QuizEntry, User } from '../types';

interface AllData {
    profile: UserProfile | null;
    bmiHistory: BMIHistoryEntry[];
    tdeeHistory: TDEEHistoryEntry[];
    foodHistory: FoodHistoryEntry[];
    plannerHistory: PlannerHistoryEntry[];
    waterHistory: WaterHistoryEntry[];
    calorieHistory: CalorieHistoryEntry[];
    activityHistory: ActivityHistoryEntry[];
    sleepHistory: SleepEntry[];
    moodHistory: MoodEntry[];
    habitHistory: HabitEntry[];
    socialHistory: SocialEntry[];
    evaluationHistory: EvaluationEntry[];
    quizHistory: QuizEntry[]; // Added
}

export interface AllAdminData {
    profiles: any[];
    bmiHistory: any[];
    tdeeHistory: any[];
    foodHistory: any[];
    plannerHistory: any[];
    waterHistory: any[];
    calorieHistory: any[];
    activityHistory: any[];
    loginLogs: any[];
    evaluationHistory: any[];
    quizHistory: any[]; // Added
}

// Fetch Leaderboard (Public Safe Data)
export const fetchLeaderboard = async (scriptUrl: string): Promise<any[]> => {
    if (!scriptUrl) return [];
    try {
        const response = await fetch(scriptUrl, {
            method: 'POST',
            body: JSON.stringify({ action: 'getLeaderboard' }),
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            mode: 'cors',
        });
        const result = await response.json();
        if (result.status === 'success') {
            return result.data;
        }
        // Fallback mock data if backend not updated yet
        return [
            { username: 'user1', displayName: 'พี่สมชาย รักสุขภาพ', xp: 5200, level: 5, badges: ['novice', 'active'], profilePicture: '🏃‍♂️' },
            { username: 'user2', displayName: 'น้องน้ำใส', xp: 4800, level: 4, badges: ['hydrated'], profilePicture: '💧' },
            { username: 'user3', displayName: 'คุณหมอใจดี', xp: 4500, level: 4, badges: ['scholar'], profilePicture: '🩺' },
            { username: 'user4', displayName: 'ป้าสมศรี', xp: 3200, level: 3, badges: ['novice'], profilePicture: '👵' },
            { username: 'user5', displayName: 'User123', xp: 1500, level: 2, badges: [], profilePicture: '👤' },
        ];
    } catch (error) {
        console.warn("Leaderboard fetch failed, using fallback.");
        return [
            { username: 'user1', displayName: 'พี่สมชาย รักสุขภาพ', xp: 5200, level: 5, badges: ['novice', 'active'], profilePicture: '🏃‍♂️' },
            { username: 'user2', displayName: 'น้องน้ำใส', xp: 4800, level: 4, badges: ['hydrated'], profilePicture: '💧' },
            { username: 'user3', displayName: 'คุณหมอใจดี', xp: 4500, level: 4, badges: ['scholar'], profilePicture: '🩺' },
        ];
    }
};

// ดึงข้อมูลทั้งหมดจาก Google Sheet (สำหรับ User)
export const fetchAllDataFromSheet = async (scriptUrl: string, user: User): Promise<AllData | null> => {
    if (!scriptUrl || !user) return null;
    try {
        // ADDED: Cache-busting timestamp (_t)
        const urlWithParams = `${scriptUrl}?username=${encodeURIComponent(user.username)}&_t=${Date.now()}`;
        const response = await fetch(urlWithParams, { 
            method: 'GET', 
            redirect: 'follow',
            mode: 'cors' 
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        const result = await response.json();
        if (result.status === 'success') {
             const data = result.data;
             
             let parsedBadges = [];
             try {
                parsedBadges = data.profile && data.profile.badges ? JSON.parse(data.profile.badges) : ['novice'];
             } catch (e) {
                parsedBadges = ['novice'];
             }

             const sanitizedProfile = data.profile ? {
                ...data.profile,
                age: String(data.profile.age || ''),
                weight: String(data.profile.weight || ''),
                height: String(data.profile.height || ''),
                waist: String(data.profile.waist || ''),
                hip: String(data.profile.hip || ''),
                activityLevel: Number(data.profile.activityLevel),
                healthCondition: String(data.profile.healthCondition || 'ไม่มีโรคประจำตัว'), // Fetch health condition
                lineUserId: String(data.profile.lineUserId || ''), // Fetch LineUserID
                xp: Number(data.profile.xp || 0),
                level: Number(data.profile.level || 1),
                badges: parsedBadges,
                organization: String(data.profile.organization || 'general'), // Parse Organization
                researchId: String(data.profile.researchId || ''), // Fetch Research ID
                pdpaAccepted: String(data.profile.pdpaAccepted).toLowerCase() === 'true', // Fetch PDPA Status
                pdpaAcceptedDate: String(data.profile.pdpaAcceptedDate || '')
            } : null;

            // Helper sort function: Newest first
            const sortByDateDesc = (a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime();

            return {
                profile: sanitizedProfile,
                bmiHistory: (data.bmiHistory || []).sort(sortByDateDesc),
                tdeeHistory: (data.tdeeHistory || []).sort(sortByDateDesc),
                foodHistory: (data.foodHistory || []).sort(sortByDateDesc),
                plannerHistory: (data.plannerHistory || []).sort(sortByDateDesc),
                waterHistory: (data.waterHistory || []).sort(sortByDateDesc),
                calorieHistory: (data.calorieHistory || []).sort(sortByDateDesc),
                activityHistory: (data.activityHistory || []).sort(sortByDateDesc),
                sleepHistory: (data.sleepHistory || []).sort(sortByDateDesc),
                moodHistory: (data.moodHistory || []).sort(sortByDateDesc),
                habitHistory: (data.habitHistory || []).sort(sortByDateDesc),
                socialHistory: (data.socialHistory || []).sort(sortByDateDesc),
                evaluationHistory: (data.evaluationHistory || []).sort(sortByDateDesc),
                quizHistory: (data.quizHistory || []).sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime()), // Keep quizzes chronological for Pre/Post logic
            };
        }
        console.error("Error fetching data from sheet:", result.message);
        return null;
    } catch (error: any) {
        if (error.message === 'Failed to fetch') {
            console.warn("Could not connect to Google Sheets. Check the URL or your internet connection.");
        } else {
            console.error("Error fetching all data from Google Sheet:", error);
        }
        return null;
    }
};

// ดึงข้อมูลทั้งหมดจากทุกชีต (สำหรับ Admin)
export const fetchAllAdminDataFromSheet = async (scriptUrl: string, adminKey: string): Promise<AllAdminData | null> => {
    if (!scriptUrl || !adminKey) return null;
    try {
        const urlWithParams = `${scriptUrl}?action=getAllData&adminKey=${encodeURIComponent(adminKey)}&_t=${Date.now()}`;
        const response = await fetch(urlWithParams, {
            method: 'GET',
            redirect: 'follow',
            mode: 'cors'
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        const result = await response.json();
        if (result.status === 'success') {
            return result.data;
        }
        console.error("Admin data fetch error:", result.message);
        return null;
    } catch (error: any) {
        if (error.message === 'Failed to fetch') {
            console.warn("Could not connect to Google Sheets (Admin). Check the URL or your internet connection.");
        } else {
            console.error("Error fetching all admin data from Google Sheet:", error);
        }
        return null;
    }
};

// บันทึกข้อมูลประเภทต่างๆ ลงใน Google Sheet
export const saveDataToSheet = async (scriptUrl: string, type: string, payload: any, user: User): Promise<boolean> => {
    if (!scriptUrl || !user) return false;
    try {
        const response = await fetch(scriptUrl, {
            method: 'POST',
            body: JSON.stringify({ action: 'save', type, payload, user }),
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            mode: 'cors',
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const result = await response.json();
        return result.status === 'success';
    } catch (error: any) {
        if (error.message === 'Failed to fetch') {
            console.warn(`Could not save ${type} to Google Sheets. Connection failed.`);
        } else {
            console.error(`Error saving ${type} to Google Sheet:`, error);
        }
        return false;
    }
};

// ล้างประวัติใน Google Sheet
export const clearHistoryInSheet = async (scriptUrl: string, type: string, user: User): Promise<boolean> => {
    if (!scriptUrl || !user) return false;
    try {
        const response = await fetch(scriptUrl, {
            method: 'POST',
            body: JSON.stringify({ action: 'clear', type, user }),
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            mode: 'cors',
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const result = await response.json();
        return result.status === 'success';
    } catch (error: any) {
        if (error.message === 'Failed to fetch') {
            console.warn(`Could not clear ${type} in Google Sheets. Connection failed.`);
        } else {
            console.error(`Error clearing ${type} in Google Sheet:`, error);
        }
        return false;
    }
};

// ส่งสัญญาณให้ Backend แจ้งเตือนผ่าน LINE
export const sendMissionCompleteNotification = async (scriptUrl: string, user: User): Promise<void> => {
    if (!scriptUrl || !user) return;
    try {
        await fetch(scriptUrl, {
            method: 'POST',
            body: JSON.stringify({ action: 'notifyComplete', user }),
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            mode: 'cors',
        });
    } catch (error) {
        console.error("Error sending LINE notification:", error);
    }
};

// ทดสอบส่ง Notification
export const sendTestNotification = async (scriptUrl: string, user: User): Promise<{success: boolean, message: string}> => {
    if (!scriptUrl || !user) return { success: false, message: 'Missing config' };
    try {
        const response = await fetch(scriptUrl, {
            method: 'POST',
            body: JSON.stringify({ action: 'testNotification', user }),
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            mode: 'cors',
        });
        const result = await response.json();
        if(result.status === 'success') return { success: true, message: 'Sent' };
        else return { success: false, message: result.message || 'Failed' };
    } catch (error: any) {
        return { success: false, message: error.message };
    }
};

// Register User (Send Email/Password to GAS)
export const registerUser = async (scriptUrl: string, user: User, password?: string): Promise<{success: boolean, message: string}> => {
    if (!scriptUrl) return { success: false, message: 'Script URL missing' };
    try {
        const response = await fetch(scriptUrl, {
            method: 'POST',
            body: JSON.stringify({ 
                action: 'register', 
                user: user, // Keep full user object for new scripts
                password: password 
            }),
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            mode: 'cors',
        });
        const result = await response.json();
        if (result.status === 'success') {
            return { success: true, message: 'Registration successful' };
        } else {
            return { success: false, message: result.message || 'Registration failed' };
        }
    } catch (error: any) {
        return { success: false, message: error.message || 'Connection error' };
    }
};

// Verify User Login (Check Email/Password)
export const verifyUser = async (scriptUrl: string, email: string, password?: string): Promise<{success: boolean, user?: User, message?: string}> => {
    if (!scriptUrl) return { success: false, message: 'Script URL missing' };
    try {
        // NOTE: Send a dummy 'user' object. Older scripts might check for 'user' property globally 
        // before checking 'action'. This prevents 'User information is missing' error on legacy backends.
        const response = await fetch(scriptUrl, {
            method: 'POST',
            body: JSON.stringify({ 
                action: 'verifyUser', 
                email: email,
                password: password,
                user: { username: 'auth_temp', displayName: 'Auth', role: 'guest' } 
            }),
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            mode: 'cors',
        });
        const result = await response.json();
        if (result.status === 'success' && result.data) {
            return { success: true, user: result.data };
        } else {
            return { success: false, message: result.message || 'Invalid credentials' };
        }
    } catch (error: any) {
        return { success: false, message: error.message || 'Connection error' };
    }
};

// Social Auth (Google/Line/Telegram Login Backend Handling)
export const socialAuth = async (
    scriptUrl: string, 
    userInfo: { email: string, name: string, picture: string, provider: 'google' | 'line' | 'telegram', userId?: string }
): Promise<{success: boolean, user?: User, message?: string}> => {
    if (!scriptUrl) return { success: false, message: 'Script URL missing' };
    try {
        const response = await fetch(scriptUrl, {
            method: 'POST',
            body: JSON.stringify({ 
                action: 'socialAuth', 
                payload: userInfo,
                user: { username: 'social_login_temp', displayName: 'Temp', role: 'guest' } 
            }),
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            mode: 'cors',
        });
        const result = await response.json();
        if (result.status === 'success' && result.data) {
            return { success: true, user: result.data };
        } else {
            return { success: false, message: result.message || 'Authentication failed' };
        }
    } catch (error: any) {
        return { success: false, message: error.message || 'Connection error' };
    }
}
