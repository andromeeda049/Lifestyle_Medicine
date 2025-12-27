
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
    quizHistory: QuizEntry[];
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
    quizHistory: any[];
}

export const fetchLeaderboard = async (scriptUrl: string, user?: User): Promise<{ leaderboard: any[], trending: any[] }> => {
    if (!scriptUrl) throw new Error("Script URL is missing");
    
    // Create a dummy user if not provided to pass backend validation
    const payloadUser = user || { 
        username: 'guest_monitor', 
        displayName: 'System Monitor', 
        profilePicture: '', 
        role: 'guest' 
    };

    try {
        const response = await fetch(scriptUrl, {
            method: 'POST',
            body: JSON.stringify({ action: 'getLeaderboard', user: payloadUser }),
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            mode: 'cors',
        });
        
        const text = await response.text();
        let result;
        
        try {
            result = JSON.parse(text);
        } catch (e) {
            throw new Error(`Invalid JSON response: ${text.substring(0, 100)}...`);
        }

        if (result.status === 'success') {
            return {
                leaderboard: Array.isArray(result.data.leaderboard) ? result.data.leaderboard : [],
                trending: Array.isArray(result.data.trending) ? result.data.trending : []
            };
        } else {
            // Throw the specific error message from Google Script
            throw new Error(result.message || "Unknown error from server");
        }
    } catch (error: any) {
        console.error("Leaderboard fetch failed:", error);
        throw error; // Re-throw to be caught by the component
    }
};

export const fetchAllDataFromSheet = async (scriptUrl: string, user: User): Promise<AllData | null> => {
    if (!scriptUrl || !user) return null;
    try {
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
                parsedBadges = data.profile && data.profile.badges ? (typeof data.profile.badges === 'string' ? JSON.parse(data.profile.badges) : data.profile.badges) : ['novice'];
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
                healthCondition: String(data.profile.healthCondition || 'ไม่มีโรคประจำตัว'),
                lineUserId: String(data.profile.lineUserId || ''),
                telegramUserId: String(data.profile.telegramUserId || ''),
                xp: Number(data.profile.xp || 0),
                level: Number(data.profile.level || 1),
                badges: parsedBadges,
                organization: String(data.profile.organization || 'general'),
                researchId: String(data.profile.researchId || ''),
                pdpaAccepted: String(data.profile.pdpaAccepted).toLowerCase() === 'true',
                pdpaAcceptedDate: String(data.profile.pdpaAcceptedDate || '')
            } : null;

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
                quizHistory: (data.quizHistory || []).sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime()),
            };
        }
        return null;
    } catch (error: any) {
        return null;
    }
};

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
        if (result.status === 'success') return result.data;
        return null;
    } catch (error: any) {
        return null;
    }
};

export const saveDataToSheet = async (scriptUrl: string, type: string, payload: any, user: User): Promise<boolean> => {
    if (!scriptUrl || !user) return false;
    
    // STRICT SANITIZATION: Force role to be a string to prevent array injection from corrupted state
    const sanitizedUser = {
        ...user,
        role: (typeof user.role === 'string') ? user.role : 'user', 
    };

    try {
        const response = await fetch(scriptUrl, {
            method: 'POST',
            body: JSON.stringify({ action: 'save', type, payload, user: sanitizedUser }),
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            mode: 'cors',
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const result = await response.json();
        return result.status === 'success';
    } catch (error: any) {
        return false;
    }
};

export const clearHistoryInSheet = async (scriptUrl: string, type: string, user: User): Promise<boolean> => {
    if (!scriptUrl || !user) return false;
    try {
        const response = await fetch(scriptUrl, {
            method: 'POST',
            body: JSON.stringify({ action: 'clear', type, user }),
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            mode: 'cors',
        });
        const result = await response.json();
        return result.status === 'success';
    } catch (error: any) {
        return false;
    }
};

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
        console.error("Error sending notification:", error);
    }
};

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

export const sendTelegramTestNotification = async (scriptUrl: string, user: User): Promise<{success: boolean, message: string}> => {
    if (!scriptUrl || !user) return { success: false, message: 'Missing config' };
    try {
        const response = await fetch(scriptUrl, {
            method: 'POST',
            body: JSON.stringify({ action: 'testTelegramNotification', user }),
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            mode: 'cors',
        });
        const result = await response.json();
        if(result.status === 'success') return { success: true, message: 'Telegram Sent' };
        else return { success: false, message: result.message || 'Telegram Failed' };
    } catch (error: any) {
        return { success: false, message: error.message };
    }
};

export const registerUser = async (scriptUrl: string, user: User, password?: string): Promise<{success: boolean, message: string}> => {
    if (!scriptUrl) return { success: false, message: 'Script URL missing' };
    try {
        const response = await fetch(scriptUrl, {
            method: 'POST',
            body: JSON.stringify({ action: 'register', user: user, password: password }),
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            mode: 'cors',
        });
        
        const text = await response.text();
        let result;
        try {
            result = JSON.parse(text);
        } catch (e) {
            console.error("Invalid JSON from registerUser:", text);
            return { success: false, message: 'Server returned invalid data' };
        }

        return { success: result.status === 'success', message: result.message || 'Status: ' + result.status };
    } catch (error: any) {
        return { success: false, message: error.message };
    }
};

export const verifyUser = async (scriptUrl: string, email: string, password?: string): Promise<{success: boolean, user?: User, message?: string}> => {
    if (!scriptUrl) return { success: false, message: 'Script URL missing' };
    try {
        const response = await fetch(scriptUrl, {
            method: 'POST',
            body: JSON.stringify({ action: 'verifyUser', email: email, password: password, user: { username: 'auth_temp', displayName: 'Auth', role: 'guest' } }),
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            mode: 'cors',
        });
        
        const text = await response.text();
        let result;
        try {
            result = JSON.parse(text);
        } catch (e) {
            console.error("Invalid JSON from verifyUser:", text);
            return { success: false, message: 'Server returned invalid data' };
        }

        // Sanitize returned user
        if (result.status === 'success' && result.data) {
            const sanitizedUser = { ...result.data, role: (typeof result.data.role === 'string') ? result.data.role : 'user' };
            return { success: true, user: sanitizedUser };
        }
        return { success: false, message: result.message || 'Invalid credentials' };
    } catch (error: any) {
        return { success: false, message: error.message };
    }
};

export const socialAuth = async (
    scriptUrl: string, 
    userInfo: { email: string, name: string, picture: string, provider: 'google' | 'line' | 'telegram', userId?: string }
): Promise<{success: boolean, user?: User, message?: string}> => {
    if (!scriptUrl) return { success: false, message: 'Script URL missing' };
    try {
        const response = await fetch(scriptUrl, {
            method: 'POST',
            body: JSON.stringify({ action: 'socialAuth', payload: userInfo, user: { username: 'social_login_temp', displayName: 'Temp', role: 'guest' } }),
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            mode: 'cors',
        });
        
        const text = await response.text();
        let result;
        try {
            result = JSON.parse(text);
        } catch (e) {
            console.error("Invalid JSON from socialAuth:", text);
            if (text.includes("ScriptError")) return { success: false, message: 'Google Script Error (Check Backend)' };
            return { success: false, message: 'Server connection failed (Invalid JSON)' };
        }

        if (result.status === 'success' && result.data) {
            const sanitizedUser = { ...result.data, role: (typeof result.data.role === 'string') ? result.data.role : 'user' };
            return { success: true, user: sanitizedUser };
        }
        return { success: false, message: result.message || result.data || 'Authentication failed' };
    } catch (error: any) {
        return { success: false, message: error.message };
    }
}
