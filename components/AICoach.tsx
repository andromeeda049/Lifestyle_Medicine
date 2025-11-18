import React, { useState, useContext, useMemo } from 'react';
import { AppContext } from '../context/AppContext';
import { getHealthCoachingTip } from '../services/geminiService';
import { SparklesIcon } from './icons';
import { SPECIALIST_TEAM } from '../constants';
import { SpecialistId } from '../types';

const quickTips = [
  { category: 'การดื่มน้ำ', tip: 'ดื่มน้ำให้เพียงพอตลอดวัน อย่างน้อย 8 แก้ว เพื่อให้ร่างกายสดชื่น' },
  { category: 'การเคลื่อนไหว', tip: 'ลุกขึ้นยืดเส้นยืดสายทุกๆ ชั่วโมง เพื่อลดอาการปวดเมื่อยจากการนั่งนานๆ' },
  { category: 'อาหาร', tip: 'ลองเพิ่มผักหลากสีในมื้ออาหารของคุณ เพื่อให้ได้วิตามินและแร่ธาตุที่หลากหลาย' },
  { category: 'การพักผ่อน', tip: 'นอนหลับให้ได้ 7-9 ชั่วโมงต่อคืน เพื่อการฟื้นฟูร่างกายและสมองที่ดีที่สุด' },
];

const AICoach: React.FC = () => {
  const [tip, setTip] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedSpecialist, setSelectedSpecialist] = useState<SpecialistId>('general');
  const { bmiHistory, tdeeHistory, latestFoodAnalysis, apiKey, currentUser, waterHistory, userProfile } = useContext(AppContext);

  const isGuest = currentUser?.role === 'guest';

  // Calculate water intake for today
  const waterIntakeToday = useMemo(() => {
    const today = new Date().toLocaleDateString('en-CA');
    return waterHistory
        .filter(entry => new Date(entry.date).toLocaleDateString('en-CA') === today)
        .reduce((sum, entry) => sum + entry.amount, 0);
  }, [waterHistory]);

  const handleGetTip = async () => {
    if (isGuest) return;
    setLoading(true);
    setError(null);
    setTip(null);
    try {
      const latestBmi = bmiHistory[0];
      const latestTdee = tdeeHistory[0];
      const tipResult = await getHealthCoachingTip({
        bmi: latestBmi,
        tdee: latestTdee,
        food: latestFoodAnalysis,
        waterIntake: waterIntakeToday,
        userProfile: userProfile,
        specialistId: selectedSpecialist
      }, apiKey);
      setTip(tipResult);
    } catch (err: any) {
      setError(err.message || 'เกิดข้อผิดพลาดที่ไม่คาดคิด');
    } finally {
      setLoading(false);
    }
  };

  const Spinner = () => (
    <div className="flex flex-col items-center justify-center gap-4 py-8">
      <div className="w-12 h-12 border-4 border-t-indigo-500 border-gray-200 dark:border-gray-600 rounded-full animate-spin"></div>
      <p className="text-indigo-600 dark:text-indigo-400 font-medium">กำลังปรึกษาทีมผู้เชี่ยวชาญ...</p>
    </div>
  );

  return (
    <div className="bg-white dark:bg-gray-800 p-6 md:p-8 rounded-2xl shadow-lg w-full transform transition-all duration-300">
      <div className="text-center mb-6">
        <SparklesIcon className="w-16 h-16 mx-auto text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-pink-500" />
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mt-4">ทีมผู้เชี่ยวชาญ AI (Hybrid Health Coach)</h2>
        <p className="text-gray-600 dark:text-gray-300 mt-2">
          เลือกผู้เชี่ยวชาญเพื่อขอคำแนะนำเฉพาะด้าน สำหรับดูแลสุขภาพแบบองค์รวม
        </p>
      </div>

      {/* Specialist Selection */}
      <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-3 text-center uppercase tracking-wide">เลือกผู้เชี่ยวชาญ</h3>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {SPECIALIST_TEAM.map((specialist) => (
                  <button
                      key={specialist.id}
                      onClick={() => setSelectedSpecialist(specialist.id as SpecialistId)}
                      className={`flex flex-col items-center justify-center p-2 rounded-lg border-2 transition-all duration-200 ${
                          selectedSpecialist === specialist.id 
                          ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/50 scale-105' 
                          : 'border-gray-200 dark:border-gray-700 hover:border-indigo-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                  >
                      <span className="text-2xl mb-1">{specialist.icon}</span>
                      <span className="text-[10px] font-semibold text-gray-700 dark:text-gray-300 text-center leading-tight">{specialist.name}</span>
                  </button>
              ))}
          </div>
          <div className="text-center mt-2">
              <span className="text-xs text-indigo-600 dark:text-indigo-400">
                  กำลังปรึกษา: {SPECIALIST_TEAM.find(s => s.id === selectedSpecialist)?.role}
              </span>
          </div>
      </div>

      <div className="mt-4 relative">
        <button
          onClick={handleGetTip}
          disabled={loading || isGuest}
          className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-bold py-3 px-4 rounded-lg hover:from-indigo-600 hover:to-purple-600 focus:outline-none focus:ring-4 focus:ring-indigo-300 dark:focus:ring-indigo-800 transition-all duration-300 transform hover:scale-105 disabled:opacity-70 disabled:cursor-not-allowed disabled:scale-100"
        >
          {loading ? 'กำลังวิเคราะห์...' : `ขอคำแนะนำจาก ${SPECIALIST_TEAM.find(s => s.id === selectedSpecialist)?.name}`}
        </button>
        {isGuest && (
            <div className="absolute inset-0 bg-white/80 dark:bg-gray-800/80 flex items-center justify-center rounded-lg text-center p-4">
                <p className="font-semibold text-gray-700 dark:text-gray-300">🔒 กรุณาสร้างโปรไฟล์เพื่อใช้งานฟีเจอร์ AI</p>
            </div>
        )}
      </div>
      
      <div className="mt-8 min-h-[10rem] flex items-center justify-center">
        {loading && <Spinner />}
        {error && <p className="text-center text-red-500 bg-red-100 dark:bg-red-900/50 dark:text-red-400 p-3 rounded-lg">{error}</p>}
        {tip && (
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-gray-700 dark:to-slate-800 p-6 rounded-xl shadow-inner w-full animate-fade-in relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-10">
                 <span className="text-8xl">{SPECIALIST_TEAM.find(s => s.id === selectedSpecialist)?.icon}</span>
             </div>
            <h4 className="font-bold text-indigo-800 dark:text-indigo-300 mb-2 flex items-center gap-2">
                {SPECIALIST_TEAM.find(s => s.id === selectedSpecialist)?.icon} คำแนะนำจากผู้เชี่ยวชาญ:
            </h4>
            <p className="text-lg text-gray-800 dark:text-gray-100 leading-relaxed" style={{whiteSpace: 'pre-wrap'}}>
                {tip}
            </p>
          </div>
        )}
         {!loading && !error && !tip && (
            <div className="text-center text-gray-500 dark:text-gray-400 w-full">
                <div className="border-t border-gray-200 dark:border-gray-700 my-8"></div>
                <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-4">เคล็ดลับด่วน (Quick Tips)</h3>
                <div className="space-y-3 text-left">
                    {quickTips.map((quickTip, index) => (
                        <div key={index} className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg border-l-4 border-teal-400">
                            <span className="inline-block bg-teal-100 dark:bg-teal-900/80 text-teal-800 dark:text-teal-300 text-xs font-semibold px-2.5 py-0.5 rounded-full mb-2">
                                {quickTip.category}
                            </span>
                            <p className="text-gray-700 dark:text-gray-300 text-sm">{quickTip.tip}</p>
                        </div>
                    ))}
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default AICoach;