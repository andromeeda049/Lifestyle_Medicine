
import React, { useContext, useMemo, useState } from 'react';
import { AppView } from '../types';
import { AppContext } from '../context/AppContext';
import { 
    ScaleIcon, FireIcon, CameraIcon, SparklesIcon, ClipboardListIcon, 
    SquaresIcon, UserCircleIcon, BookOpenIcon, CogIcon, WaterDropIcon, 
    ClipboardDocumentCheckIcon, BeakerIcon, BoltIcon, HeartIcon, 
    InformationCircleIcon, ClipboardCheckIcon, UserGroupIcon, StarIcon,
    TrophyIcon, ChartBarIcon, XIcon
} from './icons';
import ProactiveInsight from './ProactiveInsight';

const HomeMenu: React.FC = () => {
  const { setActiveView, currentUser, userProfile, waterHistory, calorieHistory, activityHistory, moodHistory, sleepHistory } = useContext(AppContext);
  const [showProfileAlert, setShowProfileAlert] = useState(true);

  // --- Check for Missing Profile Data ---
  const isProfileIncomplete = useMemo(() => {
      if (!userProfile) return true;
      // Check essential fields for AI analysis
      return !userProfile.age || !userProfile.weight || !userProfile.height || !userProfile.healthCondition;
  }, [userProfile]);

  // --- Daily Mission Progress Logic ---
  const dailyProgress = useMemo(() => {
      const today = new Date();
      const isToday = (dateString: string) => {
          const d = new Date(dateString);
          return d.getDate() === today.getDate() &&
                 d.getMonth() === today.getMonth() &&
                 d.getFullYear() === today.getFullYear();
      };

      const missions = [
          { id: 'water', label: 'ดื่มน้ำ', completed: waterHistory.some(h => isToday(h.date)), total: 1, icon: '💧' },
          { id: 'food', label: 'บันทึกอาหาร', completed: calorieHistory.some(h => isToday(h.date)), total: 1, icon: '🥗' },
          { id: 'move', label: 'ขยับร่างกาย', completed: activityHistory.some(h => isToday(h.date)), total: 1, icon: '⚡' },
          { id: 'mind', label: 'เช็คอินสุขภาพ', completed: moodHistory.some(h => isToday(h.date)) || sleepHistory.some(h => isToday(h.date)), total: 1, icon: '🧠' },
      ];

      const completedCount = missions.filter(m => m.completed).length;
      const progress = (completedCount / missions.length) * 100;
      
      return { missions, completedCount, total: missions.length, progress };
  }, [waterHistory, calorieHistory, activityHistory, moodHistory, sleepHistory]);

  const QuickActionButton: React.FC<{ 
      view: AppView; 
      label: string; 
      subLabel: string;
      icon: React.ReactNode; 
      colorClass: string; 
      completed?: boolean;
  }> = ({ view, label, subLabel, icon, colorClass, completed }) => (
      <button
          onClick={() => setActiveView(view)}
          className={`relative flex flex-col items-center justify-center p-4 rounded-2xl shadow-sm border transition-all duration-300 transform hover:-translate-y-1 hover:shadow-md ${
              completed 
              ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800' 
              : 'bg-white border-gray-100 dark:bg-gray-800 dark:border-gray-700'
          }`}
      >
          {completed && (
              <div className="absolute top-2 right-2 text-green-500">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>
              </div>
          )}
          <div className={`p-3 rounded-full mb-2 ${colorClass} bg-opacity-10 text-opacity-100`}>
              {icon}
          </div>
          <span className="text-sm font-bold text-gray-700 dark:text-gray-200">{label}</span>
          <span className="text-[10px] text-gray-400 dark:text-gray-500">{subLabel}</span>
      </button>
  );

  const ToolListItem: React.FC<{
      view: AppView;
      title: string;
      icon: React.ReactNode;
      color: string;
      badge?: string;
  }> = ({ view, title, icon, color, badge }) => (
      <button 
          onClick={() => setActiveView(view)}
          className="flex items-center p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group w-full"
      >
          <div className={`p-2 rounded-lg mr-3 group-hover:scale-110 transition-transform ${color} bg-opacity-10 text-opacity-100`}>
              {icon}
          </div>
          <div className="flex-1 text-left">
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">{title}</span>
          </div>
          {badge && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400">
                  {badge}
              </span>
          )}
          <div className="text-gray-300 group-hover:text-gray-500">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/></svg>
          </div>
      </button>
  );

  return (
    <div className="animate-fade-in space-y-6 pb-20">
        
        {/* --- Profile Completion Alert --- */}
        {isProfileIncomplete && showProfileAlert && (
            <div className="p-4 rounded-xl border-l-4 shadow-sm mb-2 flex items-start gap-4 bg-blue-50 border-blue-500 dark:bg-blue-900/20 dark:border-blue-400 relative animate-bounce-in">
                <div className="p-2 bg-white dark:bg-gray-800 rounded-full text-blue-500 shadow-sm mt-1">
                    <UserCircleIcon className="w-6 h-6" />
                </div>
                <div className="flex-1 cursor-pointer" onClick={() => setActiveView('profile')}>
                    <h4 className="font-bold text-sm text-gray-800 dark:text-white">ข้อมูลสุขภาพยังไม่ครบถ้วน</h4>
                    <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 leading-relaxed">
                        เพื่อให้ <strong>AI Coach</strong> วิเคราะห์และวางแผนสุขภาพให้คุณได้อย่างแม่นยำ กรุณาระบุ <span className="font-bold">อายุ, น้ำหนัก, ส่วนสูง และโรคประจำตัว</span> ให้ครบถ้วนนะครับ
                    </p>
                    <span className="text-xs font-bold text-blue-600 dark:text-blue-400 mt-2 inline-flex items-center gap-1 hover:underline">
                        ไปที่หน้าตั้งค่าข้อมูลส่วนตัว →
                    </span>
                </div>
                <button 
                    onClick={(e) => { e.stopPropagation(); setShowProfileAlert(false); }}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 absolute top-2 right-2 p-1"
                >
                    <XIcon className="w-4 h-4" />
                </button>
            </div>
        )}

        <ProactiveInsight />

        {/* 1. Hero Section: User Status & Daily Mission */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-lg border border-gray-100 dark:border-gray-700 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5">
                <TrophyIcon className="w-32 h-32" />
            </div>
            
            <div className="flex justify-between items-end mb-4 relative z-10">
                <div>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">ยินดีต้อนรับ,</p>
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white truncate max-w-[200px]">
                        {currentUser?.displayName || 'User'}
                    </h2>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs font-bold rounded-full border border-yellow-200">
                            Lvl {userProfile?.level || 1}
                        </span>
                        <span className="text-xs text-gray-400">
                            {userProfile?.xp?.toLocaleString()} XP
                        </span>
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-3xl font-black text-indigo-600 dark:text-indigo-400">
                        {dailyProgress.completedCount}/{dailyProgress.total}
                    </div>
                    <p className="text-xs text-gray-500">ภารกิจวันนี้</p>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="relative z-10">
                <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-3 mb-2">
                    <div 
                        className="bg-gradient-to-r from-indigo-500 to-purple-500 h-3 rounded-full transition-all duration-1000 ease-out"
                        style={{ width: `${dailyProgress.progress}%` }}
                    ></div>
                </div>
                <div className="flex justify-between text-[10px] text-gray-400">
                    <span>เริ่มต้นวันใหม่</span>
                    <span>สู่สุขภาพที่ยั่งยืน</span>
                </div>
            </div>
        </div>

        {/* 2. Quick Actions: The "Daily Drivers" */}
        <div>
            <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3 pl-1">
                กิจกรรมประจำวัน (Daily Actions)
            </h3>
            <div className="grid grid-cols-2 gap-3">
                <QuickActionButton 
                    view="calorieTracker" 
                    label="โภชนาการ" 
                    subLabel="บันทึก/สแกนอาหาร"
                    icon={<BeakerIcon className="w-6 h-6 text-purple-600" />} 
                    colorClass="bg-purple-100 dark:bg-purple-900/30 text-purple-600"
                    completed={dailyProgress.missions.find(m => m.id === 'food')?.completed}
                />
                <QuickActionButton 
                    view="water" 
                    label="ดื่มน้ำ" 
                    subLabel="บันทึกการดื่มน้ำ"
                    icon={<WaterDropIcon className="w-6 h-6 text-blue-500" />} 
                    colorClass="bg-blue-100 dark:bg-blue-900/30 text-blue-500"
                    completed={dailyProgress.missions.find(m => m.id === 'water')?.completed}
                />
                <QuickActionButton 
                    view="activityTracker" 
                    label="ขยับร่างกาย" 
                    subLabel="บันทึกกิจกรรม/ก้าวเดิน"
                    icon={<BoltIcon className="w-6 h-6 text-yellow-500" />} 
                    colorClass="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-500"
                    completed={dailyProgress.missions.find(m => m.id === 'move')?.completed}
                />
                <QuickActionButton 
                    view="wellness" 
                    label="เช็คอินสุขภาพ" 
                    subLabel="อารมณ์ & การนอน"
                    icon={<HeartIcon className="w-6 h-6 text-rose-500" />} 
                    colorClass="bg-rose-100 dark:bg-rose-900/30 text-rose-500"
                    completed={dailyProgress.missions.find(m => m.id === 'mind')?.completed}
                />
            </div>
        </div>

        {/* 3. Challenge Banner (Renamed) */}
        <div 
            onClick={() => setActiveView('community')}
            className="bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl p-4 text-white shadow-lg cursor-pointer transform transition-transform hover:scale-[1.02] relative overflow-hidden"
        >
            <div className="absolute -right-4 -bottom-4 bg-white/10 w-24 h-24 rounded-full blur-xl"></div>
            <div className="flex items-center gap-4 relative z-10">
                <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                    <TrophyIcon className="w-8 h-8 text-yellow-300" />
                </div>
                <div>
                    <h3 className="font-bold text-lg">ลำดับคนรักสุขภาพ</h3>
                    <p className="text-orange-100 text-xs">ดูอันดับของคุณและผู้มาแรงประจำสัปดาห์</p>
                </div>
                <div className="ml-auto bg-white text-orange-600 px-3 py-1 rounded-full text-xs font-bold shadow-sm">
                    Go!
                </div>
            </div>
        </div>

        {/* 4. Tools & Services Sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Planning & AI */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
                <h4 className="text-xs font-bold text-gray-400 uppercase mb-2">วางแผน & ปรึกษา (Planning)</h4>
                <div className="space-y-1">
                    <ToolListItem view="planner" title="แผนไลฟ์สไตล์ (Meal Plan)" icon={<ClipboardListIcon className="w-5 h-5"/>} color="bg-emerald-100 text-emerald-600" />
                    <ToolListItem view="coach" title="ปรึกษาโค้ช (AI Chat)" icon={<SparklesIcon className="w-5 h-5"/>} color="bg-indigo-100 text-indigo-600" badge="AI" />
                    <ToolListItem view="dashboard" title="แดชบอร์ดสุขภาพ" icon={<SquaresIcon className="w-5 h-5"/>} color="bg-sky-100 text-sky-600" />
                </div>
            </div>

            {/* Assessment & Learning */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
                <h4 className="text-xs font-bold text-gray-400 uppercase mb-2">ประเมิน & เรียนรู้ (Knowledge)</h4>
                <div className="space-y-1">
                    <ToolListItem view="assessment" title="ประเมิน 6 เสาหลัก" icon={<ClipboardDocumentCheckIcon className="w-5 h-5"/>} color="bg-teal-100 text-teal-600" />
                    <ToolListItem view="quiz" title="ทดสอบความรู้ (Quiz)" icon={<StarIcon className="w-5 h-5"/>} color="bg-yellow-100 text-yellow-600" />
                    <ToolListItem view="literacy" title="คลังความรู้สุขภาพ" icon={<BookOpenIcon className="w-5 h-5"/>} color="bg-rose-100 text-rose-600" />
                    <ToolListItem view="evaluation" title="แบบประเมินความพึงพอใจ" icon={<ClipboardCheckIcon className="w-5 h-5"/>} color="bg-purple-100 text-purple-600" />
                </div>
            </div>

            {/* Calculations & Settings */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
                <h4 className="text-xs font-bold text-gray-400 uppercase mb-2">เครื่องมือ & ตั้งค่า (Tools)</h4>
                <div className="space-y-1">
                    <ToolListItem view="bmi" title="เครื่องคำนวณ BMI" icon={<ScaleIcon className="w-5 h-5"/>} color="bg-gray-100 text-gray-600" />
                    <ToolListItem view="tdee" title="เครื่องคำนวณ TDEE" icon={<FireIcon className="w-5 h-5"/>} color="bg-orange-100 text-orange-600" />
                    <ToolListItem view="profile" title="ข้อมูลส่วนตัว" icon={<UserCircleIcon className="w-5 h-5"/>} color="bg-green-100 text-green-600" />
                    {currentUser?.role === 'admin' && (
                        <ToolListItem view="adminDashboard" title="ผู้ดูแลระบบ (Admin)" icon={<UserGroupIcon className="w-5 h-5"/>} color="bg-red-100 text-red-600" />
                    )}
                </div>
            </div>
        </div>
    </div>
  );
};

export default HomeMenu;
