
import React, { useContext } from 'react';
import { AppView } from '../types';
import { AppContext } from '../context/AppContext';
import { ScaleIcon, FireIcon, CameraIcon, SparklesIcon, ClipboardListIcon, SquaresIcon, UserCircleIcon, BookOpenIcon, CogIcon, WaterDropIcon, ClipboardDocumentCheckIcon, BeakerIcon, BoltIcon, HeartIcon, InformationCircleIcon, ClipboardCheckIcon } from './icons';

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
    title: 'แดชบอร์ดสุขภาพ', 
    description: 'สรุปภาพรวมสุขภาพ 6 มิติ', 
    icon: <SquaresIcon className="w-10 h-10" />, 
    color: 'text-sky-500',
    bgColor: 'bg-sky-50 dark:bg-sky-900/50',
    borderColor: 'hover:border-sky-500'
  },
  { 
    view: 'assessment' as AppView, 
    title: 'ประเมิน 6 เสาหลัก', 
    description: 'ตรวจสอบสมดุลไลฟ์สไตล์', 
    icon: <ClipboardDocumentCheckIcon className="w-10 h-10" />, 
    color: 'text-teal-500',
    bgColor: 'bg-teal-50 dark:bg-teal-900/50',
    borderColor: 'hover:border-teal-500'
  },
  { 
    view: 'wellness' as AppView, 
    title: 'เช็คอินสุขภาพประจำวัน', 
    description: 'บันทึกการนอน อารมณ์ นิสัย', 
    icon: <HeartIcon className="w-10 h-10" />, 
    color: 'text-rose-500',
    bgColor: 'bg-rose-50 dark:bg-rose-900/50',
    borderColor: 'hover:border-rose-500',
    isAi: true
  },
  { 
    view: 'calorieTracker' as AppView, 
    title: 'บันทึกแคลอรี่', 
    description: 'ติดตามพลังงานที่บริโภค', 
    icon: <BeakerIcon className="w-10 h-10" />, 
    color: 'text-orange-500',
    bgColor: 'bg-orange-50 dark:bg-orange-900/50',
    borderColor: 'hover:border-orange-500'
  },
  { 
    view: 'activityTracker' as AppView, 
    title: 'บันทึกกิจกรรม', 
    description: 'ติดตามพลังงานที่เผาผลาญ', 
    icon: <BoltIcon className="w-10 h-10" />, 
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-50 dark:bg-yellow-900/50',
    borderColor: 'hover:border-yellow-500'
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
    view: 'planner' as AppView, 
    title: 'แผนไลฟ์สไตล์ (AI)', 
    description: 'สร้างแผนอาหารและกิจกรรม', 
    icon: <ClipboardListIcon className="w-10 h-10" />, 
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-50 dark:bg-emerald-900/50',
    borderColor: 'hover:border-emerald-500',
    isAi: true
  },
  { 
    view: 'food' as AppView, 
    title: 'วิเคราะห์อาหาร (AI)', 
    description: 'ประเมินผลกระทบต่อสุขภาพ', 
    icon: <CameraIcon className="w-10 h-10" />, 
    color: 'text-purple-500',
    bgColor: 'bg-purple-50 dark:bg-purple-900/50',
    borderColor: 'hover:border-purple-500',
    isAi: true
  },
   { 
    view: 'coach' as AppView, 
    title: 'โค้ชสุขภาพ (AI)', 
    description: 'รับคำแนะนำเฉพาะบุคคล', 
    icon: <SparklesIcon className="w-10 h-10" />, 
    color: 'text-indigo-500',
    bgColor: 'bg-indigo-50 dark:bg-indigo-900/50',
    borderColor: 'hover:border-indigo-500',
    isAi: true
  },
  { 
    view: 'literacy' as AppView, 
    title: 'ความรู้ LM', 
    description: 'อ่านบทความสุขภาพ', 
    icon: <BookOpenIcon className="w-10 h-10" />, 
    color: 'text-rose-500',
    bgColor: 'bg-rose-50 dark:bg-rose-900/50',
    borderColor: 'hover:border-rose-500'
  },
  { 
    view: 'bmi' as AppView, 
    title: 'เครื่องมือ BMI', 
    description: 'วัดดัชนีมวลกาย', 
    icon: <ScaleIcon className="w-10 h-10" />, 
    color: 'text-red-500',
    bgColor: 'bg-red-50 dark:bg-red-900/50',
    borderColor: 'hover:border-red-500'
  },
  { 
    view: 'tdee' as AppView, 
    title: 'เครื่องมือ TDEE', 
    description: 'การเผาผลาญพลังงาน', 
    icon: <FireIcon className="w-10 h-10" />, 
    color: 'text-orange-500',
    bgColor: 'bg-orange-50 dark:bg-orange-900/50',
    borderColor: 'hover:border-orange-500'
  },
  { 
    view: 'evaluation' as AppView, 
    title: 'ประเมินผลการใช้งาน', 
    description: 'ความพึงพอใจ & ผลลัพธ์', 
    icon: <ClipboardCheckIcon className="w-10 h-10" />, 
    color: 'text-violet-600',
    bgColor: 'bg-violet-50 dark:bg-violet-900/50',
    borderColor: 'hover:border-violet-600'
  },
  { 
    view: 'about' as AppView, 
    title: 'เกี่ยวกับนวัตกรรม & คู่มือ', 
    description: 'แนวคิดและการใช้งาน', 
    icon: <InformationCircleIcon className="w-10 h-10" />, 
    color: 'text-teal-600',
    bgColor: 'bg-teal-50 dark:bg-teal-900/50',
    borderColor: 'hover:border-teal-600'
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
              <div className={`p-4 rounded-xl ${item.bgColor} relative`}>
                <div className={`transition-transform duration-300 group-hover:scale-110 ${item.color}`}>
                    {item.icon}
                </div>
                {(item as any).isAi && (
                    <span className="absolute -top-2 -right-2 bg-gradient-to-r from-pink-500 to-rose-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm animate-pulse border border-white dark:border-gray-800">
                        AI
                    </span>
                )}
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