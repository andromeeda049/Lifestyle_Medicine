
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
import { AppProvider, AppContext } from './context/AppContext';
import { AppView, User } from './types';
import { HomeIcon, ScaleIcon, FireIcon, CameraIcon, SparklesIcon, ClipboardListIcon, MenuIcon, XIcon, SquaresIcon, UserCircleIcon, BookOpenIcon, SunIcon, MoonIcon, CogIcon, LogoutIcon, WaterDropIcon, ClipboardDocumentCheckIcon, BeakerIcon, BoltIcon, HeartIcon, QuestionMarkCircleIcon, StarIcon, InformationCircleIcon, ClipboardCheckIcon, BellIcon } from './components/icons';
import { saveDataToSheet } from './services/googleSheetService';
import { GoogleOAuthProvider } from '@react-oauth/google';

// !!! สำคัญ !!! แทนที่ด้วย Google Client ID ของคุณที่นี่
// ไปที่ console.cloud.google.com -> APIs & Services -> Credentials -> Create OAuth Client ID
const GOOGLE_CLIENT_ID = "870268659424-7gi7roa07gnhpum8ov1mqr1t5tn93l9e.apps.googleusercontent.com";

const AppContent: React.FC = () => {
  const { activeView, setActiveView, theme, setTheme, currentUser, logout, userProfile, waterHistory, foodHistory, calorieHistory, activityHistory, moodHistory, sleepHistory } = useContext(AppContext);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);
  
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
  };

  const renderView = () => {
    switch (activeView) {
      case 'home':
        return <HomeMenu />;
      case 'profile':
        return <UserProfile />;
      case 'dashboard':
        return <Dashboard />;
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
      case 'settings':
        return currentUser?.role === 'admin' ? <Settings /> : <HomeMenu />;
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
    settings: 'ตั้งค่า',
    adminDashboard: 'จัดการผู้ใช้',
  };
  
  const NavLink: React.FC<{
    view: AppView;
    label: string;
    icon: React.ReactNode;
  }> = ({ view, label, icon }) => {
    const isActive = activeView === view;
    return (
      <button
        onClick={() => navigate(view)}
        className={`flex items-center w-full p-3 my-1 rounded-lg font-semibold text-left transition-colors duration-200 ${
          isActive
            ? 'bg-teal-500 text-white shadow-md'
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
          {currentUser?.role === 'user' && (
            <>
              <NavLink view="profile" label="ข้อมูลส่วนตัว" icon={<UserCircleIcon className="w-6 h-6" />} />
              <NavLink view="dashboard" label="แดชบอร์ดสุขภาพ" icon={<SquaresIcon className="w-6 h-6" />} />
              <NavLink view="assessment" label="ประเมิน 6 เสาหลัก" icon={<ClipboardDocumentCheckIcon className="w-6 h-6" />} />
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
          
          {currentUser?.role === 'admin' && (
              <>
                <div className="border-t my-4 border-gray-200 dark:border-gray-700"></div>
                <NavLink view="adminDashboard" label="จัดการผู้ใช้" icon={<UserCircleIcon className="w-6 h-6" />} />
                <NavLink view="settings" label="ตั้งค่า" icon={<CogIcon className="w-6 h-6" />} />
              </>
          )}
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

  // Daily Task Logic
  const pendingTasks = useMemo(() => {
      if (!currentUser || currentUser.role !== 'user') return [];
      
      const isToday = (dateString: string) => {
        const d = new Date(dateString);
        const today = new Date();
        return d.getDate() === today.getDate() &&
               d.getMonth() === today.getMonth() &&
               d.getFullYear() === today.getFullYear();
      };

      const tasks = [];
      if (!waterHistory.some(h => isToday(h.date))) tasks.push({ id: 'water', label: 'ดื่มน้ำ', view: 'water' as AppView, icon: <WaterDropIcon className="w-4 h-4 text-blue-500"/> });
      // Replace Food Analysis with Calorie Tracker
      if (!calorieHistory.some(h => isToday(h.date))) tasks.push({ id: 'calorie', label: 'บันทึกแคลอรี่', view: 'calorieTracker' as AppView, icon: <BeakerIcon className="w-4 h-4 text-orange-500"/> });
      if (!activityHistory.some(h => isToday(h.date))) tasks.push({ id: 'activity', label: 'ออกกำลังกาย', view: 'activityTracker' as AppView, icon: <BoltIcon className="w-4 h-4 text-yellow-500"/> });
      if (!moodHistory.some(h => isToday(h.date)) && !sleepHistory.some(h => isToday(h.date))) {
           tasks.push({ id: 'wellness', label: 'เช็คอินสุขภาพ', view: 'wellness' as AppView, icon: <HeartIcon className="w-4 h-4 text-rose-500"/> });
      }

      return tasks;
  }, [waterHistory, calorieHistory, activityHistory, moodHistory, sleepHistory, currentUser]);

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
                {currentUser.role === 'user' && (
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
                    {currentUser.role === 'user' && (
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

      <div className="flex flex-col flex-1">
        <header className="sticky top-0 z-30 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              <div className="flex items-center justify-between h-16">
                 <div className="flex-1 flex justify-start items-center gap-1">
                    <button
                        onClick={() => setIsMenuOpen(true)}
                        className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white p-2 -ml-2"
                        aria-label="เปิดเมนู"
                    >
                        <MenuIcon className="w-6 h-6" />
                    </button>
                     {activeView !== 'home' && (
                        <button
                            onClick={() => navigate('home')}
                            className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white p-2 rounded-full"
                            aria-label="กลับไปหน้าแรก"
                        >
                            <HomeIcon className="w-6 h-6" />
                        </button>
                    )}
                 </div>
                  
                  <div className="flex-1 flex justify-center">
                    <h1 className="text-xl font-bold text-gray-800 dark:text-white truncate">{viewTitles[activeView]}</h1>
                  </div>

                  <div className="flex-1 flex justify-end items-center gap-2">
                    {currentUser?.role === 'user' && <NotificationBell />}
                    {currentUser && <ProfileMenu />}
                  </div>
              </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto p-4 sm:p-6 md:px-8 w-full">
            <div className={activeView === 'adminDashboard' ? 'w-full' : 'max-w-4xl mx-auto'}>
              {renderView()}
            </div>
            <footer className="text-center mt-12 text-gray-500 dark:text-gray-400 text-sm">
              <p>พัฒนาโดย นายธงชัย ทำเผือก</p>
              <p>กลุ่มงานสุขภาพดิจิทัล สำนักงานสาธารณสุขจังหวัดสตูล</p>
            </footer>
        </main>
      </div>
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
