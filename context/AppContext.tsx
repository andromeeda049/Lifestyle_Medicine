
import React, { createContext, ReactNode, useState, useEffect, useCallback, useRef } from 'react';
import useLocalStorage from '../hooks/useLocalStorage';
import { AppView, BMIHistoryEntry, TDEEHistoryEntry, NutrientInfo, FoodHistoryEntry, UserProfile, Theme, PlannerHistoryEntry, WaterHistoryEntry, CalorieHistoryEntry, ActivityHistoryEntry, SleepEntry, MoodEntry, HabitEntry, SocialEntry, EvaluationEntry, QuizEntry, User, AppContextType, SatisfactionData, OutcomeData, NotificationState } from '../types';
import { PLANNER_ACTIVITY_LEVELS, HEALTH_CONDITIONS, LEVEL_THRESHOLDS, ACHIEVEMENTS, GAMIFICATION_LIMITS, XP_VALUES } from '../constants';
import { fetchAllDataFromSheet, saveDataToSheet, clearHistoryInSheet } from '../services/googleSheetService';

const DEFAULT_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbx6e8zDxmmoZWg2iW_oQHlpfqWZrpS-2Vkq9aFPlnW5MVdGPf8_-yaEJ7iugtdAWvJT/exec';

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
  badges: ['novice'],
  receiveDailyReminders: true,
  organization: '', 
  streak: 0,
  lastLogDate: '',
  aiSystemInstruction: ''
};

const getInitialTheme = (): Theme => {
    if (typeof window !== 'undefined') {
        const storedTheme = window.localStorage.getItem('theme');
        if (storedTheme === 'dark' || storedTheme === 'light') return storedTheme;
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
};

export const AppContext = createContext<AppContextType>({} as AppContextType);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const initialUrlParams = useRef(new URLSearchParams(typeof window !== 'undefined' ? window.location.search : ''));

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
  const [sleepHistory, _setSleepHistory] = useLocalStorage<SleepEntry[]>('sleepHistory', []);
  const [moodHistory, _setMoodHistory] = useLocalStorage<MoodEntry[]>('moodHistory', []);
  const [habitHistory, _setHabitHistory] = useLocalStorage<HabitEntry[]>('habitHistory', []);
  const [socialHistory, _setSocialHistory] = useLocalStorage<SocialEntry[]>('socialHistory', []);
  const [evaluationHistory, _setEvaluationHistory] = useLocalStorage<EvaluationEntry[]>('evaluationHistory', []);
  const [quizHistory, _setQuizHistory] = useLocalStorage<QuizEntry[]>('quizHistory', []);
  const [waterGoal, setWaterGoal] = useLocalStorage<number>('waterGoal', 2000);
  const [latestFoodAnalysis, setLatestFoodAnalysis] = useLocalStorage<NutrientInfo | null>('latestFoodAnalysis', null);
  const [userProfile, _setUserProfile] = useLocalStorage<UserProfile>('userProfile', defaultProfile);
  const [scriptUrl, setScriptUrl] = useLocalStorage<string>('googleScriptUrl', DEFAULT_SCRIPT_URL);
  const [isDataSynced, setIsDataSynced] = useState(true);
  const [showLevelUp, setShowLevelUp] = useState<{ type: 'level' | 'badge', data: any } | null>(null);
  const [isSOSOpen, setIsSOSOpen] = useState(false);
  const [notification, setNotification] = useState<NotificationState>({ show: false, message: '', type: 'info' });

  useEffect(() => {
    if (theme === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [theme]);

  const login = (user: User) => {
    setCurrentUser(user);
    _setUserProfile(defaultProfile);
    _setBmiHistory([]); _setTdeeHistory([]); _setFoodHistory([]); _setPlannerHistory([]);
    _setWaterHistory([]); _setCalorieHistory([]); _setActivityHistory([]); _setSleepHistory([]);
    _setMoodHistory([]); _setHabitHistory([]); _setSocialHistory([]); _setEvaluationHistory([]);
    _setQuizHistory([]); setLatestFoodAnalysis(null); 
    
    const currentParams = new URLSearchParams(window.location.search);
    let viewParam = currentParams.get('view');

    if (!viewParam) {
        viewParam = initialUrlParams.current.get('view');
    }

    if (viewParam) {
        setActiveView(viewParam as AppView);
    } else {
        setActiveView('home');
    }
  };

  const logout = () => { setCurrentUser(null); setActiveView('home'); };

  useEffect(() => {
    const loadAllData = async () => {
      if (scriptUrl && currentUser && currentUser.role === 'user') {
        setIsDataSynced(false);
        const fetchedData = await fetchAllDataFromSheet(scriptUrl, currentUser);
        if (fetchedData) {
          _setUserProfile(prev => {
              const cloudProfile = fetchedData.profile || defaultProfile;
              return {
                  ...cloudProfile,
                  pdpaAccepted: cloudProfile.pdpaAccepted || prev.pdpaAccepted,
                  pdpaAcceptedDate: cloudProfile.pdpaAcceptedDate || prev.pdpaAcceptedDate,
                  organization: cloudProfile.organization || '', 
                  aiSystemInstruction: cloudProfile.aiSystemInstruction || prev.aiSystemInstruction
              };
          });
          
          _setBmiHistory(fetchedData.bmiHistory); _setTdeeHistory(fetchedData.tdeeHistory);
          _setFoodHistory(fetchedData.foodHistory); _setPlannerHistory(fetchedData.plannerHistory);
          _setWaterHistory(fetchedData.waterHistory); _setCalorieHistory(fetchedData.calorieHistory);
          _setActivityHistory(fetchedData.activityHistory); _setSleepHistory(fetchedData.sleepHistory);
          _setMoodHistory(fetchedData.moodHistory); _setHabitHistory(fetchedData.habitHistory);
          _setSocialHistory(fetchedData.socialHistory); _setEvaluationHistory(fetchedData.evaluationHistory);
          _setQuizHistory(fetchedData.quizHistory || []);
        }
        setIsDataSynced(true);
      }
    };
    loadAllData();
  }, [scriptUrl, currentUser?.username]);

  const setUserProfile = useCallback((profileData: UserProfile, accountData: { displayName: string; profilePicture: string; }) => {
    if (!currentUser) return;
    const updatedUser = { 
        ...currentUser, 
        displayName: accountData.displayName, 
        profilePicture: accountData.profilePicture 
    };
    
    if (profileData.organization) {
        updatedUser.organization = profileData.organization;
    }

    setCurrentUser(updatedUser); 
    _setUserProfile(profileData);
    
    if (scriptUrl) {
        saveDataToSheet(scriptUrl, 'profile', profileData, updatedUser).catch(err => console.error("Profile sync failed", err));
    }
  }, [scriptUrl, currentUser, setCurrentUser, _setUserProfile]);

  const useSyncToSheet = (data: any, type: string) => {
      const isFirstRun = useRef(true);
      useEffect(() => {
          if (isFirstRun.current) { isFirstRun.current = false; return; }
          if (isDataSynced && scriptUrl && currentUser && currentUser.role !== 'admin' && data.length > 0) {
              saveDataToSheet(scriptUrl, type, data, currentUser);
          }
      }, [data, type]);
  };

  useSyncToSheet(bmiHistory, 'bmiHistory'); useSyncToSheet(tdeeHistory, 'tdeeHistory'); useSyncToSheet(foodHistory, 'foodHistory');
  useSyncToSheet(plannerHistory, 'plannerHistory'); useSyncToSheet(waterHistory, 'waterHistory'); useSyncToSheet(calorieHistory, 'calorieHistory');
  useSyncToSheet(activityHistory, 'activityHistory'); useSyncToSheet(sleepHistory, 'sleepHistory'); useSyncToSheet(moodHistory, 'moodHistory');
  useSyncToSheet(habitHistory, 'habitHistory'); useSyncToSheet(socialHistory, 'socialHistory'); useSyncToSheet(quizHistory, 'quizHistory');
  
  const saveEvaluation = (satisfaction: SatisfactionData, outcomes: OutcomeData) => {
      if (!currentUser) return;
      const newEntry: EvaluationEntry = { id: Date.now().toString(), date: new Date().toISOString(), satisfaction, outcomes };
      _setEvaluationHistory(prev => [newEntry, ...prev]);
      if (scriptUrl && currentUser.role !== 'admin') saveDataToSheet(scriptUrl, 'evaluationHistory', [newEntry], currentUser);
  };

  const saveQuizResult = (score: number, total: number, correct: number) => {
      if (!currentUser) return;
      const newEntry: QuizEntry = { id: Date.now().toString(), date: new Date().toISOString(), score, totalQuestions: total, correctAnswers: correct, type: quizHistory.length === 0 ? 'pre-test' : 'post-test' };
      _setQuizHistory(prev => [...prev, newEntry]);
      if (scriptUrl && currentUser.role !== 'admin') saveDataToSheet(scriptUrl, 'quizHistory', [newEntry], currentUser);
  };

  const showToast = (message: string, type: 'success' | 'info' | 'warning') => {
      setNotification({ show: true, message, type });
      setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 3000);
  };

  const getHistoryForCategory = (category: string) => {
      switch(category) {
          case 'WATER': return waterHistory;
          case 'FOOD': return foodHistory;
          case 'CALORIE': return calorieHistory;
          case 'EXERCISE': return activityHistory;
          case 'SLEEP': return sleepHistory;
          case 'MOOD': return moodHistory;
          case 'WELLNESS': return [...habitHistory, ...socialHistory].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          case 'PLANNER': return plannerHistory;
          case 'QUIZ': return quizHistory;
          default: return [];
      }
  };

  // --- NEW: Check Daily Mission Bonus ---
  const checkDailyMissionBonus = (updatedProfile: UserProfile, todayStr: string) => {
      const hasWater = waterHistory.some(h => new Date(h.date).toDateString() === todayStr);
      const hasFood = calorieHistory.some(h => new Date(h.date).toDateString() === todayStr) || foodHistory.some(h => new Date(h.date).toDateString() === todayStr);
      const hasActivity = activityHistory.some(h => new Date(h.date).toDateString() === todayStr);
      const hasMind = moodHistory.some(h => new Date(h.date).toDateString() === todayStr) || sleepHistory.some(h => new Date(h.date).toDateString() === todayStr);

      const bonusKey = `daily_bonus_${todayStr}`;
      const hasClaimed = localStorage.getItem(bonusKey);

      if (!hasClaimed && hasWater && hasFood && hasActivity && hasMind) {
          localStorage.setItem(bonusKey, 'true');
          const bonusXP = XP_VALUES.DAILY_BONUS;
          
          showToast(`🎉 ภารกิจครบ! รับโบนัส +${bonusXP} XP`, 'success');
          
          // Return updated profile with bonus
          return {
              ...updatedProfile,
              xp: (updatedProfile.xp || 0) + bonusXP
          };
      }
      return updatedProfile;
  };

  const gainXP = useCallback((amount: number, category?: string) => {
    if (!currentUser || currentUser.role === 'guest') return;

    let finalAmount = amount;

    // --- REVISED LOGIC: CAP XP BUT ALLOW ACTION ---
    if (category && GAMIFICATION_LIMITS[category]) {
        const rules = GAMIFICATION_LIMITS[category];
        const history = getHistoryForCategory(category);
        const todayStr = new Date().toDateString();

        const todayEntries = history.filter(entry => new Date(entry.date).toDateString() === todayStr);
        
        // Note: The history state hasn't updated yet when this is called in some components (React Batching), 
        // so we check if todayEntries.length is already >= maxPerDay.
        // Actually, most trackers call setHistory first, so todayEntries MIGHT include the current one if looking at context.
        // But to be safe and consistent with "Next Action", we allow the action to proceed (state updated in component)
        // but here we decide if we award XP.
        
        // If user has ALREADY reached the limit before this new action
        if (todayEntries.length >= rules.maxPerDay) {
            // Cap XP to 0 for this action, but acknowledge the save
            finalAmount = 0;
            showToast(`บันทึกสำเร็จ (ครบโควตา XP ของวันแล้ว)`, 'info');
        }
    }

    _setUserProfile(currentProfile => {
        let currentXP = currentProfile.xp || 0; 
        let currentLevel = currentProfile.level || 1;
        let currentBadges = currentProfile.badges || ['novice']; 
        let currentStreak = currentProfile.streak || 0;
        const todayStr = new Date().toDateString();
        
        // Streak Logic
        if (currentProfile.lastLogDate !== todayStr) {
            const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
            const isConsecutive = (currentProfile.lastLogDate === yesterday.toDateString());
            currentStreak = isConsecutive ? currentStreak + 1 : 1;
        }
        
        // Add XP
        let newXP = currentXP + finalAmount; 
        
        // Calculate Level
        let newLevel = currentLevel;
        while (newLevel < LEVEL_THRESHOLDS.length - 1 && newXP >= LEVEL_THRESHOLDS[newLevel]) newLevel++;
        
        // Unlocks
        const badgesToUnlock = [];
        if (newLevel >= 5 && !currentBadges.includes('level5')) badgesToUnlock.push('level5');
        if (newLevel >= 10 && !currentBadges.includes('master')) badgesToUnlock.push('master');
        const newBadges = [...currentBadges, ...badgesToUnlock];
        
        if (newLevel > currentLevel) setShowLevelUp({ type: 'level', data: newLevel });
        
        let updatedProfile: UserProfile = { ...currentProfile, xp: newXP, level: newLevel, badges: newBadges, streak: currentStreak, lastLogDate: todayStr };
        
        // Check Daily Bonus (If amount > 0, meaning it's a valid action)
        if (amount > 0) {
             updatedProfile = checkDailyMissionBonus(updatedProfile, todayStr);
        }

        if (scriptUrl && currentUser.role !== 'admin') saveDataToSheet(scriptUrl, 'profile', updatedProfile, currentUser);
        
        if (finalAmount > 0) {
            showToast(`+${finalAmount} XP! (รวม ${updatedProfile.xp})`, 'success');
        }
        
        return updatedProfile;
    });
  }, [currentUser, scriptUrl, _setUserProfile, waterHistory, foodHistory, calorieHistory, activityHistory, sleepHistory, moodHistory, habitHistory, socialHistory, plannerHistory, quizHistory]);

  return (
    <AppContext.Provider value={{ 
        activeView, setActiveView, currentUser, login, logout, theme, setTheme,
        bmiHistory, setBmiHistory: _setBmiHistory, tdeeHistory, setTdeeHistory: _setTdeeHistory,
        foodHistory, setFoodHistory: _setFoodHistory, plannerHistory, setPlannerHistory: _setPlannerHistory,
        waterHistory, setWaterHistory: _setWaterHistory, calorieHistory, setCalorieHistory: _setCalorieHistory,
        activityHistory, setActivityHistory: _setActivityHistory, sleepHistory, setSleepHistory: _setSleepHistory,
        moodHistory, setMoodHistory: _setMoodHistory, habitHistory, setHabitHistory: _setHabitHistory,
        socialHistory, setSocialHistory: _setSocialHistory, evaluationHistory, saveEvaluation, quizHistory, saveQuizResult,
        waterGoal, setWaterGoal, latestFoodAnalysis, setLatestFoodAnalysis, userProfile, setUserProfile,
        scriptUrl, setScriptUrl, apiKey: '', setApiKey: () => {}, isDataSynced,
        clearBmiHistory: () => { _setBmiHistory([]); if (scriptUrl && currentUser) clearHistoryInSheet(scriptUrl, 'bmiHistory', currentUser); },
        clearTdeeHistory: () => { _setTdeeHistory([]); if (scriptUrl && currentUser) clearHistoryInSheet(scriptUrl, 'tdeeHistory', currentUser); },
        clearFoodHistory: () => { _setFoodHistory([]); if (scriptUrl && currentUser) clearHistoryInSheet(scriptUrl, 'foodHistory', currentUser); },
        clearWaterHistory: () => { _setWaterHistory([]); if (scriptUrl && currentUser) clearHistoryInSheet(scriptUrl, 'waterHistory', currentUser); },
        clearCalorieHistory: () => { _setCalorieHistory([]); if (scriptUrl && currentUser) clearHistoryInSheet(scriptUrl, 'calorieHistory', currentUser); },
        clearActivityHistory: () => { _setActivityHistory([]); if (scriptUrl && currentUser) clearHistoryInSheet(scriptUrl, 'activityHistory', currentUser); },
        clearWellnessHistory: () => { _setSleepHistory([]); _setMoodHistory([]); _setHabitHistory([]); _setSocialHistory([]); },
        gainXP, showLevelUp, closeLevelUpModal: () => setShowLevelUp(null),
        isSOSOpen, openSOS: () => setIsSOSOpen(true), closeSOS: () => setIsSOSOpen(false),
        notification, closeNotification: () => setNotification(prev => ({ ...prev, show: false }))
    }}>
      {children}
    </AppContext.Provider>
  );
};
