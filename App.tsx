import React, { useState, useContext, useEffect, useRef } from 'react';
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
import { AppProvider, AppContext } from './context/AppContext';
import { AppView, User } from './types';
import { HomeIcon, ScaleIcon, FireIcon, CameraIcon, SparklesIcon, ClipboardListIcon, MenuIcon, XIcon, SquaresIcon, UserCircleIcon, BookOpenIcon, SunIcon, MoonIcon, CogIcon, LogoutIcon, WaterDropIcon, ClipboardDocumentCheckIcon } from './components/icons';
import { saveDataToSheet } from './services/googleSheetService';

const AppContent: React.FC = () => {
  const { activeView, setActiveView, theme, setTheme, currentUser, logout } = useContext(AppContext);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  
   useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
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
    dashboard: 'แดชบอร์ด',
    assessment: 'ประเมิน 6 เสาหลัก',
    planner: 'นักวางแผนโภชนาการ',
    bmi: 'คำนวณ BMI',
    tdee: 'คำนวณ TDEE',
    food: 'วิเคราะห์อาหาร',
    coach: 'โค้ช AI',
    literacy: 'ความรู้โภชนาการ',
    water: 'บันทึกการดื่มน้ำ',
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
              <NavLink view="dashboard" label="แดชบอร์ด" icon={<SquaresIcon className="w-6 h-6" />} />
              <NavLink view="assessment" label="ประเมิน 6 เสาหลัก" icon={<ClipboardDocumentCheckIcon className="w-6 h-6" />} />
            </>
          )}
          <NavLink view="planner" label="นักวางแผนโภชนาการ" icon={<ClipboardListIcon className="w-6 h-6" />} />
          <NavLink view="food" label="วิเคราะห์อาหาร" icon={<CameraIcon className="w-6 h-6" />} />
          <NavLink view="water" label="บันทึกการดื่มน้ำ" icon={<WaterDropIcon className="w-6 h-6" />} />
          <NavLink view="coach" label="โค้ช AI" icon={<SparklesIcon className="w-6 h-6" />} />
          <NavLink view="literacy" label="ความรู้โภชนาการ" icon={<BookOpenIcon className="w-6 h-6" />} />
          <div className="border-t my-4 border-gray-200 dark:border-gray-700"></div>
          <NavLink view="bmi" label="คำนวณ BMI" icon={<ScaleIcon className="w-6 h-6" />} />
          <NavLink view="tdee" label="คำนวณ TDEE" icon={<FireIcon className="w-6 h-6" />} />
          
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

  const ProfileMenu = () => {
    if (!currentUser) return null;
    
    const isBase64Image = currentUser.profilePicture.startsWith('data:image/');

    return (
        <div className="relative" ref={profileMenuRef}>
            <button onClick={() => setIsProfileMenuOpen(prev => !prev)} className="flex items-center gap-2 p-1 rounded-full transition-colors hover:bg-gray-200 dark:hover:bg-gray-700">
                <div className={`w-9 h-9 rounded-full border-2 ${currentUser.role === 'admin' ? 'border-red-500' : 'border-teal-500'} flex items-center justify-center bg-gray-200 dark:bg-gray-700 overflow-hidden`}>
                    {isBase64Image ? (
                        <img src={currentUser.profilePicture} alt="Profile" className="w-full h-full object-cover"/>
                    ) : (
                        <span className="text-xl">{currentUser.profilePicture}</span>
                    )}
                </div>
            </button>
            {isProfileMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-lg border dark:border-gray-700 origin-top-right animate-fade-in-down z-50">
                    <div className="p-4 border-b dark:border-gray-700">
                        <p className="font-bold text-gray-800 dark:text-white truncate">{currentUser.displayName}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">@{currentUser.username.slice(0, 8)}</p>
                    </div>
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

                  <div className="flex-1 flex justify-end">
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
      <Main />
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