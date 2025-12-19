
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
import SOSModal from './components/SOSModal';
import Community from './components/Community';
import { AppProvider, AppContext } from './context/AppContext';
import { AppView, User, WaterHistoryEntry } from './types';
import { HomeIcon, ScaleIcon, FireIcon, CameraIcon, SparklesIcon, ClipboardListIcon, MenuIcon, XIcon, SquaresIcon, UserCircleIcon, BookOpenIcon, SunIcon, MoonIcon, CogIcon, LogoutIcon, WaterDropIcon, ClipboardDocumentCheckIcon, BeakerIcon, BoltIcon, HeartIcon, QuestionMarkCircleIcon, StarIcon, InformationCircleIcon, ClipboardCheckIcon, BellIcon, UserGroupIcon, PhoneIcon } from './components/icons';
import { sendMissionCompleteNotification, saveDataToSheet } from './services/googleSheetService';
import { GoogleOAuthProvider } from '@react-oauth/google';
import useLocalStorage from './hooks/useLocalStorage';
import { XP_VALUES } from './constants';

// !!! สำคัญ !!! แทนที่ด้วย Google Client ID ของคุณที่นี่
// ไปที่ console.cloud.google.com -> APIs & Services -> Credentials -> Create OAuth Client ID
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

const AppContent: React.FC = () => {
  const { activeView, setActiveView, theme, setTheme, currentUser, logout, userProfile, setUserProfile, waterHistory, foodHistory, calorieHistory, activityHistory, moodHistory, sleepHistory, scriptUrl, setWaterHistory, gainXP, isSOSOpen, closeSOS } = useContext(AppContext);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isQuickActionOpen, setIsQuickActionOpen] = useState(false); // State for Quick Action Modal
  const [showPDPA, setShowPDPA] = useState(false);
  
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);
  
  // Track if we've already notified the backend today
  const [lastMissionCompleteDate, setLastMissionCompleteDate] = useLocalStorage<string>('lastMissionCompleteDate', '');
  
  // Check PDPA Status on Load
  useEffect(() => {
      if (currentUser && currentUser.role !== 'guest' && currentUser.role !== 'admin') {
          // If profile loaded but PDPA not accepted yet
          if (userProfile && !userProfile.pdpaAccepted) {
              setShowPDPA(true);
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
  };

   useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
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
    setIsMenuOpen(false);
    setIsNotificationOpen(false);
    setIsQuickActionOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderView = () => {
    switch (activeView) {
      case 'home':
        return <HomeMenu />;
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
      case 'adminDashboard':
        return currentUser?.role === 'admin' ? <AdminDashboard /> : <HomeMenu />;
      default:
        return <HomeMenu />;
    }
  };

  const viewTitles: { [key in AppView]?: string } = {
    home: 'หน้าแรก',
    profile: 'ข้อมูลส่วนตัว',
    dashboard: 'แดชบอร์ดสุขภาพ',
    community: 'ชุมชนคนรักสุขภาพ',
    assessment: 'ประเมิน 6 เสาหลัก',
    planner: 'แผนไลฟ์สไตล์',
    bmi: 'เครื่องคำนวณ BMI',
    tdee: 'เครื่องคำนวณ TDEE',
    food: 'วิเคราะห์อาหาร (AI)',
    coach: 'โค้ชสุขภาพ (AI)',
    literacy: 'ความรู้เวชศาสตร์วิถีชีวิต',
    water: 'บันทึกการดื่มน้ำ',
    calorieTracker: 'บันทึกแคลอรี่',
    activityTracker: 'บันทึกกิจกรรม',
    wellness: 'เช็คอินสุขภาพประจำวัน',
    gamificationRules: 'กติกาการสะสมแต้ม',
    about: 'เกี่ยวกับนวัตกรรม',
    evaluation: 'ประเมินผลการใช้งาน',
    quiz: 'แบบทดสอบความรอบรู้ (HL Quiz)',
    settings: 'ตั้งค่า',
    adminDashboard: 'จัดการหน่วยงาน (Admin)',
  };
  
  const NavLink: React.FC<{
    view: AppView;
    label: string;
    icon: React.ReactNode;
    isSpecial?: boolean;
  }> = ({ view, label, icon, isSpecial }) => {
    const isActive = activeView === view;
    return (
      <button
        onClick={() => navigate(view)}
        className={`flex items-center w-full p-3 my-1 rounded-lg font-semibold text-left transition-colors duration-200 ${
          isActive
            ? 'bg-teal-500 text-white shadow-md'
            : isSpecial 
                ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40'
                : 'text-gray-600 dark:text-gray-300 hover:bg-teal-100 dark:hover:bg-gray-700 hover:text-teal-800 dark:hover:text-white'
        }`}
      >
        <span className="mr-4">{icon}</span>
        {label}
      </button>
    );
  };
  
  const SideMenu = () => (
     <aside
      className={`fixed inset-y-0 left-0 z-50 w-72 bg-white dark:bg-gray-800 shadow-lg transform transition-transform duration-300 ease-in-out ${
        isMenuOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-bold text-teal-600 dark:text-teal-400">เมนู</h2>
        <button onClick={() => setIsMenuOpen(false)} className="text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white">
          <XIcon className="w-6 h-6" />
        </button>
      </div>
      <nav className="p-4 h-[calc(100%-65px)] flex flex-col justify-between overflow-y-auto">
        <div>
          <NavLink view="home" label="หน้าแรก" icon={<HomeIcon className="w-6 h-6" />} />
          
          {currentUser?.role === 'admin' && (
              <div className="mb-4 mt-2">
                  <p className="text-xs font-bold text-red-500 dark:text-red-400 uppercase tracking-wider mb-2 px-3">
                      Administrator Zone
                  </p>
                  <NavLink view="adminDashboard" label="แดชบอร์ดหน่วยงาน" icon={<UserGroupIcon className="w-6 h-6" />} isSpecial={true} />
              </div>
          )}

          {/* Show common menu items for both User and Admin (to let admin test) */}
          {(currentUser?.role === 'user' || currentUser?.role === 'admin') && (
            <>
              <NavLink view="profile" label="ข้อมูลส่วนตัว" icon={<UserCircleIcon className="w-6 h-6" />} />
              <NavLink view="dashboard" label="แดชบอร์ดสุขภาพ" icon={<SquaresIcon className="w-6 h-6" />} />
              <NavLink view="community" label="ชุมชนสุขภาพ" icon={<UserGroupIcon className="w-6 h-6" />} />
              <NavLink view="assessment" label="ประเมิน 6 เสาหลัก" icon={<ClipboardDocumentCheckIcon className="w-6 h-6" />} />
              <NavLink view="quiz" label="แบบทดสอบความรอบรู้ (HL)" icon={<StarIcon className="w-6 h-6" />} />
              <NavLink view="wellness" label="เช็คอินสุขภาพประจำวัน" icon={<HeartIcon className="w-6 h-6" />} />
            </>
          )}
           <div className="border-t my-4 border-gray-200 dark:border-gray-700"></div>
          <NavLink view="calorieTracker" label="บันทึกแคลอรี่" icon={<BeakerIcon className="w-6 h-6" />} />
          <NavLink view="activityTracker" label="บันทึกกิจกรรม" icon={<BoltIcon className="w-6 h-6" />} />
          <NavLink view="water" label="บันทึกการดื่มน้ำ" icon={<WaterDropIcon className="w-6 h-6" />} />
           <div className="border-t my-4 border-gray-200 dark:border-gray-700"></div>
          <NavLink view="planner" label="แผนไลฟ์สไตล์" icon={<ClipboardListIcon className="w-6 h-6" />} />
          <NavLink view="food" label="วิเคราะห์อาหาร (AI)" icon={<CameraIcon className="w-6 h-6" />} />
          <NavLink view="coach" label="โค้ชสุขภาพ (AI)" icon={<SparklesIcon className="w-6 h-6" />} />
          <NavLink view="literacy" label="ความรู้ LM" icon={<BookOpenIcon className="w-6 h-6" />} />
          <div className="border-t my-4 border-gray-200 dark:border-gray-700"></div>
          <NavLink view="bmi" label="เครื่องมือ BMI" icon={<ScaleIcon className="w-6 h-6" />} />
          <NavLink view="tdee" label="เครื่องมือ TDEE" icon={<FireIcon className="w-6 h-6" />} />
          <div className="border-t my-4 border-gray-200 dark:border-gray-700"></div>
          <NavLink view="gamificationRules" label="กติกาการสะสมแต้ม" icon={<QuestionMarkCircleIcon className="w-6 h-6" />} />
          <NavLink view="about" label="เกี่ยวกับนวัตกรรม" icon={<InformationCircleIcon className="w-6 h-6" />} />
          <NavLink view="evaluation" label="ประเมินผลการใช้งาน" icon={<ClipboardCheckIcon className="w-6 h-6" />} />
          
          <div className="border-t my-4 border-gray-200 dark:border-gray-700"></div>
          <NavLink view="settings" label="ตั้งค่า" icon={<CogIcon className="w-6 h-6" />} />
        </div>
        <div className="p-2">
            <button onClick={toggleTheme} className="w-full flex items-center justify-center gap-3 p-3 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 font-semibold transition-colors">
                {theme === 'light' ? <MoonIcon className="w-6 h-6"/> : <SunIcon className="w-6 h-6" />}
                <span>{theme === 'light' ? 'โหมดกลางคืน' : 'โหมดกลางวัน'}</span>
            </button>
        </div>
      </nav>
    </aside>
  );

  // Daily Task Logic & Auto Notification
  const pendingTasks = useMemo(() => {
      // Allow any non-guest user (User + Admin) to see tasks
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

  // Check for Mission Complete
  useEffect(() => {
      // Allow notification check for User & Admin
      if (!currentUser || currentUser.role === 'guest' || !scriptUrl) return;

      const todayStr = new Date().toDateString();
      
      // If no pending tasks AND we haven't notified today
      if (pendingTasks.length === 0 && lastMissionCompleteDate !== todayStr) {
          // Trigger notification to backend
          sendMissionCompleteNotification(scriptUrl, currentUser);
          // Mark as notified locally
          setLastMissionCompleteDate(todayStr);
      }
  }, [pendingTasks, currentUser, scriptUrl, lastMissionCompleteDate, setLastMissionCompleteDate]);


  const NotificationBell = () => {
      const count = pendingTasks.length;
      
      return (
          <div className="relative" ref={notificationRef}>
              <button 
                  onClick={() => setIsNotificationOpen(prev => !prev)}
                  className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors relative"
              >
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
                                      <button 
                                          key={task.id}
                                          onClick={() => navigate(task.view)}
                                          className="w-full flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors group"
                                      >
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

  const ProfileMenu = () => {
    if (!currentUser) return null;
    
    const isImage = currentUser.profilePicture.startsWith('data:image/') || currentUser.profilePicture.startsWith('http');
    const currentLevel = userProfile?.level || 1;
    const currentXP = userProfile?.xp || 0;

    return (
        <div className="relative" ref={profileMenuRef}>
            <button onClick={() => setIsProfileMenuOpen(prev => !prev)} className="flex items-center gap-2 p-1 rounded-full transition-colors hover:bg-gray-200 dark:hover:bg-gray-700 relative">
                <div className={`w-9 h-9 rounded-full border-2 ${currentUser.role === 'admin' ? 'border-red-500' : 'border-teal-500'} flex items-center justify-center bg-gray-200 dark:bg-gray-700 overflow-hidden`}>
                    {isImage ? (
                        <img src={currentUser.profilePicture} alt="Profile" className="w-full h-full object-cover"/>
                    ) : (
                        <span className="text-xl">{currentUser.profilePicture}</span>
                    )}
                </div>
                {/* Show Level for Admin too if they want to play */}
                {currentUser.role !== 'guest' && (
                     <div className="absolute -bottom-1 -right-1 bg-yellow-400 text-white text-[10px] font-bold px-1.5 rounded-full border border-white dark:border-gray-800">
                         {currentLevel}
                     </div>
                )}
            </button>
            {isProfileMenuOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-xl shadow-lg border dark:border-gray-700 origin-top-right animate-fade-in-down z-50">
                    <div className="p-4 border-b dark:border-gray-700">
                        <p className="font-bold text-gray-800 dark:text-white truncate">{currentUser.displayName}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">@{currentUser.username.slice(0, 8)}</p>
                    </div>
                    {/* Show stats for Admin too */}
                    {currentUser.role !== 'guest' && (
                        <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700/50 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="bg-yellow-400 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">
                                    {currentLevel}
                                </div>
                                <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">Level {currentLevel}</span>
                            </div>
                            <div className="flex items-center gap-1 text-xs font-medium text-gray-500 dark:text-gray-400">
                                <StarIcon className="w-3 h-3 text-yellow-500" />
                                {currentXP.toLocaleString()} XP
                            </div>
                        </div>
                    )}
                    <div className="p-2">
                        <button onClick={logout} className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/50 rounded-md transition-colors">
                            <LogoutIcon className="w-5 h-5" />
                            <span>ออกจากระบบ</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
  }

  // --- Quick Action Handlers ---
  const handleQuickAddWater = () => {
      const newEntry: WaterHistoryEntry = {
          id: Date.now().toString(),
          date: new Date().toISOString(),
          amount: 250 // Add 1 glass
      };
      setWaterHistory(prev => [newEntry, ...prev]);
      gainXP(XP_VALUES.WATER);
      setIsQuickActionOpen(false);
      alert('บันทึกการดื่มน้ำ +250ml เรียบร้อย!');
  };

  const BottomNavigation = () => {
      // Show bottom nav for Admin too for testing convenience
      if (!currentUser || currentUser.role === 'guest') return null;

      return (
          <div className="fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-t border-gray-200 dark:border-gray-700 flex justify-around items-center h-20 px-2 z-40 pb-2 md:hidden animate-slide-up">
              <button onClick={() => navigate('home')} className={`flex flex-col items-center justify-center w-16 h-full ${activeView === 'home' ? 'text-teal-600 dark:text-teal-400' : 'text-gray-400 dark:text-gray-500'}`}>
                  <HomeIcon className="w-6 h-6" />
                  <span className="text-[10px] mt-1">หน้าแรก</span>
              </button>
              
              <button onClick={() => navigate('dashboard')} className={`flex flex-col items-center justify-center w-16 h-full ${activeView === 'dashboard' ? 'text-teal-600 dark:text-teal-400' : 'text-gray-400 dark:text-gray-500'}`}>
                  <SquaresIcon className="w-6 h-6" />
                  <span className="text-[10px] mt-1">สรุปผล</span>
              </button>

              <div className="relative -top-6">
                  <button 
                    onClick={() => setIsQuickActionOpen(true)}
                    className="w-14 h-14 bg-gradient-to-tr from-teal-400 to-blue-500 rounded-full flex items-center justify-center text-white shadow-lg border-4 border-gray-50 dark:border-gray-800 transform active:scale-95 transition-transform"
                  >
                      <span className="text-3xl font-light mb-1">+</span>
                  </button>
              </div>

              <button onClick={() => navigate('wellness')} className={`flex flex-col items-center justify-center w-16 h-full ${activeView === 'wellness' ? 'text-teal-600 dark:text-teal-400' : 'text-gray-400 dark:text-gray-500'}`}>
                  <HeartIcon className="w-6 h-6" />
                  <span className="text-[10px] mt-1">ภารกิจ</span>
              </button>

              <button onClick={() => setIsMenuOpen(true)} className="flex flex-col items-center justify-center w-16 h-full text-gray-400 dark:text-gray-500">
                  <MenuIcon className="w-6 h-6" />
                  <span className="text-[10px] mt-1">เมนู</span>
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
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-sky-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-slate-900 text-gray-800 dark:text-gray-200">
      <SideMenu />
      {isMenuOpen && (
        <div
          onClick={() => setIsMenuOpen(false)}
          className="fixed inset-0 bg-black/60 z-40 transition-opacity"
          aria-hidden="true"
        ></div>
      )}
      
      {/* PDPA Modal */}
      {showPDPA && <PDPAModal onAccept={handlePDPAAccept} />}
      
      {/* SOS Modal & Button (Enable for Admin too for testing) */}
      {currentUser?.role !== 'guest' && <SOSButton />}
      {isSOSOpen && <SOSModal onClose={closeSOS} />}

      <div className="flex flex-col flex-1 pb-24">
        <header className="sticky top-0 z-30 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              <div className="flex items-center justify-between h-16">
                 <div className="flex-1 flex justify-start items-center gap-1">
                    <button
                        onClick={() => setIsMenuOpen(true)}
                        className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white p-2 -ml-2 hidden md:block" // Hide on mobile
                        aria-label="เปิดเมนู"
                    >
                        <MenuIcon className="w-6 h-6" />
                    </button>
                     {activeView !== 'home' && (
                        <button
                            onClick={() => navigate('home')}
                            className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white p-2 rounded-full md:block hidden" // Hide on mobile
                            aria-label="กลับไปหน้าแรก"
                        >
                            <HomeIcon className="w-6 h-6" />
                        </button>
                    )}
                    {/* App Logo/Name for Mobile */}
                    <div className="md:hidden flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-tr from-teal-400 to-blue-500 rounded-lg flex items-center justify-center text-white font-bold text-xs shadow">SLW</div>
                        <span className="font-bold text-gray-800 dark:text-white text-sm">Smart Wellness</span>
                    </div>
                 </div>
                  
                  <div className="flex-1 flex justify-center hidden md:flex">
                    <h1 className="text-xl font-bold text-gray-800 dark:text-white truncate">{viewTitles[activeView]}</h1>
                  </div>

                  <div className="flex-1 flex justify-end items-center gap-2">
                    {/* Show NotificationBell for Admin as well */}
                    {currentUser?.role !== 'guest' && <NotificationBell />}
                    {currentUser && <ProfileMenu />}
                  </div>
              </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto p-4 sm:p-6 md:px-8 w-full">
            <div className={activeView === 'adminDashboard' ? 'w-full' : 'max-w-4xl mx-auto'}>
              {renderView()}
            </div>
            <footer className="text-center mt-12 text-gray-500 dark:text-gray-400 text-sm mb-8 md:mb-0">
              <p>พัฒนาโดย นายธงชัย ทำเผือก</p>
              <p>กลุ่มงานสุขภาพดิจิทัล สำนักงานสาธารณสุขจังหวัดสตูล</p>
            </footer>
        </main>
      </div>
      
      <BottomNavigation />
      <QuickActionModal />
    </div>
  );
};


const App: React.FC = () => {
  return (
    <AppProvider>
      <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
        <Main />
      </GoogleOAuthProvider>
    </AppProvider>
  )
}

const Main: React.FC = () => {
    const { currentUser } = useContext(AppContext);
    
    // To prevent flash of auth screen if user is already logged in
    const [isInitialLoad, setIsInitialLoad] = useState(true);
    useEffect(() => {
        const timer = setTimeout(() => setIsInitialLoad(false), 200); // Small delay to allow context to load from localStorage
        return () => clearTimeout(timer);
    }, []);

    if (isInitialLoad && currentUser !== null) {
        return <div className="fixed inset-0 bg-gray-50 dark:bg-gray-900"></div>; // Or a loading spinner
    }

    if (!currentUser) {
        return <Auth />;
    }
    
    return <AppContent />;
}

export default App;
