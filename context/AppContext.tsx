import React, { createContext, ReactNode, useState, useEffect, useCallback } from 'react';
import useLocalStorage from '../hooks/useLocalStorage';
import { AppView, BMIHistoryEntry, TDEEHistoryEntry, NutrientInfo, FoodHistoryEntry, UserProfile, Theme, PlannerHistoryEntry, WaterHistoryEntry, User, AppContextType } from '../types';
import { PLANNER_ACTIVITY_LEVELS, HEALTH_CONDITIONS } from '../constants';
import { fetchAllDataFromSheet, saveDataToSheet, clearHistoryInSheet } from '../services/googleSheetService';

// กำหนดค่าเริ่มต้นสำหรับการเชื่อมต่อ
const DEFAULT_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbx6e8zDxmmoZWg2iW_oQHlpfqWZrpS-2Vkq9aFPlnW5MVdGPf8_-yaEJ7iugtdAWvJT/exec';
const DEFAULT_API_KEY = 'AIzaSyC15sfjlw34CRFHBFifCF-0PEdsleMKokk';

const defaultProfile: UserProfile = {
  gender: 'male',
  age: '',
  weight: '',
  height: '',
  waist: '',
  hip: '',
  activityLevel: PLANNER_ACTIVITY_LEVELS[2].value,
  healthCondition: HEALTH_CONDITIONS[0],
};

const getInitialTheme = (): Theme => {
    if (typeof window !== 'undefined') {
        const storedTheme = window.localStorage.getItem('theme');
        if (storedTheme === 'dark' || storedTheme === 'light') {
            return storedTheme;
        }
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
};

export const AppContext = createContext<AppContextType>({} as AppContextType);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [activeView, setActiveView] = useState<AppView>('home');
  const [currentUser, setCurrentUser] = useLocalStorage<User | null>('currentUser', null);
  const [theme, setTheme] = useLocalStorage<Theme>('theme', getInitialTheme());
  const [bmiHistory, _setBmiHistory] = useLocalStorage<BMIHistoryEntry[]>('bmiHistory', []);
  const [tdeeHistory, _setTdeeHistory] = useLocalStorage<TDEEHistoryEntry[]>('tdeeHistory', []);
  const [foodHistory, _setFoodHistory] = useLocalStorage<FoodHistoryEntry[]>('foodHistory', []);
  const [plannerHistory, _setPlannerHistory] = useLocalStorage<PlannerHistoryEntry[]>('plannerHistory', []);
  const [waterHistory, _setWaterHistory] = useLocalStorage<WaterHistoryEntry[]>('waterHistory', []);
  const [waterGoal, setWaterGoal] = useLocalStorage<number>('waterGoal', 2000);
  const [latestFoodAnalysis, setLatestFoodAnalysis] = useLocalStorage<NutrientInfo | null>('latestFoodAnalysis', null);
  const [userProfile, _setUserProfile] = useLocalStorage<UserProfile>('userProfile', defaultProfile);
  const [scriptUrl, setScriptUrl] = useLocalStorage<string>('googleScriptUrl', DEFAULT_SCRIPT_URL);
  const [apiKey, setApiKey] = useLocalStorage<string>('geminiApiKey', DEFAULT_API_KEY);
  const [isDataSynced, setIsDataSynced] = useState(true);

  // Theme management
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Ensure defaults are applied if local storage has empty strings
  useEffect(() => {
      if (!scriptUrl && DEFAULT_SCRIPT_URL) {
          setScriptUrl(DEFAULT_SCRIPT_URL);
      }
      if (!apiKey && DEFAULT_API_KEY) {
          setApiKey(DEFAULT_API_KEY);
      }
  }, []);

  // --- Auth Functions ---
  const login = (user: User) => {
    setCurrentUser(user);
    _setUserProfile(defaultProfile);
    _setBmiHistory([]);
    _setTdeeHistory([]);
    _setFoodHistory([]);
    _setPlannerHistory([]);
    _setWaterHistory([]);
    setLatestFoodAnalysis(null);
    setActiveView('home');

    if (scriptUrl) {
      // Log the login event. No need to wait for it.
      saveDataToSheet(scriptUrl, 'loginLog', user, user);
    }
    
     // Automatically save admin profile since it's not editable
    if (user.role === 'admin' && scriptUrl) {
      saveDataToSheet(scriptUrl, 'profile', defaultProfile, user);
    }
  };

  const logout = () => {
    setCurrentUser(null);
    setActiveView('home');
  };

  // ดึงข้อมูลทั้งหมดจาก Google Sheet เมื่อเปิดแอป
  useEffect(() => {
    const loadAllData = async () => {
      // Only fetch data for users, not for admins as they have a separate dashboard
      if (scriptUrl && currentUser && currentUser.role === 'user') {
        setIsDataSynced(false);
        const fetchedData = await fetchAllDataFromSheet(scriptUrl, currentUser);
        if (fetchedData) {
          _setUserProfile(fetchedData.profile || defaultProfile);
          _setBmiHistory(fetchedData.bmiHistory);
          _setTdeeHistory(fetchedData.tdeeHistory);
          _setFoodHistory(fetchedData.foodHistory);
          _setPlannerHistory(fetchedData.plannerHistory);
          _setWaterHistory(fetchedData.waterHistory);
        }
        setIsDataSynced(true);
      }
    };
    loadAllData();
  }, [scriptUrl, currentUser]);

  // --- Wrapper Functions for State Management and Syncing ---

  const setUserProfile = useCallback((profileData: UserProfile, accountData: { displayName: string; profilePicture: string; }) => {
    if (!currentUser) return;
    
    const updatedUser = {
        ...currentUser,
        displayName: accountData.displayName,
        profilePicture: accountData.profilePicture
    };
    
    setCurrentUser(updatedUser);
    _setUserProfile(profileData);
    
    if (scriptUrl) {
        saveDataToSheet(scriptUrl, 'profile', profileData, updatedUser);
    }
}, [scriptUrl, currentUser, setCurrentUser, _setUserProfile]);

  const setBmiHistory = useCallback((value: React.SetStateAction<BMIHistoryEntry[]>) => {
    if (!currentUser || currentUser.role === 'admin') return;
    const newHistory = value instanceof Function ? value(bmiHistory) : value;
    _setBmiHistory(newHistory);
    if (scriptUrl && newHistory.length > 0) saveDataToSheet(scriptUrl, 'bmiHistory', newHistory, currentUser);
  }, [scriptUrl, _setBmiHistory, bmiHistory, currentUser]);
  
  const setTdeeHistory = useCallback((value: React.SetStateAction<TDEEHistoryEntry[]>) => {
    if (!currentUser || currentUser.role === 'admin') return;
    const newHistory = value instanceof Function ? value(tdeeHistory) : value;
    _setTdeeHistory(newHistory);
    if (scriptUrl && newHistory.length > 0) saveDataToSheet(scriptUrl, 'tdeeHistory', newHistory, currentUser);
  }, [scriptUrl, _setTdeeHistory, tdeeHistory, currentUser]);

  const setFoodHistory = useCallback((value: React.SetStateAction<FoodHistoryEntry[]>) => {
    if (!currentUser || currentUser.role === 'admin') return;
    const newHistory = value instanceof Function ? value(foodHistory) : value;
    _setFoodHistory(newHistory);
    if (scriptUrl && newHistory.length > 0) saveDataToSheet(scriptUrl, 'foodHistory', newHistory, currentUser);
  }, [scriptUrl, _setFoodHistory, foodHistory, currentUser]);
  
  const setPlannerHistory = useCallback((value: React.SetStateAction<PlannerHistoryEntry[]>) => {
    if (!currentUser || currentUser.role === 'admin') return;
    const newHistory = value instanceof Function ? value(plannerHistory) : value;
    _setPlannerHistory(newHistory);
    if (scriptUrl && newHistory.length > 0) saveDataToSheet(scriptUrl, 'plannerHistory', newHistory, currentUser);
  }, [scriptUrl, _setPlannerHistory, plannerHistory, currentUser]);

  const setWaterHistory = useCallback((value: React.SetStateAction<WaterHistoryEntry[]>) => {
    if (!currentUser || currentUser.role === 'admin') return;
    const newHistory = value instanceof Function ? value(waterHistory) : value;
    _setWaterHistory(newHistory);
    if (scriptUrl && newHistory.length > 0) saveDataToSheet(scriptUrl, 'waterHistory', newHistory, currentUser);
  }, [scriptUrl, _setWaterHistory, waterHistory, currentUser]);

  const clearBmiHistory = useCallback(() => {
    if (!currentUser || currentUser.role === 'admin') return;
    _setBmiHistory([]);
    if (scriptUrl) clearHistoryInSheet(scriptUrl, 'bmiHistory', currentUser);
  }, [scriptUrl, _setBmiHistory, currentUser]);
  
  const clearTdeeHistory = useCallback(() => {
     if (!currentUser || currentUser.role === 'admin') return;
    _setTdeeHistory([]);
    if (scriptUrl) clearHistoryInSheet(scriptUrl, 'tdeeHistory', currentUser);
  }, [scriptUrl, _setTdeeHistory, currentUser]);
  
  const clearFoodHistory = useCallback(() => {
     if (!currentUser || currentUser.role === 'admin') return;
    _setFoodHistory([]);
    if (scriptUrl) clearHistoryInSheet(scriptUrl, 'foodHistory', currentUser);
  }, [scriptUrl, _setFoodHistory, currentUser]);

  const clearWaterHistory = useCallback(() => {
    if (!currentUser || currentUser.role === 'admin') return;
    _setWaterHistory([]);
    if (scriptUrl) clearHistoryInSheet(scriptUrl, 'waterHistory', currentUser);
 }, [scriptUrl, _setWaterHistory, currentUser]);


  return (
    <AppContext.Provider value={{ 
        activeView, setActiveView,
        currentUser, login, logout,
        theme, setTheme,
        bmiHistory, setBmiHistory, 
        tdeeHistory, setTdeeHistory,
        foodHistory, setFoodHistory,
        plannerHistory, setPlannerHistory,
        waterHistory, setWaterHistory,
        waterGoal, setWaterGoal,
        latestFoodAnalysis, setLatestFoodAnalysis,
        userProfile, setUserProfile,
        scriptUrl, setScriptUrl,
        apiKey, setApiKey,
        isDataSynced,
        clearBmiHistory,
        clearTdeeHistory,
        clearFoodHistory,
        clearWaterHistory,
    }}>
      {children}
    </AppContext.Provider>
  );
};