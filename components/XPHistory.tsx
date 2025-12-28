
import React, { useContext, useMemo } from 'react';
import { AppContext } from '../context/AppContext';
import { ArrowLeftIcon, WaterDropIcon, BeakerIcon, BoltIcon, MoonIcon, FaceSmileIcon, HeartIcon, TrophyIcon, ClipboardListIcon, StarIcon } from './icons';
import { XP_VALUES } from '../constants';

interface XPLogItem {
    id: string;
    date: Date;
    action: string;
    detail?: string;
    xp: number;
    icon: React.ReactNode;
    color: string;
}

const XPHistory: React.FC = () => {
    const { 
        setActiveView, 
        userProfile,
        waterHistory,
        foodHistory,
        calorieHistory,
        activityHistory,
        sleepHistory,
        moodHistory,
        habitHistory,
        socialHistory,
        plannerHistory,
        quizHistory
    } = useContext(AppContext);

    // Combine all histories into a single sorted timeline
    const historyLogs = useMemo(() => {
        const logs: XPLogItem[] = [];

        // Water
        waterHistory.forEach(h => logs.push({
            id: `water-${h.id}`,
            date: new Date(h.date),
            action: 'ดื่มน้ำ',
            detail: `${h.amount} มล.`,
            xp: XP_VALUES.WATER,
            icon: <WaterDropIcon className="w-4 h-4" />,
            color: 'bg-blue-100 text-blue-600'
        }));

        // Food (AI)
        foodHistory.forEach(h => logs.push({
            id: `food-${h.id}`,
            date: new Date(h.date),
            action: 'วิเคราะห์อาหาร AI',
            detail: h.analysis.description,
            xp: XP_VALUES.FOOD,
            icon: <BeakerIcon className="w-4 h-4" />,
            color: 'bg-purple-100 text-purple-600'
        }));

        // Calorie (Manual)
        calorieHistory.forEach(h => logs.push({
            id: `cal-${h.id}`,
            date: new Date(h.date),
            action: 'บันทึกโภชนาการ',
            detail: h.name,
            xp: XP_VALUES.CALORIE,
            icon: <BeakerIcon className="w-4 h-4" />,
            color: 'bg-orange-100 text-orange-600'
        }));

        // Activity
        activityHistory.forEach(h => logs.push({
            id: `act-${h.id}`,
            date: new Date(h.date),
            action: 'ขยับร่างกาย',
            detail: h.name,
            xp: XP_VALUES.EXERCISE,
            icon: <BoltIcon className="w-4 h-4" />,
            color: 'bg-yellow-100 text-yellow-600'
        }));

        // Sleep
        sleepHistory.forEach(h => logs.push({
            id: `sleep-${h.id}`,
            date: new Date(h.date),
            action: 'บันทึกการนอน',
            detail: `${h.duration.toFixed(1)} ชม.`,
            xp: XP_VALUES.SLEEP,
            icon: <MoonIcon className="w-4 h-4" />,
            color: 'bg-indigo-100 text-indigo-600'
        }));

        // Mood
        moodHistory.forEach(h => logs.push({
            id: `mood-${h.id}`,
            date: new Date(h.date),
            action: 'เช็คอินอารมณ์',
            detail: `เครียด: ${h.stressLevel}/10`,
            xp: XP_VALUES.MOOD,
            icon: <FaceSmileIcon className="w-4 h-4" />,
            color: 'bg-rose-100 text-rose-600'
        }));

        // Wellness (Habit & Social)
        // Grouping logic is simplified here as explicit XP logs aren't stored, assuming each entry gives generic wellness XP
        habitHistory.forEach(h => logs.push({
            id: `habit-${h.id}`,
            date: new Date(h.date),
            action: 'บันทึกพฤติกรรม',
            detail: h.isClean ? 'Clean Day' : 'มีความเสี่ยง',
            xp: XP_VALUES.WELLNESS,
            icon: <HeartIcon className="w-4 h-4" />,
            color: 'bg-green-100 text-green-600'
        }));

        socialHistory.forEach(h => logs.push({
            id: `social-${h.id}`,
            date: new Date(h.date),
            action: 'กิจกรรมสังคม',
            detail: h.interaction,
            xp: XP_VALUES.WELLNESS,
            icon: <UserGroupIcon className="w-4 h-4" />,
            color: 'bg-teal-100 text-teal-600'
        }));

        // Planner
        plannerHistory.forEach(h => logs.push({
            id: `plan-${h.id}`,
            date: new Date(h.date),
            action: 'สร้างแผนสุขภาพ',
            detail: 'Weekly Plan',
            xp: XP_VALUES.PLANNER,
            icon: <ClipboardListIcon className="w-4 h-4" />,
            color: 'bg-emerald-100 text-emerald-600'
        }));

        // Quiz
        quizHistory.forEach(h => logs.push({
            id: `quiz-${h.id}`,
            date: new Date(h.date),
            action: 'แบบทดสอบความรู้',
            detail: `คะแนน ${h.score}%`,
            xp: XP_VALUES.QUIZ,
            icon: <StarIcon className="w-4 h-4" />,
            color: 'bg-amber-100 text-amber-600'
        }));

        // Sort by date descending
        return logs.sort((a, b) => b.date.getTime() - a.date.getTime());
    }, [waterHistory, foodHistory, calorieHistory, activityHistory, sleepHistory, moodHistory, habitHistory, socialHistory, plannerHistory, quizHistory]);

    // Group by Date
    const groupedLogs = useMemo(() => {
        const groups: { [key: string]: XPLogItem[] } = {};
        historyLogs.forEach(log => {
            const dateKey = log.date.toLocaleDateString('th-TH', { 
                weekday: 'long', 
                day: 'numeric', 
                month: 'long' 
            });
            if (!groups[dateKey]) groups[dateKey] = [];
            groups[dateKey].push(log);
        });
        return groups;
    }, [historyLogs]);

    const UserGroupIcon = ({ className }: { className?: string }) => (
        <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
        </svg>
    );

    return (
        <div className="w-full space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
                <button 
                    onClick={() => setActiveView('dashboard')} 
                    className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                    <ArrowLeftIcon className="w-6 h-6 text-gray-600 dark:text-gray-300" />
                </button>
                <h2 className="text-xl font-bold text-gray-800 dark:text-white">ประวัติแต้มสุขภาพ (XP History)</h2>
                <div className="w-10"></div> {/* Spacer */}
            </div>

            {/* Total Summary */}
            <div className="bg-gradient-to-r from-yellow-400 to-orange-500 p-6 rounded-2xl text-white shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-20">
                    <TrophyIcon className="w-24 h-24" />
                </div>
                <div className="relative z-10">
                    <p className="text-yellow-100 font-medium text-sm">แต้มสะสมทั้งหมด (Total XP)</p>
                    <h1 className="text-4xl font-black mt-1">{userProfile.xp?.toLocaleString()} <span className="text-lg font-bold opacity-80">HP</span></h1>
                    <p className="text-xs text-white/80 mt-2">*คำนวณจากกิจกรรมที่คุณบันทึกทั้งหมด</p>
                </div>
            </div>

            {/* Timeline */}
            <div className="space-y-6 pb-20">
                {Object.keys(groupedLogs).length === 0 ? (
                    <div className="text-center py-10 text-gray-500">
                        <p className="mb-2">📭</p>
                        <p>ยังไม่มีประวัติการได้รับแต้ม</p>
                        <button onClick={() => setActiveView('home')} className="mt-4 text-teal-600 font-bold text-sm hover:underline">เริ่มทำภารกิจเลย!</button>
                    </div>
                ) : (
                    Object.keys(groupedLogs).map(dateKey => (
                        <div key={dateKey} className="animate-slide-up">
                            <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-3 sticky top-16 bg-gray-50 dark:bg-gray-900 py-2 z-10">
                                {dateKey}
                            </h3>
                            <div className="space-y-3">
                                {groupedLogs[dateKey].map(log => (
                                    <div key={log.id} className="bg-white dark:bg-gray-800 p-3 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-full ${log.color}`}>
                                                {log.icon}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-gray-800 dark:text-gray-200">{log.action}</p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                                    {log.detail} • {log.date.toLocaleTimeString('th-TH', {hour: '2-digit', minute:'2-digit'})}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="font-bold text-teal-600 dark:text-teal-400 text-sm">
                                            +{log.xp} XP
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default XPHistory;
