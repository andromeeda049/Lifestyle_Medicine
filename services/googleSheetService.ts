import { UserProfile, BMIHistoryEntry, TDEEHistoryEntry, FoodHistoryEntry, PlannerHistoryEntry, WaterHistoryEntry, User } from '../types';

interface AllData {
    profile: UserProfile | null;
    bmiHistory: BMIHistoryEntry[];
    tdeeHistory: TDEEHistoryEntry[];
    foodHistory: FoodHistoryEntry[];
    plannerHistory: PlannerHistoryEntry[];
    waterHistory: WaterHistoryEntry[];
}

export interface AllAdminData {
    profiles: any[];
    bmiHistory: any[];
    tdeeHistory: any[];
    foodHistory: any[];
    plannerHistory: any[];
    waterHistory: any[];
    loginLogs: any[];
}

// ดึงข้อมูลทั้งหมดจาก Google Sheet (สำหรับ User)
export const fetchAllDataFromSheet = async (scriptUrl: string, user: User): Promise<AllData | null> => {
    if (!scriptUrl || !user) return null;
    try {
        const urlWithParams = `${scriptUrl}?username=${encodeURIComponent(user.username)}`;
        const response = await fetch(urlWithParams, { 
            method: 'GET', 
            redirect: 'follow',
            mode: 'cors' 
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        const result = await response.json();
        if (result.status === 'success') {
             const data = result.data;
             const sanitizedProfile = data.profile ? {
                ...data.profile,
                age: String(data.profile.age || ''),
                weight: String(data.profile.weight || ''),
                height: String(data.profile.height || ''),
                waist: String(data.profile.waist || ''),
                hip: String(data.profile.hip || ''),
                activityLevel: Number(data.profile.activityLevel),
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
        const urlWithParams = `${scriptUrl}?action=getAllData&adminKey=${encodeURIComponent(adminKey)}`;
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
export const clearHistoryInSheet = async (scriptUrl: string, type: 'bmiHistory' | 'tdeeHistory' | 'foodHistory' | 'waterHistory', user: User): Promise<boolean> => {
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