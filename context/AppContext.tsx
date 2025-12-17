
import React, { createContext, ReactNode, useState, useEffect, useCallback, useRef } from 'react';
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

  // --- Wrapper Functions for State Management ---
  // Note: We now use useLocalStorage directly for setters to leverage the fixed functional updates.
  // Syncing to Google Sheets is handled by useEffects below to avoid race conditions.

  const setUserProfile = useCallback((profileData: UserProfile, accountData: { displayName: string; profilePicture: string; }) => {
    if (!currentUser) return;
    const updatedUser = {
        ...currentUser,
        displayName: accountData.displayName,
        profilePicture: accountData.profilePicture
    };
    setCurrentUser(updatedUser);
    _setUserProfile(profileData);
    
    // Profile is usually a single update, safe to sync directly or via effect. 
    // Keeping direct for profile as it's not an array append operation.
    if (scriptUrl) {
        saveDataToSheet(scriptUrl, 'profile', profileData, updatedUser);
    }
  }, [scriptUrl, currentUser, setCurrentUser, _setUserProfile]);

  const setBmiHistory = _setBmiHistory;
  const setTdeeHistory = _setTdeeHistory;
  const setFoodHistory = _setFoodHistory;
  const setPlannerHistory = _setPlannerHistory;
  const setWaterHistory = _setWaterHistory;
  const setCalorieHistory = _setCalorieHistory;
  const setActivityHistory = _setActivityHistory;
  const setSleepHistory = _setSleepHistory;
  const setMoodHistory = _setMoodHistory;
  const setHabitHistory = _setHabitHistory;
  const setSocialHistory = _setSocialHistory;

  // --- Sync Effects (Save to Sheets when state changes) ---
  // Using a helper to prevent saving on initial load (when isDataSynced is false)
  const useSyncToSheet = (data: any, type: string) => {
      const isFirstRun = useRef(true);
      useEffect(() => {
          if (isFirstRun.current) {
              isFirstRun.current = false;
              return;
          }
          if (isDataSynced && scriptUrl && currentUser && currentUser.role !== 'admin' && data.length > 0) {
              saveDataToSheet(scriptUrl, type, data, currentUser);
          }
      }, [data, type]); // Dependencies: data updates trigger save
  };

  useSyncToSheet(bmiHistory, 'bmiHistory');
  useSyncToSheet(tdeeHistory, 'tdeeHistory');
  useSyncToSheet(foodHistory, 'foodHistory');
  useSyncToSheet(plannerHistory, 'plannerHistory');
  useSyncToSheet(waterHistory, 'waterHistory');
  useSyncToSheet(calorieHistory, 'calorieHistory');
  useSyncToSheet(activityHistory, 'activityHistory');
  useSyncToSheet(sleepHistory, 'sleepHistory');
  useSyncToSheet(moodHistory, 'moodHistory');
  useSyncToSheet(habitHistory, 'habitHistory');
  useSyncToSheet(socialHistory, 'socialHistory');
  
  // Evaluation Logic
  const saveEvaluation = useCallback((satisfaction: SatisfactionData, outcomes: OutcomeData) => {
      if (!currentUser) return;
      const newEntry: EvaluationEntry = {
          id: Date.now().toString(),
          date: new Date().toISOString(),
          satisfaction,
          outcomes
      };
      _setEvaluationHistory(prev => [newEntry, ...prev]);
      // Explicit save for evaluation as it's a one-off event usually
      if (scriptUrl && currentUser.role !== 'admin') {
          saveDataToSheet(scriptUrl, 'evaluationHistory', [newEntry], currentUser);
      }
  }, [currentUser, scriptUrl, _setEvaluationHistory]);

  // --- Clear Functions ---
  const clearHistory = useCallback((type: string, setter: any) => {
      if (!currentUser) return;
      setter([]);
      if (scriptUrl && currentUser.role !== 'admin') clearHistoryInSheet(scriptUrl, type, currentUser);
  }, [currentUser, scriptUrl]);

  const clearBmiHistory = () => clearHistory('bmiHistory', _setBmiHistory);
  const clearTdeeHistory = () => clearHistory('tdeeHistory', _setTdeeHistory);
  const clearFoodHistory = () => clearHistory('foodHistory', _setFoodHistory);
  const clearWaterHistory = () => clearHistory('waterHistory', _setWaterHistory);
  const clearCalorieHistory = () => clearHistory('calorieHistory', _setCalorieHistory);
  const clearActivityHistory = () => clearHistory('activityHistory', _setActivityHistory);
  const clearWellnessHistory = useCallback(() => {
      if (!currentUser) return;
      _setSleepHistory([]);
      _setMoodHistory([]);
      _setHabitHistory([]);
      _setSocialHistory([]);
      // Not clearing sheet for all wellness at once to avoid complexity, user can clear individually if needed or we add a bulk clear endpoint later
  }, [currentUser, _setSleepHistory, _setMoodHistory, _setHabitHistory, _setSocialHistory]);


  // --- Gamification Logic ---
  const gainXP = useCallback((amount: number) => {
    if (!currentUser || currentUser.role === 'guest') return;

    // Use functional update to ensure we are working with the absolute latest profile state
    _setUserProfile(currentProfile => {
        let currentXP = currentProfile.xp || 0;
        let currentLevel = currentProfile.level || 1;
        let currentBadges = currentProfile.badges || ['novice'];
        
        const newXP = currentXP + amount;
        let newLevel = currentLevel;
        let leveledUp = false;
        
        // Check Level Up
        while (newLevel < LEVEL_THRESHOLDS.length - 1 && newXP >= LEVEL_THRESHOLDS[newLevel]) {
            newLevel++;
            leveledUp = true;
        }

        // Check Achievements (Note: This relies on history states. 
        // In a perfect world we'd pass history into this calc, but reading from closure is generally ok for gamification non-critical consistency)
        const badgesToUnlock = [];
        if (newLevel >= 5 && !currentBadges.includes('level5')) badgesToUnlock.push('level5');
        if (newLevel >= 10 && !currentBadges.includes('master')) badgesToUnlock.push('master');
        
        // Simple counters based on current session/loaded history to avoid heavy recalculation
        if (!currentBadges.includes('explorer') && (foodHistory.length) >= 4) badgesToUnlock.push('explorer'); // +1 current
        if (!currentBadges.includes('hydrated') && (waterHistory.length) >= 4) badgesToUnlock.push('hydrated');
        if (!currentBadges.includes('active') && (activityHistory.length) >= 4) badgesToUnlock.push('active');
        if (!currentBadges.includes('mindful') && (moodHistory.length) >= 4) badgesToUnlock.push('mindful');

        const newBadges = [...currentBadges, ...badgesToUnlock];
        
        // Trigger Modals (Side Effect)
        if (leveledUp) {
            setShowLevelUp({ type: 'level', data: newLevel });
        } else if (badgesToUnlock.length > 0) {
            const badgeData = ACHIEVEMENTS.find(b => b.id === badgesToUnlock[0]);
            if (badgeData) setShowLevelUp({ type: 'badge', data: badgeData });
        }

        const updatedProfile = { ...currentProfile, xp: newXP, level: newLevel, badges: newBadges };
        
        // Sync profile to sheet
        if (scriptUrl && currentUser.role !== 'admin') {
             saveDataToSheet(scriptUrl, 'profile', updatedProfile, currentUser);
        }

        return updatedProfile;
    });

  }, [currentUser, foodHistory, waterHistory, activityHistory, moodHistory, scriptUrl, _setUserProfile]);

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
