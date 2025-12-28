
import React, { useState, useContext, useEffect, useRef, useMemo } from 'react';
import BMICalculator from './components/BMICalculator';
import TDEECalculator from './components/TDEECalculator';
import FoodAnalyzer from './components/FoodAnalyzer';
import Dashboard from './components/Dashboard';
import AICoach from './components/AICoach';
import PersonalizedPlanner from './components/PersonalizedPlanner';
import HomeMenu from './components/HomeMenu';
import UserProfile from './components/UserProfile';
import NutritionLiteracy from './components/NutritionLiteracy';
import Settings from './components/Settings';
import Auth from './components/Auth';
import AdminDashboard from './components/AdminDashboard';
import WaterTracker from './components/WaterTracker';
import LifestyleAssessment from './components/LifestyleAssessment';
import CalorieTracker from './components/CalorieTracker';
import ActivityTracker from './components/ActivityTracker';
import WellnessCheckin from './components/WellnessCheckin';
import GamificationRules from './components/GamificationRules';
import AboutApp from './components/AboutApp';
import EvaluationForm from './components/EvaluationForm';
import HealthLiteracyQuiz from './components/HealthLiteracyQuiz';
import PDPAModal from './components/PDPAModal';
import OrganizationModal from './components/OrganizationModal';
import SOSModal from './components/SOSModal';
import LevelUpModal from './components/LevelUpModal';
import Community from './components/Community';
import XPHistory from './components/XPHistory'; // Import New Component
import { AppProvider, AppContext } from './context/AppContext';
import { AppView, User, WaterHistoryEntry } from './types';
import { HomeIcon, ScaleIcon, FireIcon, CameraIcon, SparklesIcon, ClipboardListIcon, MenuIcon, XIcon, SquaresIcon, UserCircleIcon, BookOpenIcon, SunIcon, MoonIcon, CogIcon, LogoutIcon, WaterDropIcon, ClipboardDocumentCheckIcon, BeakerIcon, BoltIcon, HeartIcon, QuestionMarkCircleIcon, StarIcon, InformationCircleIcon, ClipboardCheckIcon, BellIcon, UserGroupIcon, PhoneIcon, TrophyIcon } from './components/icons';
import { sendMissionCompleteNotification, saveDataToSheet } from './services/googleSheetService';
import { GoogleOAuthProvider } from '@react-oauth/google';
import useLocalStorage from './hooks/useLocalStorage';
import { XP_VALUES } from './constants';

const GOOGLE_CLIENT_ID = "968529250528-sp2uu4uu05peu6tvc2frpug7tfq3s5dg.apps.googleusercontent.com";

const SOSButton: React.FC = () => {
    const { openSOS } = useContext(AppContext);
    return (
        <button
            onClick={openSOS}
            className="fixed bottom-24 right-4 z-40 bg-red-600 hover:bg-red-700 text-white p-4 rounded-full shadow-2xl transition-all hover:scale-110 active:scale-95 animate-pulse"
            aria-label="SOS Emergency"
        >
            <PhoneIcon className="w-6 h-6" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
        </button>
    );
};

const ToastNotification: React.FC = () => {
    const { notification, closeNotification } = useContext(AppContext);
    
    if (!notification.show) return null;

    const bgColors = {
        success: 'bg-green-500',
        info: 'bg-blue-500',
        warning: 'bg-orange-500'
    };

    const icons = {
        success: '🎉',
        info: 'ℹ️',
        warning: '⏳'
    };

    return (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-[100] animate-fade-in-down w-[90%] max-w-sm">
            <div className={`${bgColors[notification.type]} text-white px-6 py-3 rounded-full shadow-lg flex items-center justify-between`}>
                <div className="flex items-center gap-3">
                    <span className="text-xl">{icons[notification.type]}</span>
                    <span className="text-sm font-bold">{notification.message}</span>
                </div>
                <button onClick={closeNotification} className="ml-4 text-white hover:text-gray-200">
                    <XIcon className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};

const AppContent: React.FC = () => {
  const { activeView, setActiveView, theme, setTheme, currentUser, logout, userProfile, setUserProfile, waterHistory, foodHistory, calorieHistory, activityHistory, moodHistory, sleepHistory, scriptUrl, setWaterHistory, gainXP, isSOSOpen, closeSOS, showLevelUp, closeLevelUpModal } = useContext(AppContext);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isQuickActionOpen, setIsQuickActionOpen] = useState(false);
  const [showPDPA, setShowPDPA] = useState(false);
  const [showOrgModal, setShowOrgModal] = useState(false);
  
  const notificationRef = useRef<HTMLDivElement>(null);
  const [lastMissionCompleteDate, setLastMissionCompleteDate] = useLocalStorage<string>('lastMissionCompleteDate', '');
  
  // URL Parameter Handling
  useEffect(() => {
      const params = new URLSearchParams(window.location.search);
      const viewParam = params.get('view');
      const actionParam = params.get('action');

      if (viewParam) {
          setActiveView(viewParam as AppView);
      }

      if (actionParam === 'quick') {
          setIsQuickActionOpen(true);
      }
  }, [setActiveView]);

  // Check PDPA & Organization Status on Load
  useEffect(() => {
      if (currentUser && currentUser.role !== 'guest' && currentUser.role !== 'admin') {
          // 1. Check PDPA First
          if (userProfile && !userProfile.pdpaAccepted) {
              setShowPDPA(true);
              setShowOrgModal(false); 
          } 
          // 2. Check Organization (Only if PDPA accepted)
          else if (userProfile && (!userProfile.organization || userProfile.organization === '')) {
              setShowOrgModal(true);
          } else {
              setShowOrgModal(false);
          }
      }
  }, [currentUser, userProfile]);

  const handlePDPAAccept = () => {
      if (!currentUser) return;
      
      const updatedProfile = { 
          ...userProfile, 
          pdpaAccepted: true, 
          pdpaAcceptedDate: new Date().toISOString() 
      };
      
      setUserProfile(updatedProfile, { 
          displayName: currentUser.displayName, 
          profilePicture: currentUser.profilePicture 
      });
      setShowPDPA(false);
      // Logic for showing Org modal will be triggered by useEffect
  };

  const handleOrgSelect = (orgId: string) => {
      if (!currentUser) return;
      
      const updatedProfile = {
          ...userProfile,
          organization: orgId
      };

      setUserProfile(updatedProfile, {
          displayName: currentUser.displayName,
          profilePicture: currentUser.profilePicture
      });
      setShowOrgModal(false);
  };

   useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setIsNotificationOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  const navigate = (view: AppView) => {
    setActiveView(view);
    setIsNotificationOpen(false);
    setIsQuickActionOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const MenuCard: React.FC<{
      view: AppView;
      label: string;
      icon: React.ReactNode;
      colorClass?: string;
      desc?: string;
  }> = ({ view, label, icon, colorClass, desc }) => (
      <button 
          onClick={() => navigate(view)}
          className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm flex flex-col items-start gap-3 h-full min-h-[90px] relative overflow-hidden transition-all active:scale-95 border border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50"
      >
          <div className={`${colorClass || 'text-teal-600 bg-teal-100 dark:bg-teal-900/30'} p-2 rounded-full bg-opacity-20 w-10 h-10 flex items-center justify-center`}>
              {icon}
          </div>
          <div className="w-full">
              <p className="font-bold text-gray-800 dark:text-white text-sm text-left leading-tight">{label}</p>
              {desc && <p className="text-[10px] text-gray-500 dark:text-gray-400 text-left mt-1 truncate">{desc}</p>}
          </div>
      </button>
  );

  const MenuGridPage = () => {
      const isImage = currentUser?.profilePicture.startsWith('data:image/') || currentUser?.profilePicture.startsWith('http');
      const [isSettingsExpanded, setIsSettingsExpanded] = useState(false);

      return (
        <div className="animate-fade-in space-y-6 pb-20">
            {/* Header */}
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white px-2">เมนู (Menu)</h2>

            {/* Profile Card */}
            <button 
                onClick={() => navigate('profile')}
                className="w-full bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center gap-4 transition-transform active:scale-95"
            >
                <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center overflow-hidden border border-gray-300 dark:border-gray-600">
                    {isImage ? (
                        <img src={currentUser?.profilePicture} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                        <span className="text-2xl">{currentUser?.profilePicture || '👤'}</span>
                    )}
                </div>
                <div className="text-left flex-1">
                    <h3 className="font-bold text-lg text-gray-800 dark:text-white">{currentUser?.displayName}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">ดูและแก้ไขโปรไฟล์ของคุณ</p>
                </div>
            </button>

            {/* Shortcuts */}
            <div>
                <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-3 px-1">ทางลัดของคุณ</h3>
                <div className="grid grid-cols-2 gap-3">
                    <MenuCard view="home" label="หน้าแรก" desc="ภาพรวมวันนี้" icon={<HomeIcon className="w-6 h-6" />} colorClass="text-blue-600 bg-blue-100" />
                    <MenuCard view="dashboard" label="Dashboard" desc="สรุปผลสุขภาพ" icon={<SquaresIcon className="w-6 h-6" />} colorClass="text-indigo-600 bg-indigo-100" />
                    <MenuCard view="community" label="ชุมชนสุขภาพ" desc="Leaderboard" icon={<UserGroupIcon className="w-6 h-6" />} colorClass="text-orange-600 bg-orange-100" />
                    <MenuCard view="wellness" label="เช็คอินประจำวัน" desc="อารมณ์ & การนอน" icon={<HeartIcon className="w-6 h-6" />} colorClass="text-rose-600 bg-rose-100" />
                    <MenuCard view="quiz" label="ทดสอบความรู้" desc="Health Literacy" icon={<StarIcon className="w-6 h-6" />} colorClass="text-yellow-600 bg-yellow-100" />
                    <MenuCard view="assessment" label="ประเมิน 6 เสาหลัก" desc="Lifestyle Index" icon={<ClipboardDocumentCheckIcon className="w-6 h-6" />} colorClass="text-teal-600 bg-teal-100" />
                </div>
            </div>

            {/* All Tools */}
            <div>
                <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-3 px-1">เครื่องมือทั้งหมด</h3>
                <div className="grid grid-cols-2 gap-3">
                    <MenuCard view="food" label="Food AI" desc="วิเคราะห์อาหาร" icon={<CameraIcon className="w-6 h-6" />} colorClass="text-purple-600 bg-purple-100" />
                    <MenuCard view="coach" label="AI Coach" desc="ปรึกษาสุขภาพ" icon={<SparklesIcon className="w-6 h-6" />} colorClass="text-pink-600 bg-pink-100" />
                    <MenuCard view="planner" label="Meal Planner" desc="แผนการกินส่วนตัว" icon={<ClipboardListIcon className="w-6 h-6" />} colorClass="text-emerald-600 bg-emerald-100" />
                    <MenuCard view="literacy" label="คลังความรู้" desc="บทความสุขภาพ" icon={<BookOpenIcon className="w-6 h-6" />} colorClass="text-cyan-600 bg-cyan-100" />
                    <MenuCard view="bmi" label="BMI Calculator" icon={<ScaleIcon className="w-6 h-6" />} colorClass="text-gray-600 bg-gray-200" />
                    <MenuCard view="tdee" label="TDEE Calculator" icon={<FireIcon className="w-6 h-6" />} colorClass="text-orange-600 bg-orange-200" />
                    <MenuCard view="water" label="บันทึกน้ำดื่ม" icon={<WaterDropIcon className="w-6 h-6" />} colorClass="text-blue-500 bg-blue-100" />
                    <MenuCard view="calorieTracker" label="บันทึกแคลอรี่" icon={<BeakerIcon className="w-6 h-6" />} colorClass="text-green-600 bg-green-100" />
                    <MenuCard view="activityTracker" label="บันทึกกิจกรรม" icon={<BoltIcon className="w-6 h-6" />} colorClass="text-yellow-600 bg-yellow-100" />
                    <MenuCard view="evaluation" label="ประเมินการใช้งาน" desc="ความพึงพอใจ" icon={<ClipboardCheckIcon className="w-6 h-6" />} colorClass="text-purple-600 bg-purple-100" />
                    {currentUser?.role === 'admin' && (
                            <MenuCard view="adminDashboard" label="Admin Zone" desc="จัดการข้อมูล" icon={<UserGroupIcon className="w-6 h-6" />} colorClass="text-red-600 bg-red-100" />
                    )}
                </div>
            </div>

            {/* Help & Settings Accordion */}
            <div className="border-t border-gray-300 dark:border-gray-700 pt-4">
                <button 
                    onClick={() => setIsSettingsExpanded(!isSettingsExpanded)}
                    className="w-full flex justify-between items-center p-3 bg-transparent rounded-lg hover:bg-gray-200 dark:hover:bg-gray-800"
                >
                    <div className="flex items-center gap-3 font-semibold text-gray-700 dark:text-gray-200">
                        <InformationCircleIcon className="w-6 h-6 text-gray-500" />
                        ความช่วยเหลือและการตั้งค่า
                    </div>
                    <span className={`transform transition-transform ${isSettingsExpanded ? 'rotate-180' : ''}`}>▼</span>
                </button>
                
                {isSettingsExpanded && (
                    <div className="mt-2 space-y-1 pl-4 animate-fade-in-down">
                        <button onClick={() => navigate('settings')} className="w-full p-3 text-left bg-white dark:bg-gray-800 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 shadow-sm border border-gray-100 dark:border-gray-700 flex items-center gap-2">
                            <CogIcon className="w-5 h-5"/> การตั้งค่า & ความเป็นส่วนตัว
                        </button>
                        <button onClick={() => navigate('about')} className="w-full p-3 text-left bg-white dark:bg-gray-800 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 shadow-sm border border-gray-100 dark:border-gray-700 flex items-center gap-2">
                            <InformationCircleIcon className="w-5 h-5"/> บทสรุปนวัตกรรม (About)
                        </button>
                        <button onClick={() => navigate('gamificationRules')} className="w-full p-3 text-left bg-white dark:bg-gray-800 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 shadow-sm border border-gray-100 dark:border-gray-700 flex items-center gap-2">
                            <TrophyIcon className="w-5 h-5"/> กติกาการสะสมแต้ม
                        </button>
                            <button onClick={toggleTheme} className="w-full p-3 text-left bg-white dark:bg-gray-800 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 shadow-sm border border-gray-100 dark:border-gray-700 flex justify-between items-center">
                            <span>{theme === 'light' ? 'โหมดกลางคืน (Dark Mode)' : 'โหมดสว่าง (Light Mode)'}</span>
                            {theme === 'light' ? <MoonIcon className="w-4 h-4"/> : <SunIcon className="w-4 h-4" />}
                        </button>
                    </div>
                )}
            </div>

            <button 
                onClick={logout} 
                className="w-full py-3 bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-bold rounded-xl hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
            >
                <LogoutIcon className="w-5 h-5" /> ออกจากระบบ
            </button>
        </div>
      );
  }

  const renderContent = () => {
    switch (activeView) {
      case 'home':
        return <HomeMenu />;
      case 'menu':
        return <MenuGridPage />;
      case 'profile':
        return <UserProfile />;
      case 'dashboard':
        return <Dashboard />;
      case 'community':
        return <Community />;
      case 'assessment':
        return <LifestyleAssessment />;
      case 'planner':
        return <PersonalizedPlanner />;
      case 'bmi':
        return <BMICalculator />;
      case 'tdee':
        return <TDEECalculator />;
      case 'food':
        return <FoodAnalyzer />;
      case 'coach':
        return <AICoach />;
      case 'literacy':
        return <NutritionLiteracy />;
      case 'water':
        return <WaterTracker />;
      case 'calorieTracker':
        return <CalorieTracker />;
      case 'activityTracker':
        return <ActivityTracker />;
      case 'wellness':
        return <WellnessCheckin />;
      case 'gamificationRules':
        return <GamificationRules />;
      case 'about':
        return <AboutApp />;
      case 'evaluation':
        return <EvaluationForm />;
      case 'quiz':
        return <HealthLiteracyQuiz />;
      case 'settings':
        return <Settings />;
      case 'xpHistory':
        return <XPHistory />; // Add XPHistory Component
      case 'adminDashboard':
        return currentUser?.role === 'admin' ? <AdminDashboard /> : <HomeMenu />;
      default:
        return <HomeMenu />;
    }
  };

  const pendingTasks = useMemo(() => {
      if (!currentUser || currentUser.role === 'guest') return [];
      
      const isToday = (dateString: string) => {
        const d = new Date(dateString);
        const today = new Date();
        return d.getDate() === today.getDate() &&
               d.getMonth() === today.getMonth() &&
               d.getFullYear() === today.getFullYear();
      };

      const tasks = [];
      if (!waterHistory.some(h => isToday(h.date))) tasks.push({ id: 'water', label: 'ดื่มน้ำ', view: 'water' as AppView, icon: <WaterDropIcon className="w-4 h-4 text-blue-500"/> });
      if (!calorieHistory.some(h => isToday(h.date))) tasks.push({ id: 'calorie', label: 'บันทึกแคลอรี่', view: 'calorieTracker' as AppView, icon: <BeakerIcon className="w-4 h-4 text-orange-500"/> });
      if (!activityHistory.some(h => isToday(h.date))) tasks.push({ id: 'activity', label: 'ออกกำลังกาย', view: 'activityTracker' as AppView, icon: <BoltIcon className="w-4 h-4 text-yellow-500"/> });
      if (!moodHistory.some(h => isToday(h.date)) && !sleepHistory.some(h => isToday(h.date))) {
           tasks.push({ id: 'wellness', label: 'เช็คอินสุขภาพ', view: 'wellness' as AppView, icon: <HeartIcon className="w-4 h-4 text-rose-500"/> });
      }

      return tasks;
  }, [waterHistory, calorieHistory, activityHistory, moodHistory, sleepHistory, currentUser]);

  useEffect(() => {
      if (!currentUser || currentUser.role === 'guest' || !scriptUrl) return;

      const todayStr = new Date().toDateString();
      if (pendingTasks.length === 0 && lastMissionCompleteDate !== todayStr) {
          sendMissionCompleteNotification(scriptUrl, currentUser);
          setLastMissionCompleteDate(todayStr);
      }
  }, [pendingTasks, currentUser, scriptUrl, lastMissionCompleteDate, setLastMissionCompleteDate]);

  const NotificationBell = () => {
      const count = pendingTasks.length;
      return (
          <div className="relative" ref={notificationRef}>
              <button onClick={() => setIsNotificationOpen(prev => !prev)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors relative">
                  <BellIcon className="w-6 h-6" />
                  {count > 0 && (
                      <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white dark:border-gray-800 animate-pulse">
                          {count}
                      </span>
                  )}
              </button>
              {isNotificationOpen && (
                  <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-gray-800 rounded-xl shadow-xl border dark:border-gray-700 origin-top-right z-50 animate-fade-in-down">
                      <div className="p-4 border-b dark:border-gray-700 bg-gradient-to-r from-teal-500 to-emerald-500 rounded-t-xl">
                          <h3 className="text-white font-bold">ภารกิจพิชิตสุขภาพประจำวัน</h3>
                          <p className="text-teal-100 text-xs mt-1">ทำภารกิจให้ครบเพื่อสุขภาพที่ดีและรับ XP!</p>
                      </div>
                      <div className="max-h-64 overflow-y-auto">
                          {count === 0 ? (
                              <div className="p-6 text-center text-gray-500">
                                  <p className="text-2xl mb-2">🎉</p>
                                  <p>ยอดเยี่ยม! คุณทำภารกิจครบแล้ว</p>
                              </div>
                          ) : (
                              <div className="p-2">
                                  {pendingTasks.map(task => (
                                      <button key={task.id} onClick={() => navigate(task.view)} className="w-full flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors group">
                                          <div className="flex items-center gap-3">
                                              <div className="bg-gray-100 dark:bg-gray-900 p-2 rounded-full">{task.icon}</div>
                                              <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{task.label}</span>
                                          </div>
                                          <span className="text-xs text-teal-600 font-semibold group-hover:underline">ทำเลย →</span>
                                      </button>
                                  ))}
                              </div>
                          )}
                      </div>
                  </div>
              )}
          </div>
      );
  };

  const handleQuickAddWater = () => {
      const newEntry: WaterHistoryEntry = { id: Date.now().toString(), date: new Date().toISOString(), amount: 250 };
      setWaterHistory(prev => [newEntry, ...prev]);
      gainXP(XP_VALUES.WATER, 'WATER');
      setIsQuickActionOpen(false);
  };

  const BottomNavigation = () => {
      if (!currentUser) return null;
      return (
          <div className="fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-t border-gray-200 dark:border-gray-700 flex justify-around items-center h-16 px-2 z-40 pb-safe shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
              <button onClick={() => navigate('home')} className={`flex flex-col items-center justify-center w-full h-full ${activeView === 'home' || activeView === 'dashboard' ? 'text-teal-600 dark:text-teal-400' : 'text-gray-400 dark:text-gray-500'}`}>
                  <HomeIcon className="w-6 h-6" />
                  <span className="text-[10px] mt-1 font-medium">หน้าหลัก</span>
              </button>
              
              <button onClick={() => navigate('community')} className={`flex flex-col items-center justify-center w-full h-full ${activeView === 'community' ? 'text-teal-600 dark:text-teal-400' : 'text-gray-400 dark:text-gray-500'}`}>
                  <UserGroupIcon className="w-6 h-6" />
                  <span className="text-[10px] mt-1 font-medium">ชุมชน</span>
              </button>

              <div className="relative -top-5">
                  <button onClick={() => setIsQuickActionOpen(true)} className="w-14 h-14 bg-gradient-to-tr from-teal-400 to-blue-500 rounded-full flex items-center justify-center text-white shadow-lg border-4 border-gray-50 dark:border-gray-800 transform active:scale-95 transition-transform hover:scale-105">
                      <span className="text-3xl font-light mb-1">+</span>
                  </button>
              </div>

              <button onClick={() => navigate('coach')} className={`flex flex-col items-center justify-center w-full h-full ${activeView === 'coach' ? 'text-teal-600 dark:text-teal-400' : 'text-gray-400 dark:text-gray-500'}`}>
                  <SparklesIcon className="w-6 h-6" />
                  <span className="text-[10px] mt-1 font-medium">โค้ช AI</span>
              </button>

              <button onClick={() => navigate('menu')} className={`flex flex-col items-center justify-center w-full h-full ${activeView === 'menu' ? 'text-teal-600 dark:text-teal-400' : 'text-gray-400 dark:text-gray-500'}`}>
                  <MenuIcon className="w-6 h-6" />
                  <span className="text-[10px] mt-1 font-medium">เมนู</span>
              </button>
          </div>
      );
  };

  const QuickActionModal = () => {
      if (!isQuickActionOpen) return null;
      return (
          <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => setIsQuickActionOpen(false)}></div>
              <div className="bg-white dark:bg-gray-800 w-full max-w-sm mx-auto rounded-t-3xl sm:rounded-3xl p-6 relative z-10 animate-slide-up shadow-2xl">
                  <div className="w-12 h-1.5 bg-gray-300 dark:bg-gray-600 rounded-full mx-auto mb-6"></div>
                  <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-6 text-center">บันทึกด่วน (Quick Log)</h3>
                  
                  <div className="grid grid-cols-3 gap-4 mb-6">
                      <button onClick={handleQuickAddWater} className="flex flex-col items-center gap-2 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors">
                          <div className="w-12 h-12 bg-blue-100 dark:bg-blue-800 rounded-full flex items-center justify-center text-2xl">💧</div>
                          <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">ดื่มน้ำ 1 แก้ว</span>
                      </button>
                      <button onClick={() => navigate('calorieTracker')} className="flex flex-col items-center gap-2 p-4 bg-orange-50 dark:bg-orange-900/20 rounded-2xl hover:bg-orange-100 dark:hover:bg-orange-900/40 transition-colors">
                          <div className="w-12 h-12 bg-orange-100 dark:bg-orange-800 rounded-full flex items-center justify-center text-2xl">🥗</div>
                          <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">บันทึกอาหาร</span>
                      </button>
                      <button onClick={() => navigate('wellness')} className="flex flex-col items-center gap-2 p-4 bg-rose-50 dark:bg-rose-900/20 rounded-2xl hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-colors">
                          <div className="w-12 h-12 bg-rose-100 dark:bg-rose-800 rounded-full flex items-center justify-center text-2xl">😊</div>
                          <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">เช็คอารมณ์</span>
                      </button>
                  </div>
                  
                  <button onClick={() => setIsQuickActionOpen(false)} className="w-full py-3 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 font-bold rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                      ยกเลิก
                  </button>
              </div>
          </div>
      );
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${theme === 'dark' ? 'dark bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-900'} font-sans pb-10`}>
      {currentUser ? (
        <>
          <header className="fixed top-0 left-0 right-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-sm z-30 px-4 py-3 flex justify-between items-center transition-colors duration-300">
             <div className="flex items-center gap-3">
                <div className="flex items-center gap-2" onClick={() => navigate('home')}>
                    <div className="w-8 h-8 bg-gradient-to-tr from-teal-400 to-blue-500 rounded-lg flex items-center justify-center text-white font-bold text-xs shadow cursor-pointer">SLW</div>
                    <span className="font-bold text-gray-800 dark:text-white text-sm cursor-pointer">Satun Smart Life</span>
                </div>
             </div>
             
             <div className="flex items-center gap-3">
                {currentUser?.role !== 'guest' && <NotificationBell />}
                {currentUser?.role === 'guest' && (
                    <button onClick={logout} className="text-[10px] font-bold text-red-500 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-full border border-red-100 transition-colors">
                        ออก (Exit)
                    </button>
                )}
                <button onClick={() => navigate('profile')} className="relative flex items-center justify-center">
                    {currentUser?.profilePicture && (currentUser.profilePicture.startsWith('data') || currentUser.profilePicture.startsWith('http')) ? (
                        <img src={currentUser.profilePicture} alt="Profile" className={`w-9 h-9 rounded-full object-cover border-2 ${activeView === 'profile' ? 'border-teal-500' : 'border-transparent'}`} />
                    ) : (
                        <div className={`p-1 rounded-full ${activeView === 'profile' ? 'text-teal-600 bg-teal-50' : 'text-gray-500 bg-gray-100 dark:bg-gray-700'}`}>
                            <UserCircleIcon className="w-7 h-7" />
                        </div>
                    )}
                </button>
             </div>
          </header>

          <div className="h-16"></div>

          <main className="p-4 max-w-3xl mx-auto w-full pb-24">
            {renderContent()}
            <footer className="text-center mt-12 text-gray-500 dark:text-gray-400 text-sm mb-8 md:mb-0">
              <p>© 2025 Digital Health Satun</p>
              <p>สำนักงานสาธารณสุขจังหวัดสตูล</p>
            </footer>
          </main>

          {activeView !== 'home' && currentUser?.role !== 'guest' && <SOSButton />}
          <BottomNavigation />
          
          <ToastNotification />
          <QuickActionModal />
          
          {/* Modals: Ensure order and blocking behavior */}
          {showPDPA && <PDPAModal onAccept={handlePDPAAccept} />}
          {showOrgModal && !showPDPA && <OrganizationModal onSelect={handleOrgSelect} />}
          
          {isSOSOpen && <SOSModal onClose={closeSOS} />}
          {showLevelUp && <LevelUpModal type={showLevelUp.type} data={showLevelUp.data} onClose={closeLevelUpModal} />}
        </>
      ) : (
        <Auth />
      )}
    </div>
  );
};

const App: React.FC = () => {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
        <AppProvider>
            <AppContent />
        </AppProvider>
    </GoogleOAuthProvider>
  );
};

export default App;
