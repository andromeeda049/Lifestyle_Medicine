
import React, { createContext, ReactNode, useState, useEffect, useCallback } from 'react';
import useLocalStorage from '../hooks/useLocalStorage';
import { AppView, BMIHistoryEntry, TDEEHistoryEntry, NutrientInfo, FoodHistoryEntry, UserProfile, Theme, PlannerHistoryEntry, WaterHistoryEntry, CalorieHistoryEntry, ActivityHistoryEntry, SleepEntry, MoodEntry, HabitEntry, SocialEntry, EvaluationEntry, User, AppContextType, Achievement, SatisfactionData, OutcomeData } from '../types';
import { PLANNER_ACTIVITY_LEVELS, HEALTH_CONDITIONS, LEVEL_THRESHOLDS, ACHIEVEMENTS } from '../constants';
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
  xp: 0,
  level: 1,
  badges: ['novice'], // Default badge
  receiveDailyReminders: true // Default to true
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
  const [calorieHistory, _setCalorieHistory] = useLocalStorage<CalorieHistoryEntry[]>('calorieHistory', []);
  const [activityHistory, _setActivityHistory] = useLocalStorage<ActivityHistoryEntry[]>('activityHistory', []);
  
  // New Wellness States
  const [sleepHistory, _setSleepHistory] = useLocalStorage<SleepEntry[]>('sleepHistory', []);
  const [moodHistory, _setMoodHistory] = useLocalStorage<MoodEntry[]>('moodHistory', []);
  const [habitHistory, _setHabitHistory] = useLocalStorage<HabitEntry[]>('habitHistory', []);
  const [socialHistory, _setSocialHistory] = useLocalStorage<SocialEntry[]>('socialHistory', []);

  // Evaluation State
  const [evaluationHistory, _setEvaluationHistory] = useLocalStorage<EvaluationEntry[]>('evaluationHistory', []);

  const [waterGoal, setWaterGoal] = useLocalStorage<number>('waterGoal', 2000);
  const [latestFoodAnalysis, setLatestFoodAnalysis] = useLocalStorage<NutrientInfo | null>('latestFoodAnalysis', null);
  const [userProfile, _setUserProfile] = useLocalStorage<UserProfile>('userProfile', defaultProfile);
  const [scriptUrl, setScriptUrl] = useLocalStorage<string>('googleScriptUrl', DEFAULT_SCRIPT_URL);
  const [apiKey, setApiKey] = useLocalStorage<string>('geminiApiKey', DEFAULT_API_KEY);
  const [isDataSynced, setIsDataSynced] = useState(true);
  
  // Gamification State
  const [showLevelUp, setShowLevelUp] = useState<{ type: 'level' | 'badge', data: any } | null>(null);

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
    _setCalorieHistory([]);
    _setActivityHistory([]);
    _setSleepHistory([]);
    _setMoodHistory([]);
    _setHabitHistory([]);
    _setSocialHistory([]);
    _setEvaluationHistory([]);
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
          _setCalorieHistory(fetchedData.calorieHistory);
          _setActivityHistory(fetchedData.activityHistory);
          _setSleepHistory(fetchedData.sleepHistory);
          _setMoodHistory(fetchedData.moodHistory);
          _setHabitHistory(fetchedData.habitHistory);
          _setSocialHistory(fetchedData.socialHistory);
          _setEvaluationHistory(fetchedData.evaluationHistory);
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
    if (!currentUser) return;
    const newHistory = value instanceof Function ? value(bmiHistory) : value;
    _setBmiHistory(newHistory);
    // Allow UI updates for everyone
    if (scriptUrl && newHistory.length > 0 && currentUser.role !== 'admin') {
        saveDataToSheet(scriptUrl, 'bmiHistory', newHistory, currentUser);
    }
  }, [scriptUrl, _setBmiHistory, bmiHistory, currentUser]);
  
  const setTdeeHistory = useCallback((value: React.SetStateAction<TDEEHistoryEntry[]>) => {
    if (!currentUser) return;
    const newHistory = value instanceof Function ? value(tdeeHistory) : value;
    _setTdeeHistory(newHistory);
    if (scriptUrl && newHistory.length > 0 && currentUser.role !== 'admin') {
        saveDataToSheet(scriptUrl, 'tdeeHistory', newHistory, currentUser);
    }
  }, [scriptUrl, _setTdeeHistory, tdeeHistory, currentUser]);

  const setFoodHistory = useCallback((value: React.SetStateAction<FoodHistoryEntry[]>) => {
    if (!currentUser) return;
    const newHistory = value instanceof Function ? value(foodHistory) : value;
    _setFoodHistory(newHistory);
    if (scriptUrl && newHistory.length > 0 && currentUser.role !== 'admin') {
        saveDataToSheet(scriptUrl, 'foodHistory', newHistory, currentUser);
    }
  }, [scriptUrl, _setFoodHistory, foodHistory, currentUser]);
  
  const setPlannerHistory = useCallback((value: React.SetStateAction<PlannerHistoryEntry[]>) => {
    if (!currentUser) return;
    const newHistory = value instanceof Function ? value(plannerHistory) : value;
    _setPlannerHistory(newHistory);
    if (scriptUrl && newHistory.length > 0 && currentUser.role !== 'admin') {
        saveDataToSheet(scriptUrl, 'plannerHistory', newHistory, currentUser);
    }
  }, [scriptUrl, _setPlannerHistory, plannerHistory, currentUser]);

  const setWaterHistory = useCallback((value: React.SetStateAction<WaterHistoryEntry[]>) => {
    if (!currentUser) return;
    const newHistory = value instanceof Function ? value(waterHistory) : value;
    _setWaterHistory(newHistory);
    if (scriptUrl && newHistory.length > 0 && currentUser.role !== 'admin') {
        saveDataToSheet(scriptUrl, 'waterHistory', newHistory, currentUser);
    }
  }, [scriptUrl, _setWaterHistory, waterHistory, currentUser]);

  const setCalorieHistory = useCallback((value: React.SetStateAction<CalorieHistoryEntry[]>) => {
    if (!currentUser) return;
    const newHistory = value instanceof Function ? value(calorieHistory) : value;
    _setCalorieHistory(newHistory);
    if (scriptUrl && newHistory.length > 0 && currentUser.role !== 'admin') {
        saveDataToSheet(scriptUrl, 'calorieHistory', newHistory, currentUser);
    }
  }, [scriptUrl, _setCalorieHistory, calorieHistory, currentUser]);

  const setActivityHistory = useCallback((value: React.SetStateAction<ActivityHistoryEntry[]>) => {
    if (!currentUser) return;
    const newHistory = value instanceof Function ? value(activityHistory) : value;
    _setActivityHistory(newHistory);
    if (scriptUrl && newHistory.length > 0 && currentUser.role !== 'admin') {
        saveDataToSheet(scriptUrl, 'activityHistory', newHistory, currentUser);
    }
  }, [scriptUrl, _setActivityHistory, activityHistory, currentUser]);

  // --- Wellness Setters ---
  const setSleepHistory = useCallback((value: React.SetStateAction<SleepEntry[]>) => {
    if (!currentUser) return;
    const newHistory = value instanceof Function ? value(sleepHistory) : value;
    _setSleepHistory(newHistory);
    if (scriptUrl && newHistory.length > 0 && currentUser.role !== 'admin') {
        saveDataToSheet(scriptUrl, 'sleepHistory', newHistory, currentUser);
    }
  }, [scriptUrl, _setSleepHistory, sleepHistory, currentUser]);

  const setMoodHistory = useCallback((value: React.SetStateAction<MoodEntry[]>) => {
    if (!currentUser) return;
    const newHistory = value instanceof Function ? value(moodHistory) : value;
    _setMoodHistory(newHistory);
    if (scriptUrl && newHistory.length > 0 && currentUser.role !== 'admin') {
        saveDataToSheet(scriptUrl, 'moodHistory', newHistory, currentUser);
    }
  }, [scriptUrl, _setMoodHistory, moodHistory, currentUser]);

  const setHabitHistory = useCallback((value: React.SetStateAction<HabitEntry[]>) => {
    if (!currentUser) return;
    const newHistory = value instanceof Function ? value(habitHistory) : value;
    _setHabitHistory(newHistory);
    if (scriptUrl && newHistory.length > 0 && currentUser.role !== 'admin') {
        saveDataToSheet(scriptUrl, 'habitHistory', newHistory, currentUser);
    }
  }, [scriptUrl, _setHabitHistory, habitHistory, currentUser]);

  const setSocialHistory = useCallback((value: React.SetStateAction<SocialEntry[]>) => {
    if (!currentUser) return;
    const newHistory = value instanceof Function ? value(socialHistory) : value;
    _setSocialHistory(newHistory);
    if (scriptUrl && newHistory.length > 0 && currentUser.role !== 'admin') {
        saveDataToSheet(scriptUrl, 'socialHistory', newHistory, currentUser);
    }
  }, [scriptUrl, _setSocialHistory, socialHistory, currentUser]);

  // --- Evaluation Logic ---
  const saveEvaluation = useCallback((satisfaction: SatisfactionData, outcomes: OutcomeData) => {
      if (!currentUser) return;
      const newEntry: EvaluationEntry = {
          id: Date.now().toString(),
          date: new Date().toISOString(),
          satisfaction,
          outcomes
      };
      const newHistory = [newEntry, ...evaluationHistory];
      _setEvaluationHistory(newHistory);
      if (scriptUrl && currentUser.role !== 'admin') {
          saveDataToSheet(scriptUrl, 'evaluationHistory', newHistory, currentUser);
      }
  }, [currentUser, evaluationHistory, scriptUrl, _setEvaluationHistory]);

  // --- Clear Functions ---
  const clearBmiHistory = useCallback(() => {
    if (!currentUser) return;
    _setBmiHistory([]);
    if (scriptUrl && currentUser.role !== 'admin') clearHistoryInSheet(scriptUrl, 'bmiHistory', currentUser);
  }, [scriptUrl, _setBmiHistory, currentUser]);
  
  const clearTdeeHistory = useCallback(() => {
     if (!currentUser) return;
    _setTdeeHistory([]);
    if (scriptUrl && currentUser.role !== 'admin') clearHistoryInSheet(scriptUrl, 'tdeeHistory', currentUser);
  }, [scriptUrl, _setTdeeHistory, currentUser]);
  
  const clearFoodHistory = useCallback(() => {
     if (!currentUser) return;
    _setFoodHistory([]);
    if (scriptUrl && currentUser.role !== 'admin') clearHistoryInSheet(scriptUrl, 'foodHistory', currentUser);
  }, [scriptUrl, _setFoodHistory, currentUser]);

  const clearWaterHistory = useCallback(() => {
    if (!currentUser) return;
    _setWaterHistory([]);
    if (scriptUrl && currentUser.role !== 'admin') clearHistoryInSheet(scriptUrl, 'waterHistory', currentUser);
 }, [scriptUrl, _setWaterHistory, currentUser]);
 
  const clearCalorieHistory = useCallback(() => {
    if (!currentUser) return;
    _setCalorieHistory([]);
    if (scriptUrl && currentUser.role !== 'admin') clearHistoryInSheet(scriptUrl, 'calorieHistory', currentUser);
  }, [scriptUrl, _setCalorieHistory, currentUser]);

  const clearActivityHistory = useCallback(() => {
    if (!currentUser) return;
    _setActivityHistory([]);
    if (scriptUrl && currentUser.role !== 'admin') clearHistoryInSheet(scriptUrl, 'activityHistory', currentUser);
  }, [scriptUrl, _setActivityHistory, currentUser]);

  const clearWellnessHistory = useCallback(() => {
      if (!currentUser) return;
      _setSleepHistory([]);
      _setMoodHistory([]);
      _setHabitHistory([]);
      _setSocialHistory([]);
  }, [currentUser]);


  // --- Gamification Logic ---
  const gainXP = useCallback((amount: number) => {
    if (!currentUser || currentUser.role === 'guest') return;

    let currentXP = userProfile.xp || 0;
    let currentLevel = userProfile.level || 1;
    let currentBadges = userProfile.badges || ['novice'];
    
    const newXP = currentXP + amount;
    let newLevel = currentLevel;
    let leveledUp = false;
    let unlockedBadges: Achievement[] = [];

    // Check Level Up
    // Level 1 threshold is index 1 (100 XP)
    while (newLevel < LEVEL_THRESHOLDS.length - 1 && newXP >= LEVEL_THRESHOLDS[newLevel]) {
        newLevel++;
        leveledUp = true;
    }

    // Check Achievements
    const badgesToUnlock = [];

    // 1. Level Based
    if (newLevel >= 5 && !currentBadges.includes('level5')) badgesToUnlock.push('level5');
    if (newLevel >= 10 && !currentBadges.includes('master')) badgesToUnlock.push('master');

    // 2. Activity Based (Check history length + 1 for the current action)
    if (!currentBadges.includes('explorer') && (foodHistory.length + 1) >= 5) badgesToUnlock.push('explorer');
    if (!currentBadges.includes('hydrated') && (waterHistory.length + 1) >= 5) badgesToUnlock.push('hydrated'); // Simplified: 5 logs
    if (!currentBadges.includes('active') && (activityHistory.length + 1) >= 5) badgesToUnlock.push('active');
    if (!currentBadges.includes('mindful') && (moodHistory.length + 1) >= 5) badgesToUnlock.push('mindful');

    // Apply Updates
    const newBadges = [...currentBadges, ...badgesToUnlock];
    const updatedProfile = { ...userProfile, xp: newXP, level: newLevel, badges: newBadges };
    
    setUserProfile(updatedProfile, { displayName: currentUser.displayName, profilePicture: currentUser.profilePicture });

    // Trigger Modals
    if (leveledUp) {
        setShowLevelUp({ type: 'level', data: newLevel });
    } else if (badgesToUnlock.length > 0) {
        const badgeData = ACHIEVEMENTS.find(b => b.id === badgesToUnlock[0]);
        if (badgeData) setShowLevelUp({ type: 'badge', data: badgeData });
    }

  }, [userProfile, currentUser, foodHistory, waterHistory, activityHistory, moodHistory, setUserProfile]);

  const closeLevelUpModal = () => setShowLevelUp(null);

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
        calorieHistory, setCalorieHistory,
        activityHistory, setActivityHistory,
        sleepHistory, setSleepHistory,
        moodHistory, setMoodHistory,
        habitHistory, setHabitHistory,
        socialHistory, setSocialHistory,
        evaluationHistory, saveEvaluation,
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
        clearCalorieHistory,
        clearActivityHistory,
        clearWellnessHistory,
        gainXP,
        showLevelUp,
        closeLevelUpModal
    }}>
      {children}
    </AppContext.Provider>
  );
};
