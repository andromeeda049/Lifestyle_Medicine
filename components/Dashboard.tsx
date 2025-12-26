
import React, { useContext, useState, useMemo } from 'react';
import { AppContext } from '../context/AppContext';
import { AppView, PillarScore } from '../types';
import { ScaleIcon, FireIcon, CameraIcon, ShareIcon, WaterDropIcon, BeakerIcon, BoltIcon, ChartBarIcon, BookOpenIcon, StarIcon, TrophyIcon, ClipboardCheckIcon, UserCircleIcon, UserGroupIcon, PrinterIcon, HeartIcon } from './icons';
import { PILLAR_LABELS, LEVEL_THRESHOLDS } from '../constants';
import GamificationCard from './GamificationCard';

// --- Health Status Logic (Medical Context) ---
const getHealthStatus = (score: number) => {
    if (score >= 80) return { level: 'ภาวะสุขภาพดีเยี่ยม', sub: 'Excellent', color: 'text-green-600 dark:text-green-400', bg: 'bg-green-100 dark:bg-green-900/30', border: 'border-green-500' };
    if (score >= 70) return { level: 'ภาวะสุขภาพดี', sub: 'Good', color: 'text-teal-600 dark:text-teal-400', bg: 'bg-teal-100 dark:bg-teal-900/30', border: 'border-teal-500' };
    if (score >= 60) return { level: 'ความเสี่ยงปานกลาง', sub: 'Fair', color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-100 dark:bg-yellow-900/30', border: 'border-yellow-500' };
    if (score >= 50) return { level: 'เริ่มมีความเสี่ยง', sub: 'Improvement Needed', color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-100 dark:bg-orange-900/30', border: 'border-orange-500' };
    return { level: 'ความเสี่ยงสูง', sub: 'High Risk', color: 'text-red-600 dark:text-red-400', bg: 'bg-red-100 dark:bg-red-900/30', border: 'border-red-500' };
};

const getBmiStatus = (bmi: number) => {
    if (bmi >= 18.5 && bmi <= 22.9) return { label: 'สมส่วน (Normal)', color: 'text-green-600 dark:text-green-400', bg: 'bg-green-100 dark:bg-green-900/30' };
    if (bmi >= 23 && bmi <= 24.9) return { label: 'น้ำหนักเกิน (Overweight)', color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-100 dark:bg-yellow-900/30' };
    if (bmi < 18.5) return { label: 'น้ำหนักน้อย (Underweight)', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-900/30' };
    if (bmi >= 25 && bmi <= 29.9) return { label: 'โรคอ้วนระดับ 1 (Obese I)', color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-100 dark:bg-orange-900/30' };
    return { label: 'โรคอ้วนระดับ 2 (Obese II)', color: 'text-red-600 dark:text-red-400', bg: 'bg-red-100 dark:bg-red-900/30' };
};

// --- Health Summary Component ---
const HealthSummaryCard: React.FC<{ 
    userProfile: any, 
    displayName: string,
    bmiHistory: any[], 
    waterScore: number, 
    activityScore: number,
    sleepScore: number,
    moodScore: number
}> = ({ userProfile, displayName, bmiHistory, waterScore, activityScore, sleepScore, moodScore }) => {
    
    // Calculate Indicators
    const pillarScores: PillarScore = userProfile.pillarScores || { nutrition: 5, activity: 5, sleep: 5, stress: 5, substance: 5, social: 5 };
    
    // Normalize 1-10 scale to 0-100
    // Logic: Use daily log score if available/higher, otherwise fallback to assessment score
    const indicators = [
        { id: 'nutrition', name: 'ด้านโภชนาการ (Nutrition)', score: Math.max(pillarScores.nutrition * 10, waterScore), icon: '🥗' }, // Water as proxy for daily intake habit
        { id: 'activity', name: 'ด้านกิจกรรมทางกาย (Physical Activity)', score: Math.max(pillarScores.activity * 10, activityScore), icon: '💪' }, 
        { id: 'sleep', name: 'คุณภาพการนอนหลับ (Sleep Quality)', score: sleepScore > 0 ? sleepScore : pillarScores.sleep * 10, icon: '😴' },
        { id: 'stress', name: 'สุขภาพจิตและการจัดการความเครียด (Mental Health)', score: moodScore > 0 ? moodScore : pillarScores.stress * 10, icon: '🧠' },
        { id: 'risk', name: 'การลดพฤติกรรมเสี่ยง (Risk Reduction)', score: pillarScores.substance * 10, icon: '🚫' },
        { id: 'social', name: 'ความสัมพันธ์ทางสังคม (Social Wellbeing)', score: pillarScores.social * 10, icon: '🤝' },
    ];

    // Calculate Average Score
    const totalScore = indicators.reduce((sum, sub) => sum + sub.score, 0) / indicators.length;
    const overallStatus = getHealthStatus(totalScore);

    // BMI Comparison (Pre-Post)
    const currentBmi = bmiHistory.length > 0 ? bmiHistory[0].value : 0;
    const startBmi = bmiHistory.length > 1 ? bmiHistory[bmiHistory.length - 1].value : currentBmi;
    const bmiDiff = currentBmi - startBmi;
    const bmiStatus = getBmiStatus(currentBmi);

    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden border border-gray-200 dark:border-gray-700 print:shadow-none print:border-2 print:border-black">
            {/* Header: Official Medical/Health Style */}
            <div className="bg-gradient-to-r from-teal-700 to-emerald-600 p-6 text-white relative">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10">
                    <div>
                        <h2 className="text-2xl font-bold flex items-center gap-2">
                            <ClipboardCheckIcon className="w-8 h-8" />
                            รายงานสุขภาพส่วนบุคคล
                        </h2>
                        <p className="text-teal-100 opacity-90 text-sm font-light">Personal Health Summary & Lifestyle Assessment</p>
                    </div>
                    <div className="text-right">
                        <div className="bg-white/10 px-4 py-2 rounded-lg backdrop-blur-sm border border-white/20">
                            <p className="text-xs text-teal-100">ผู้รับบริการ</p>
                            <p className="font-bold text-lg">{displayName || 'Guest'}</p>
                            <p className="text-xs opacity-75">ID: {userProfile.researchId || '-'}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="p-6 md:p-8 space-y-8">
                {/* 1. Overall Status Section */}
                <div className="flex flex-col md:flex-row gap-6 items-center bg-gray-50 dark:bg-gray-700/30 p-6 rounded-xl border border-gray-100 dark:border-gray-700">
                    <div className="relative w-32 h-32 flex-shrink-0">
                        <svg className="w-full h-full transform -rotate-90">
                            <circle cx="50%" cy="50%" r="56" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-gray-200 dark:text-gray-600" />
                            <circle cx="50%" cy="50%" r="56" stroke="currentColor" strokeWidth="8" fill="transparent" 
                                strokeDasharray={2 * Math.PI * 56} 
                                strokeDashoffset={(2 * Math.PI * 56) * (1 - totalScore / 100)} 
                                className={`${overallStatus.color} transition-all duration-1000`} 
                            />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className={`text-3xl font-bold ${overallStatus.color}`}>{totalScore.toFixed(0)}</span>
                            <span className="text-[10px] text-gray-400">คะแนนรวม</span>
                        </div>
                    </div>
                    
                    <div className="flex-1 text-center md:text-left">
                        <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">สถานะสุขภาพภาพรวม (Overall Status)</h3>
                        <h2 className={`text-2xl md:text-3xl font-bold ${overallStatus.color} mt-1 mb-2`}>{overallStatus.level}</h2>
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${overallStatus.bg} ${overallStatus.color}`}>
                            {overallStatus.sub}
                        </span>
                        
                        <div className="grid grid-cols-2 gap-4 mt-6">
                            <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-600 shadow-sm">
                                <p className="text-xs text-gray-500">ดัชนีมวลกาย (BMI)</p>
                                <div className="flex items-center gap-2">
                                    <span className={`font-bold text-lg ${bmiStatus.color}`}>{currentBmi.toFixed(1)}</span>
                                    <span className="text-[10px] text-gray-400">{bmiStatus.label}</span>
                                </div>
                            </div>
                            <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-600 shadow-sm">
                                <p className="text-xs text-gray-500">การเปลี่ยนแปลง (Trend)</p>
                                <div className="flex items-center gap-1">
                                    <span className={`font-bold text-lg ${bmiDiff <= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                        {bmiDiff > 0 ? '+' : ''}{bmiDiff.toFixed(1)}
                                    </span>
                                    <span className="text-xs text-gray-400">จุด (จากจุดเริ่มต้น)</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. Indicators (The Pillars) */}
                <div>
                    <h4 className="text-lg font-bold text-gray-800 dark:text-white border-l-4 border-teal-500 pl-3 mb-4">
                        ตัวชี้วัดสุขภาพ 6 มิติ (6 Pillars Indicators)
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {indicators.map((ind) => {
                            const status = getHealthStatus(ind.score);
                            return (
                                <div key={ind.id} className="flex items-center justify-between p-4 rounded-xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-700/50 hover:shadow-md transition-shadow">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl ${status.bg}`}>
                                            {ind.icon}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-gray-700 dark:text-gray-200 text-sm">{ind.name}</p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <div className="w-20 h-1.5 bg-gray-200 dark:bg-gray-600 rounded-full">
                                                    <div 
                                                        className={`h-1.5 rounded-full ${status.color.replace('text', 'bg')}`} 
                                                        style={{ width: `${ind.score}%` }}
                                                    ></div>
                                                </div>
                                                <span className={`text-xs font-bold ${status.color}`}>{ind.score.toFixed(0)}%</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className={`px-2 py-1 rounded text-[10px] font-medium border ${status.border} ${status.color} bg-opacity-10`}>
                                        {status.sub}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* 3. AI Coach Summary */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/10 p-5 rounded-xl border border-blue-100 dark:border-blue-800">
                    <h4 className="font-bold text-blue-800 dark:text-blue-300 mb-2 flex items-center gap-2">
                        <HeartIcon className="w-5 h-5" />
                        สรุปผลและคำแนะนำ (AI Health Insight)
                    </h4>
                    <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                        "จากการประเมินเบื้องต้น คุณ{displayName} มีภาพรวมสุขภาพอยู่ในระดับ <strong>{overallStatus.level}</strong> 
                        {overallStatus.level.includes('เสี่ยง') 
                            ? ' ควรให้ความสำคัญกับการปรับพฤติกรรมในด้านที่มีคะแนนน้อยที่สุดก่อน เพื่อลดความเสี่ยงต่อโรค NCDs ในระยะยาว' 
                            : ' ถือเป็นสัญญาณที่ดีมาก ควรจดบันทึกและรักษาพฤติกรรมนี้ไว้อย่างต่อเนื่อง'} 
                        โดยเฉพาะ <strong>{indicators.sort((a,b) => a.score - b.score)[0].name.split('(')[0]}</strong> ที่ควรได้รับการดูแลเป็นพิเศษ"
                    </p>
                    <div className="mt-3 text-xs text-gray-500 text-right">
                        *ข้อมูลนี้เป็นการประเมินเบื้องต้น ไม่สามารถทดแทนคำวินิจฉัยของแพทย์ได้
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- Comparison Chart Component (Renamed) ---
const TrendAnalysis: React.FC<{ bmiHistory: any[] }> = ({ bmiHistory }) => {
    if (bmiHistory.length < 2) return null;
    const sorted = [...bmiHistory].sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const baseline = sorted[0];
    const current = sorted[sorted.length - 1];
    const diff = current.value - baseline.value;
    const isBetter = diff <= 0; 

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border-l-4 border-purple-500">
            <h4 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2 mb-4">
                <ChartBarIcon className="w-5 h-5 text-purple-500" />
                วิเคราะห์แนวโน้ม (Trend Analysis)
            </h4>
            <div className="flex items-center justify-around">
                <div className="text-center">
                    <p className="text-xs text-gray-500 dark:text-gray-400">ค่าเริ่มต้น (Baseline)</p>
                    <p className="text-2xl font-bold text-gray-700 dark:text-gray-200">{baseline.value.toFixed(1)}</p>
                    <p className="text-[10px] text-gray-400">{new Date(baseline.date).toLocaleDateString('th-TH')}</p>
                </div>
                <div className="text-gray-300">➜</div>
                <div className="text-center">
                    <p className="text-xs text-gray-500 dark:text-gray-400">ปัจจุบัน (Current)</p>
                    <p className="text-2xl font-bold text-gray-700 dark:text-gray-200">{current.value.toFixed(1)}</p>
                    <p className="text-[10px] text-gray-400">{new Date(current.date).toLocaleDateString('th-TH')}</p>
                </div>
                <div className="text-center bg-gray-50 dark:bg-gray-700 px-4 py-2 rounded-lg">
                    <p className="text-xs text-gray-500 dark:text-gray-400">ผลต่าง (Diff)</p>
                    <p className={`text-2xl font-bold ${isBetter ? 'text-green-500' : 'text-red-500'}`}>
                        {diff > 0 ? '+' : ''}{diff.toFixed(1)}
                    </p>
                </div>
            </div>
        </div>
    );
}

const Dashboard: React.FC = () => {
  const { setActiveView, bmiHistory, waterHistory, waterGoal, activityHistory, userProfile, currentUser, quizHistory, sleepHistory, moodHistory } = useContext(AppContext);

  const sortedBmiHistory = useMemo(() => {
      return [...bmiHistory].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [bmiHistory]);

  const isToday = (someDate: Date) => {
    const today = new Date();
    return someDate.getDate() === today.getDate() &&
        someDate.getMonth() === today.getMonth() &&
        someDate.getFullYear() === today.getFullYear();
  };

  const waterIntakeToday = useMemo(() => waterHistory.filter(entry => isToday(new Date(entry.date))).reduce((sum, entry) => sum + entry.amount, 0), [waterHistory]);
  const caloriesBurnedToday = useMemo(() => activityHistory.filter(entry => isToday(new Date(entry.date))).reduce((sum, entry) => sum + entry.caloriesBurned, 0), [activityHistory]);

  // Calculate scores for dynamic inputs
  const waterScore = Math.min(100, (waterIntakeToday / waterGoal) * 100);
  const activityScore = Math.min(100, (caloriesBurnedToday / 300) * 100); 

  // Sleep Score (Today) - Quality 1-5 maps to 20-100
  const sleepToday = useMemo(() => sleepHistory.find(entry => isToday(new Date(entry.date))), [sleepHistory]);
  const sleepScore = sleepToday ? (sleepToday.quality * 20) : 0;

  // Mood/Stress Score (Today) - Stress 1 (Good) -> 100, Stress 10 (Bad) -> 10
  const moodToday = useMemo(() => moodHistory.find(entry => isToday(new Date(entry.date))), [moodHistory]);
  const moodScore = moodToday ? (11 - moodToday.stressLevel) * 10 : 0;

  const handlePrint = () => {
      window.print();
  };

  return (
    <div className="space-y-8 animate-fade-in relative">
        <GamificationCard />
        
        {/* REPORT CARD (NOW HEALTH SUMMARY) */}
        <HealthSummaryCard 
            userProfile={userProfile} 
            displayName={currentUser?.displayName || 'Guest'}
            bmiHistory={sortedBmiHistory} 
            waterScore={waterScore}
            activityScore={activityScore}
            sleepScore={sleepScore}
            moodScore={moodScore}
        />

        <div className="flex flex-wrap justify-center gap-4 print:hidden">
             <button
                onClick={handlePrint}
                className="flex items-center gap-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-bold py-2 px-6 rounded-full hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
                <PrinterIcon className="w-5 h-5" />
                พิมพ์รายงาน
            </button>
            <button
                onClick={() => setActiveView('assessment')}
                className="flex items-center gap-2 bg-teal-600 text-white font-bold py-2 px-6 rounded-full hover:bg-teal-700 transition-colors shadow-lg"
            >
                <ClipboardCheckIcon className="w-5 h-5" />
                ประเมินผลใหม่ (Update Data)
            </button>
        </div>

        {/* --- DETAILED METRICS --- */}
        <div className="print:hidden">
            <h3 className="text-lg font-bold text-gray-500 dark:text-gray-400 mb-4 uppercase tracking-wide text-center">— ข้อมูลสุขภาพเชิงลึก (Detailed Metrics) —</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {sortedBmiHistory.length > 0 && (
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg">
                        <h4 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                            <ScaleIcon className="w-6 h-6 text-red-500" />
                            ติดตามค่า BMI
                        </h4>
                        <TrendAnalysis bmiHistory={bmiHistory} />
                        <div className="mt-4 text-center">
                             <button onClick={() => setActiveView('bmi')} className="text-sm text-red-500 hover:underline">ดูประวัติทั้งหมด →</button>
                        </div>
                    </div>
                )}

                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg">
                    <h4 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                        <BookOpenIcon className="w-6 h-6 text-yellow-500" />
                        ความรอบรู้ทางสุขภาพ (Health Literacy)
                    </h4>
                    {quizHistory.length > 0 ? (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                <span className="text-sm text-gray-500 dark:text-gray-300">คะแนนก่อนใช้งาน (Pre-test)</span>
                                <span className="font-bold text-gray-800 dark:text-white">{quizHistory[0].score}%</span>
                            </div>
                            {quizHistory.length > 1 && (
                                <div className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-700">
                                    <span className="text-sm text-gray-600 dark:text-gray-300">คะแนนล่าสุด (Post-test)</span>
                                    <span className="font-bold text-yellow-600 dark:text-yellow-400 text-lg">{quizHistory[quizHistory.length-1].score}%</span>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="text-center py-4">
                            <p className="text-gray-500 mb-2 text-sm">ยังไม่มีข้อมูลการทดสอบ</p>
                            <button onClick={() => setActiveView('quiz')} className="px-4 py-2 bg-yellow-100 text-yellow-700 rounded-lg text-sm font-bold hover:bg-yellow-200">
                                เริ่มทำแบบทดสอบ
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    </div>
  );
};

export default Dashboard;
