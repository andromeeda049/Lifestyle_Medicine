
import React, { createContext, ReactNode, useState, useEffect, useCallback, useRef } from 'react';
import useLocalStorage from '../hooks/useLocalStorage';
import { AppView, BMIHistoryEntry, TDEEHistoryEntry, NutrientInfo, FoodHistoryEntry, UserProfile, Theme, PlannerHistoryEntry, WaterHistoryEntry, CalorieHistoryEntry, ActivityHistoryEntry, SleepEntry, MoodEntry, HabitEntry, SocialEntry, EvaluationEntry, QuizEntry, User, AppContextType, Achievement, SatisfactionData, OutcomeData } from '../types';
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
  receiveDailyReminders: true, // Default to true
  organization: 'general', // Default org
  streak: 0,
  lastLogDate: ''
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

  // Evaluation & Quiz State
  const [evaluationHistory, _setEvaluationHistory] = useLocalStorage<EvaluationEntry[]>('evaluationHistory', []);
  const [quizHistory, _setQuizHistory] = useLocalStorage<QuizEntry[]>('quizHistory', []);

  const [waterGoal, setWaterGoal] = useLocalStorage<number>('waterGoal', 2000);
  const [latestFoodAnalysis, setLatestFoodAnalysis] = useLocalStorage<NutrientInfo | null>('latestFoodAnalysis', null);
  const [userProfile, _setUserProfile] = useLocalStorage<UserProfile>('userProfile', defaultProfile);
  const [scriptUrl, setScriptUrl] = useLocalStorage<string>('googleScriptUrl', DEFAULT_SCRIPT_URL);
  const [apiKey, setApiKey] = useLocalStorage<string>('geminiApiKey', DEFAULT_API_KEY);
  const [isDataSynced, setIsDataSynced] = useState(true);
  
  // Gamification State
  const [showLevelUp, setShowLevelUp] = useState<{ type: 'level' | 'badge', data: any } | null>(null);

  // SOS & Tele-Support State
  const [isSOSOpen, setIsSOSOpen] = useState(false);
  const openSOS = () => setIsSOSOpen(true);
  const closeSOS = () => setIsSOSOpen(false);

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
    _setQuizHistory([]);
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
          _setQuizHistory(fetchedData.quizHistory || []);
        }
        setIsDataSynced(true);
      }
    };
    loadAllData();
  }, [scriptUrl, currentUser]);

  // --- Wrapper Functions for State Management ---
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
      }, [data, type]);
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
  useSyncToSheet(quizHistory, 'quizHistory');
  
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
      if (scriptUrl && currentUser.role !== 'admin') {
          saveDataToSheet(scriptUrl, 'evaluationHistory', [newEntry], currentUser);
      }
  }, [currentUser, scriptUrl, _setEvaluationHistory]);

  // Quiz Logic
  const saveQuizResult = useCallback((score: number, total: number, correct: number) => {
      if (!currentUser) return;
      
      const isPreTest = quizHistory.length === 0;
      
      const newEntry: QuizEntry = {
          id: Date.now().toString(),
          date: new Date().toISOString(),
          score,
          totalQuestions: total,
          correctAnswers: correct,
          type: isPreTest ? 'pre-test' : 'post-test'
      };
      
      _setQuizHistory(prev => [...prev, newEntry]); // Append to keep chronological order
      
      // Explicit sync for quiz
      if (scriptUrl && currentUser.role !== 'admin') {
          saveDataToSheet(scriptUrl, 'quizHistory', [newEntry], currentUser);
      }
  }, [currentUser, scriptUrl, _setQuizHistory, quizHistory]);

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
  }, [currentUser, _setSleepHistory, _setMoodHistory, _setHabitHistory, _setSocialHistory]);


  // --- Gamification Logic & Streak System ---
  const gainXP = useCallback((amount: number) => {
    if (!currentUser || currentUser.role === 'guest') return;

    _setUserProfile(currentProfile => {
        let currentXP = currentProfile.xp || 0;
        let currentLevel = currentProfile.level || 1;
        let currentBadges = currentProfile.badges || ['novice'];
        let currentStreak = currentProfile.streak || 0;
        let lastLog = currentProfile.lastLogDate;

        const todayStr = new Date().toDateString();
        
        if (lastLog !== todayStr) {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayStr = yesterday.toDateString();

            if (lastLog === yesterdayStr) {
                currentStreak += 1;
            } else {
                currentStreak = 1;
            }
        }
        
        const newXP = currentXP + amount;
        let newLevel = currentLevel;
        let leveledUp = false;
        
        while (newLevel < LEVEL_THRESHOLDS.length - 1 && newXP >= LEVEL_THRESHOLDS[newLevel]) {
            newLevel++;
            leveledUp = true;
        }

        // Check Achievements
        const badgesToUnlock = [];
        if (newLevel >= 5 && !currentBadges.includes('level5')) badgesToUnlock.push('level5');
        if (newLevel >= 10 && !currentBadges.includes('master')) badgesToUnlock.push('master');
        
        if (!currentBadges.includes('explorer') && (foodHistory.length) >= 4) badgesToUnlock.push('explorer');
        if (!currentBadges.includes('hydrated') && (waterHistory.length) >= 4) badgesToUnlock.push('hydrated');
        if (!currentBadges.includes('active') && (activityHistory.length) >= 4) badgesToUnlock.push('active');
        if (!currentBadges.includes('mindful') && (moodHistory.length) >= 4) badgesToUnlock.push('mindful');
        
        // Quiz achievement check happens here if we want, but usually on quiz completion
        if (!currentBadges.includes('scholar') && quizHistory.some(q => q.score >= 80)) badgesToUnlock.push('scholar');

        const newBadges = [...currentBadges, ...badgesToUnlock];
        
        if (leveledUp) {
            setShowLevelUp({ type: 'level', data: newLevel });
        } else if (badgesToUnlock.length > 0) {
            const badgeData = ACHIEVEMENTS.find(b => b.id === badgesToUnlock[0]);
            if (badgeData) setShowLevelUp({ type: 'badge', data: badgeData });
        }

        const updatedProfile = { 
            ...currentProfile, 
            xp: newXP, 
            level: newLevel, 
            badges: newBadges,
            streak: currentStreak,
            lastLogDate: todayStr
        };
        
        if (scriptUrl && currentUser.role !== 'admin') {
             saveDataToSheet(scriptUrl, 'profile', updatedProfile, currentUser);
        }

        return updatedProfile;
    });

  }, [currentUser, foodHistory, waterHistory, activityHistory, moodHistory, quizHistory, scriptUrl, _setUserProfile]);

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
        quizHistory, saveQuizResult,
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
        closeLevelUpModal,
        isSOSOpen, openSOS, closeSOS
    }}>
      {children}
    </AppContext.Provider>
  );
};
