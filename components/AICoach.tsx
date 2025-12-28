
import React, { useState, useContext, useMemo, useEffect } from 'react';
import { AppContext } from '../context/AppContext';
import { getHealthCoachingTip } from '../services/geminiService';
import { SparklesIcon } from './icons';
import { SPECIALIST_TEAM } from '../constants';
import { SpecialistId } from '../types';

const AICoach: React.FC = () => {
  const [tip, setTip] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedSpecialist, setSelectedSpecialist] = useState<SpecialistId>('general');
  const [canConsult, setCanConsult] = useState(true);
  const { bmiHistory, tdeeHistory, latestFoodAnalysis, currentUser, waterHistory, userProfile } = useContext(AppContext);

  const isGuest = currentUser?.role === 'guest';

  const waterIntakeToday = useMemo(() => {
    const today = new Date().toLocaleDateString('en-CA');
    return waterHistory
        .filter(entry => new Date(entry.date).toLocaleDateString('en-CA') === today)
        .reduce((sum, entry) => sum + entry.amount, 0);
  }, [waterHistory]);

  // Check Daily Limit on Mount
  useEffect(() => {
      if (currentUser && !isGuest) {
          const todayStr = new Date().toDateString();
          const lastConsult = localStorage.getItem(`last_coach_consult_${currentUser.username}`);
          if (lastConsult === todayStr) {
              setCanConsult(false);
          }
      }
  }, [currentUser, isGuest]);

  const handleGetTip = async () => {
    if (isGuest) return;
    if (!canConsult) return;

    setLoading(true);
    setError(null);
    setTip(null);
    try {
      const tipResult = await getHealthCoachingTip({
        bmi: bmiHistory[0],
        tdee: tdeeHistory[0],
        food: latestFoodAnalysis,
        waterIntake: waterIntakeToday,
        userProfile: userProfile,
        specialistId: selectedSpecialist
      });
      setTip(tipResult);
      
      // Save consultation timestamp
      const todayStr = new Date().toDateString();
      localStorage.setItem(`last_coach_consult_${currentUser?.username}`, todayStr);
      setCanConsult(false);

    } catch (err: any) {
      setError(err.message || 'เกิดข้อผิดพลาดที่ไม่คาดคิด');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 md:p-8 rounded-2xl shadow-lg w-full">
      <div className="text-center mb-6">
        <SparklesIcon className="w-16 h-16 mx-auto text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-pink-500" />
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mt-4">ทีมผู้เชี่ยวชาญ AI (Hybrid Health Coach)</h2>
      </div>

      <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-500 mb-3 text-center uppercase tracking-wide">เลือกผู้เชี่ยวชาญ</h3>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {SPECIALIST_TEAM.map((specialist) => (
                  <button
                      key={specialist.id}
                      onClick={() => setSelectedSpecialist(specialist.id as SpecialistId)}
                      className={`flex flex-col items-center justify-center p-2 rounded-lg border-2 transition-all ${
                          selectedSpecialist === specialist.id 
                          ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/50 scale-105' 
                          : 'border-gray-200 dark:border-gray-700 hover:border-indigo-300'
                      }`}
                  >
                      <span className="text-2xl mb-1">{specialist.icon}</span>
                      <span className="text-[10px] font-semibold text-gray-700 dark:text-gray-300 text-center leading-tight">{specialist.name}</span>
                  </button>
              ))}
          </div>
      </div>

      <div className="mt-4 relative">
        <button
          onClick={handleGetTip}
          disabled={loading || isGuest || !canConsult}
          className={`w-full font-bold py-3 rounded-lg disabled:opacity-70 transition-colors ${
              canConsult 
              ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:from-indigo-600'
              : 'bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400 cursor-not-allowed'
          }`}
        >
          {loading ? 'กำลังวิเคราะห์...' : !canConsult ? 'ครบโควตาปรึกษาวันนี้แล้ว' : `ขอคำแนะนำจาก ${SPECIALIST_TEAM.find(s => s.id === selectedSpecialist)?.name}`}
        </button>
        {isGuest && <div className="absolute inset-0 bg-white/80 dark:bg-gray-800/80 flex items-center justify-center rounded-lg text-center p-4"><p className="font-semibold text-gray-700 dark:text-gray-300">🔒 กรุณาสร้างโปรไฟล์เพื่อใช้งาน</p></div>}
        {!canConsult && !loading && (
            <p className="text-xs text-center text-gray-400 mt-2">
                *สามารถปรึกษาได้วันละ 1 ครั้ง เพื่อให้คุณนำคำแนะนำไปปรับใช้จริง
            </p>
        )}
      </div>
      
      <div className="mt-8 min-h-[10rem] flex items-center justify-center">
        {loading && <div className="w-12 h-12 border-4 border-t-indigo-500 border-gray-200 rounded-full animate-spin"></div>}
        {error && <p className="text-center text-red-500 bg-red-100 p-3 rounded-lg">{error}</p>}
        {tip && (
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-gray-700 p-6 rounded-xl shadow-inner w-full animate-fade-in relative overflow-hidden">
            <h4 className="font-bold text-indigo-800 dark:text-indigo-300 mb-2 flex items-center gap-2">💡 คำแนะนำ:</h4>
            <p className="text-lg text-gray-800 dark:text-gray-100 leading-relaxed">{tip}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AICoach;
