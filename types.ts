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
  sugar: number; // Added for NCD
  sodium: number; // Added for NCD
  saturatedFat: number; // Added for NCD
  description: string;
  healthImpact: string; // Added for Lifestyle Medicine assessment
  lifestyleAnalysis?: LifestyleAnalysis; // Added for 6-pillar deep dive
  items: FoodItem[];
}

export type AppView = 'home' | 'profile' | 'dashboard' | 'bmi' | 'tdee' | 'food' | 'coach' | 'planner' | 'literacy' | 'settings' | 'adminDashboard' | 'water' | 'assessment' | 'calorieTracker' | 'activityTracker';
export type Theme = 'light' | 'dark';

export interface User {
  username: string;
  displayName: string;
  profilePicture: string;
  role: 'user' | 'admin' | 'guest';
}

export interface PillarScore {
  nutrition: number;
  activity: number;
  sleep: number;
  stress: number;
  substance: number;
  social: number;
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
  pillarScores?: PillarScore; // Added for Lifestyle Balance Graph
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

// Types for Personalized Planner
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
  benefit: string; // e.g., "Reduces stress", "Improves sleep"
  caloriesBurned?: number;
}

export interface MealPlanDay {
  day: string;
  breakfast: Meal;
  lunch: Meal;
  dinner: Meal;
  activities: LifestyleActivity[]; // Added for Lifestyle Planner
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
    date: string; // ISO String
    amount: number; // ml
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

export type SpecialistId = 'general' | 'nutritionist' | 'trainer' | 'psychologist' | 'sleep_expert' | 'ncd_doctor';

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
}