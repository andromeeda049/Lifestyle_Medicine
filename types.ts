
import React from 'react';

export interface FoodItem {
  name: string;
  calories: number;
}

export interface LifestyleAnalysis {
  nutrition: string;
  physicalActivity: string;
  sleep: string;
  stress: string;
  substance: string;
  social: string;
  overallRisk: 'Low' | 'Medium' | 'High';
}

export interface NutrientInfo {
  calories: number;
  protein: number;
  carbohydrates: number;
  fat: number;
  sugar: number;
  sodium: number;
  saturatedFat: number;
  description: string;
  healthImpact: string;
  lifestyleAnalysis?: LifestyleAnalysis;
  items: FoodItem[];
}

export type AppView = 'home' | 'menu' | 'profile' | 'dashboard' | 'community' | 'bmi' | 'tdee' | 'food' | 'coach' | 'planner' | 'literacy' | 'settings' | 'adminDashboard' | 'water' | 'assessment' | 'calorieTracker' | 'activityTracker' | 'wellness' | 'gamificationRules' | 'about' | 'evaluation' | 'quiz';
export type Theme = 'light' | 'dark';

export interface User {
  username: string;
  displayName: string;
  profilePicture: string;
  role: 'user' | 'admin' | 'guest';
  email?: string;
  authProvider?: 'email' | 'google' | 'line' | 'telegram';
  organization?: string;
}

export interface PillarScore {
  nutrition: number;
  activity: number;
  sleep: number;
  stress: number;
  substance: number;
  social: number;
}

export interface Achievement {
    id: string;
    name: string;
    description: string;
    icon: string;
}

export interface UserProfile {
  gender: 'male' | 'female';
  age: string;
  weight: string;
  height: string;
  waist: string;
  hip: string;
  activityLevel: number;
  healthCondition: string;
  pillarScores?: PillarScore;
  xp?: number;
  level?: number;
  badges?: string[];
  email?: string;
  lineUserId?: string;
  telegramUserId?: string; // เพิ่มสำหรับ Telegram
  receiveDailyReminders?: boolean;
  organization?: string;
  researchId?: string;
  pdpaAccepted?: boolean;
  pdpaAcceptedDate?: string;
  streak?: number;
  lastLogDate?: string;
  aiSystemInstruction?: string;
}

export interface UserGamification {
    level: number;
    currentXP: number;
    nextLevelXP: number;
    progress: number;
}

export interface BMIHistoryEntry {
  value: number;
  category: string;
  date: string;
}

export interface TDEEHistoryEntry {
  value: number;
  bmr: number;
  date: string;
}

export interface FoodHistoryEntry {
  id: string;
  date: string;
  analysis: NutrientInfo;
}

export interface LocalFoodSuggestion {
  name: string;
  description: string;
  calories: number;
}

export interface PlannerResults {
  bmi: number;
  whr: number;
  whrRisk: string;
  bmr: number;
  tdee: number;
  proteinGoal: number;
  carbGoal: number;
  fatGoal: number;
}

export interface Meal {
  menu: string;
  protein: number;
  carbohydrate: number;
  fat: number;
  calories: number;
}

export interface LifestyleActivity {
  activity: string;
  duration: string;
  benefit: string;
  caloriesBurned?: number;
}

export interface MealPlanDay {
  day: string;
  breakfast: Meal;
  lunch: Meal;
  dinner: Meal;
  activities: LifestyleActivity[];
  dailyTotal: {
    protein: number;
    carbohydrate: number;
    fat: number;
    calories: number;
  };
}

export type MealPlan = MealPlanDay[];

export interface PlannerHistoryEntry {
  id: string;
  date: string;
  cuisine: string;
  diet: string;
  tdee: number;
  plan: MealPlan;
}

export interface WaterHistoryEntry {
    id: string;
    date: string;
    amount: number;
}

export interface CalorieHistoryEntry {
    id: string;
    date: string;
    name: string;
    calories: number;
}

export interface ActivityHistoryEntry {
    id: string;
    date: string;
    name: string;
    caloriesBurned: number;
}

export interface SleepEntry {
    id: string;
    date: string;
    bedTime: string;
    wakeTime: string;
    duration: number;
    quality: number;
    hygieneChecklist: string[];
}

export interface MoodEntry {
    id: string;
    date: string;
    moodEmoji: string;
    stressLevel: number;
    gratitude: string;
}

export interface HabitEntry {
    id: string;
    date: string;
    type: 'alcohol' | 'smoking' | 'chemicals' | 'accidents';
    amount: number;
    isClean: boolean;
}

export interface SocialEntry {
    id: string;
    date: string;
    interaction: string;
    feeling: 'energized' | 'neutral' | 'drained';
}

export type SpecialistId = 'general' | 'nutritionist' | 'trainer' | 'psychologist' | 'sleep_expert' | 'ncd_doctor';

export interface SatisfactionData {
    usability: number;
    features: number;
    benefit: number;
    overall: number;
    recommend: number;
}

export interface OutcomeData {
    nutrition: string;
    activity: string;
    sleep: string;
    stress: string;
    risk: string;
    overall: string;
}

export interface EvaluationEntry {
    id: string;
    date: string;
    satisfaction: SatisfactionData;
    outcomes: OutcomeData;
}

export interface QuizQuestion {
    id: number;
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
    category: 'nutrition' | 'activity' | 'sleep' | 'stress' | 'risk' | 'general';
}

export interface QuizEntry {
    id: string;
    date: string;
    score: number;
    totalQuestions: number;
    correctAnswers: number;
    type: 'pre-test' | 'post-test' | 'practice';
}

export interface NotificationState {
    show: boolean;
    message: string;
    type: 'success' | 'info' | 'warning';
}

export interface AppContextType {
  activeView: AppView;
  setActiveView: React.Dispatch<React.SetStateAction<AppView>>;
  currentUser: User | null;
  login: (user: User) => void;
  logout: () => void;
  theme: Theme;
  setTheme: React.Dispatch<React.SetStateAction<Theme>>;
  bmiHistory: BMIHistoryEntry[];
  setBmiHistory: React.Dispatch<React.SetStateAction<BMIHistoryEntry[]>>;
  tdeeHistory: TDEEHistoryEntry[];
  setTdeeHistory: React.Dispatch<React.SetStateAction<TDEEHistoryEntry[]>>;
  foodHistory: FoodHistoryEntry[];
  setFoodHistory: React.Dispatch<React.SetStateAction<FoodHistoryEntry[]>>;
  plannerHistory: PlannerHistoryEntry[];
  setPlannerHistory: React.Dispatch<React.SetStateAction<PlannerHistoryEntry[]>>;
  waterHistory: WaterHistoryEntry[];
  setWaterHistory: React.Dispatch<React.SetStateAction<WaterHistoryEntry[]>>;
  calorieHistory: CalorieHistoryEntry[];
  setCalorieHistory: React.Dispatch<React.SetStateAction<CalorieHistoryEntry[]>>;
  activityHistory: ActivityHistoryEntry[];
  setActivityHistory: React.Dispatch<React.SetStateAction<ActivityHistoryEntry[]>>;
  
  sleepHistory: SleepEntry[];
  setSleepHistory: React.Dispatch<React.SetStateAction<SleepEntry[]>>;
  moodHistory: MoodEntry[];
  setMoodHistory: React.Dispatch<React.SetStateAction<MoodEntry[]>>;
  habitHistory: HabitEntry[];
  setHabitHistory: React.Dispatch<React.SetStateAction<HabitEntry[]>>;
  socialHistory: SocialEntry[];
  setSocialHistory: React.Dispatch<React.SetStateAction<SocialEntry[]>>;

  evaluationHistory: EvaluationEntry[];
  saveEvaluation: (satisfaction: SatisfactionData, outcomes: OutcomeData) => void;
  quizHistory: QuizEntry[];
  saveQuizResult: (score: number, total: number, correct: number) => void;

  waterGoal: number;
  setWaterGoal: React.Dispatch<React.SetStateAction<number>>;
  latestFoodAnalysis: NutrientInfo | null;
  setLatestFoodAnalysis: React.Dispatch<React.SetStateAction<NutrientInfo | null>>;
  userProfile: UserProfile;
  setUserProfile: (profileData: UserProfile, accountData: { displayName: string; profilePicture: string; }) => void;
  scriptUrl: string;
  setScriptUrl: React.Dispatch<React.SetStateAction<string>>;
  apiKey: string;
  setApiKey: React.Dispatch<React.SetStateAction<string>>;
  isDataSynced: boolean;
  
  clearBmiHistory: () => void;
  clearTdeeHistory: () => void;
  clearFoodHistory: () => void;
  clearWaterHistory: () => void;
  clearCalorieHistory: () => void;
  clearActivityHistory: () => void;
  clearWellnessHistory: () => void;

  gainXP: (amount: number, category?: string) => void; // Updated signature
  showLevelUp: { type: 'level' | 'badge', data: any } | null;
  closeLevelUpModal: () => void;
  
  notification: NotificationState; // New notification state
  closeNotification: () => void;

  isSOSOpen: boolean;
  openSOS: () => void;
  closeSOS: () => void;
}
