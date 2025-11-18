import React, { useContext } from 'react';
import { AppView } from '../types';
import { AppContext } from '../context/AppContext';
import { ScaleIcon, FireIcon, CameraIcon, SparklesIcon, ClipboardListIcon, SquaresIcon, UserCircleIcon, BookOpenIcon, CogIcon, WaterDropIcon, ClipboardDocumentCheckIcon } from './icons';

const menuItems = [
  { 
    view: 'profile' as AppView, 
    title: 'ข้อมูลส่วนตัว', 
    description: 'บันทึกข้อมูลสุขภาพของคุณ', 
    icon: <UserCircleIcon className="w-10 h-10" />, 
    color: 'text-green-500',
    bgColor: 'bg-green-50 dark:bg-green-900/50',
    borderColor: 'hover:border-green-500'
  },
  { 
    view: 'dashboard' as AppView, 
    title: 'แดชบอร์ด', 
    description: 'สรุปข้อมูลสุขภาพของคุณ', 
    icon: <SquaresIcon className="w-10 h-10" />, 
    color: 'text-sky-500',
    bgColor: 'bg-sky-50 dark:bg-sky-900/50',
    borderColor: 'hover:border-sky-500'
  },
  { 
    view: 'assessment' as AppView, 
    title: 'ประเมิน 6 เสาหลัก', 
    description: 'Lifestyle Balance Check', 
    icon: <ClipboardDocumentCheckIcon className="w-10 h-10" />, 
    color: 'text-teal-500',
    bgColor: 'bg-teal-50 dark:bg-teal-900/50',
    borderColor: 'hover:border-teal-500'
  },
  { 
    view: 'planner' as AppView, 
    title: 'นักวางแผนโภชนาการ', 
    description: 'สร้างแผนอาหาร 7 วัน', 
    icon: <ClipboardListIcon className="w-10 h-10" />, 
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-50 dark:bg-emerald-900/50',
    borderColor: 'hover:border-emerald-500'
  },
  { 
    view: 'food' as AppView, 
    title: 'วิเคราะห์อาหาร', 
    description: 'ประเมินแคลอรี่จากรูปภาพ', 
    icon: <CameraIcon className="w-10 h-10" />, 
    color: 'text-purple-500',
    bgColor: 'bg-purple-50 dark:bg-purple-900/50',
    borderColor: 'hover:border-purple-500'
  },
  { 
    view: 'water' as AppView, 
    title: 'บันทึกการดื่มน้ำ', 
    description: 'ติดตามปริมาณน้ำต่อวัน', 
    icon: <WaterDropIcon className="w-10 h-10" />, 
    color: 'text-blue-500',
    bgColor: 'bg-blue-50 dark:bg-blue-900/50',
    borderColor: 'hover:border-blue-500'
  },
   { 
    view: 'coach' as AppView, 
    title: 'โค้ช AI', 
    description: 'รับคำแนะนำสุขภาพส่วนตัว', 
    icon: <SparklesIcon className="w-10 h-10" />, 
    color: 'text-indigo-500',
    bgColor: 'bg-indigo-50 dark:bg-indigo-900/50',
    borderColor: 'hover:border-indigo-500'
  },
  { 
    view: 'literacy' as AppView, 
    title: 'ความรู้โภชนาการ', 
    description: 'อ่านบทความสุขภาพ', 
    icon: <BookOpenIcon className="w-10 h-10" />, 
    color: 'text-rose-500',
    bgColor: 'bg-rose-50 dark:bg-rose-900/50',
    borderColor: 'hover:border-rose-500'
  },
  { 
    view: 'bmi' as AppView, 
    title: 'คำนวณ BMI', 
    description: 'วัดดัชนีมวลกาย', 
    icon: <ScaleIcon className="w-10 h-10" />, 
    color: 'text-red-500',
    bgColor: 'bg-red-50 dark:bg-red-900/50',
    borderColor: 'hover:border-red-500'
  },
  { 
    view: 'tdee' as AppView, 
    title: 'คำนวณ TDEE', 
    description: 'การเผาผลาญพลังงาน', 
    icon: <FireIcon className="w-10 h-10" />, 
    color: 'text-orange-500',
    bgColor: 'bg-orange-50 dark:bg-orange-900/50',
    borderColor: 'hover:border-orange-500'
  },
  { 
    view: 'settings' as AppView, 
    title: 'ตั้งค่า', 
    description: 'เชื่อมต่อกับ Google Sheets', 
    icon: <CogIcon className="w-10 h-10" />, 
    color: 'text-gray-500',
    bgColor: 'bg-gray-100 dark:bg-gray-700/50',
    borderColor: 'hover:border-gray-500'
  },
];

const HomeMenu: React.FC = () => {
  const { setActiveView } = useContext(AppContext);
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
      {menuItems.map((item) => (
        <button
          key={item.view}
          onClick={() => setActiveView(item.view)}
          className={`group bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg w-full text-left transform transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border-b-4 border-transparent ${item.borderColor}`}
        >
          <div className="flex items-center gap-4">
              <div className={`p-4 rounded-xl ${item.bgColor}`}>
                <div className={`transition-transform duration-300 group-hover:scale-110 ${item.color}`}>
                    {item.icon}
                </div>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-800 dark:text-white">{item.title}</h3>
                <p className="text-gray-600 dark:text-gray-300 mt-1">{item.description}</p>
              </div>
          </div>
        </button>
      ))}
    </div>
  );
};

export default HomeMenu;