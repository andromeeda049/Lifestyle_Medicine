
import React, { useState, useContext, useMemo } from 'react';
import { AppContext } from '../context/AppContext';
import { ActivityHistoryEntry } from '../types';
import { TrashIcon, BoltIcon } from './icons';
import { COMMON_ACTIVITIES, XP_VALUES } from '../constants';

const MAX_HISTORY_ITEMS = 100;

const ActivityTracker: React.FC = () => {
    const { activityHistory, setActivityHistory, clearActivityHistory, gainXP } = useContext(AppContext);
    
    const [customName, setCustomName] = useState('');
    const [customCalories, setCustomCalories] = useState('');
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<string | null>(null);

    const todaysEntries = useMemo(() => {
        const now = new Date();
        return activityHistory.filter(entry => {
            const entryDate = new Date(entry.date);
            return entryDate.getDate() === now.getDate() &&
                   entryDate.getMonth() === now.getMonth() &&
                   entryDate.getFullYear() === now.getFullYear();
        }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [activityHistory]);

    const totalCaloriesBurnedToday = useMemo(() => {
        return todaysEntries.reduce((sum, entry) => sum + entry.caloriesBurned, 0);
    }, [todaysEntries]);

    // --- Chart Logic ---
    const chartData = useMemo(() => {
        const last7Days = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const displayDate = d.toLocaleDateString('th-TH', { weekday: 'short' });
            
            const dailyTotal = activityHistory
                .filter(entry => {
                    const entryDate = new Date(entry.date);
                    return entryDate.getDate() === d.getDate() &&
                           entryDate.getMonth() === d.getMonth() &&
                           entryDate.getFullYear() === d.getFullYear();
                })
                .reduce((sum, entry) => sum + entry.caloriesBurned, 0);
            
            last7Days.push({ date: displayDate, value: dailyTotal });
        }
        return last7Days;
    }, [activityHistory]);

    // Dynamic scale based on activity
    const maxChartValue = Math.max(300, ...chartData.map(d => d.value)) * 1.1;

    const addActivityEntry = (name: string, caloriesBurned: number) => {
        const newEntry: ActivityHistoryEntry = {
            id: Date.now().toString(),
            date: new Date().toISOString(),
            name,
            caloriesBurned
        };
        setActivityHistory(prev => [newEntry, ...prev].slice(0, MAX_HISTORY_ITEMS));
        gainXP(XP_VALUES.EXERCISE);
    };

    const handleCustomAdd = (e: React.FormEvent) => {
        e.preventDefault();
        const calories = parseInt(customCalories);
        if (customName.trim() && calories > 0) {
            addActivityEntry(customName.trim(), calories);
            setCustomName('');
            setCustomCalories('');
        }
    };
    
    const handleDeleteHistoryItem = (id: string) => {
        setActivityHistory(prev => prev.filter(item => item.id !== id));
        setItemToDelete(null);
    };

    const confirmClearHistory = () => {
        if (itemToDelete) {
            handleDeleteHistoryItem(itemToDelete);
        } else {
            const todaysIds = todaysEntries.map(entry => entry.id);
            setActivityHistory(prev => prev.filter(entry => !todaysIds.includes(entry.id)));
        }
        setShowConfirmDialog(false);
    };

    const cancelClearHistory = () => {
        setShowConfirmDialog(false);
        setItemToDelete(null);
    };
    
    return (
        <div className="w-full space-y-8 animate-fade-in">
            {/* Main Tracker Card */}
            <div className="bg-white dark:bg-gray-800 p-6 md:p-8 rounded-2xl shadow-lg">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4 text-center flex items-center justify-center gap-2">
                    <BoltIcon className="w-8 h-8 text-yellow-500" />
                    บันทึกกิจกรรมวันนี้
                </h2>

                {/* Total Display */}
                <div className="text-center bg-yellow-50 dark:bg-yellow-900/30 p-4 rounded-xl mb-6">
                    <p className="text-sm font-medium text-yellow-700 dark:text-yellow-300">เผาผลาญแคลอรี่ทั้งหมดวันนี้</p>
                    <p className="text-4xl font-bold text-yellow-600 dark:text-yellow-400 my-1">{totalCaloriesBurnedToday.toLocaleString()}</p>
                    <p className="text-lg font-semibold text-yellow-700 dark:text-yellow-300">kcal</p>
                </div>
                
                {/* Quick Add */}
                 <div className="mb-6">
                    <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2 text-center uppercase tracking-wide">เพิ่มกิจกรรมด่วน</h3>
                    <div className="flex flex-wrap justify-center gap-2">
                         {COMMON_ACTIVITIES.map(activity => (
                            <button 
                                key={activity.name}
                                onClick={() => addActivityEntry(activity.name, activity.caloriesBurned)}
                                className="px-3 py-2 bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 text-xs font-semibold rounded-full hover:bg-yellow-100 dark:hover:bg-yellow-800/50 transition-colors"
                            >
                                {activity.name} (~{activity.caloriesBurned} kcal)
                            </button>
                         ))}
                    </div>
                </div>

                {/* Custom Add Form */}
                <form onSubmit={handleCustomAdd} className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <input 
                            type="text" 
                            value={customName} 
                            onChange={(e) => setCustomName(e.target.value)} 
                            placeholder="ชื่อกิจกรรม" 
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg focus:ring-2 focus:ring-yellow-500"
                        />
                         <input 
                            type="number" 
                            value={customCalories} 
                            onChange={(e) => setCustomCalories(e.target.value)} 
                            placeholder="แคลอรี่ที่เผาผลาญ" 
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg focus:ring-2 focus:ring-yellow-500"
                        />
                    </div>
                    <button type="submit" disabled={!customName || !customCalories} className="w-full bg-yellow-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-yellow-600 disabled:bg-gray-400 transition-colors">
                        เพิ่มกิจกรรม
                    </button>
                </form>
            </div>

            {/* History Chart */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg">
                 <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">สถิติย้อนหลัง 7 วัน</h3>
                 <div className="flex items-end justify-between h-40 gap-2">
                    {chartData.map((data, index) => {
                        const heightPercent = (data.value / (maxChartValue || 300)) * 100;
                        return (
                            <div key={index} className="flex-1 flex flex-col items-center group relative">
                                <div 
                                    className="w-full max-w-[30px] rounded-t-md transition-all duration-500 bg-yellow-400 dark:bg-yellow-500"
                                    style={{ height: `${heightPercent}%` }}
                                ></div>
                                <span className="text-xs text-gray-500 dark:text-gray-400 mt-2">{data.date}</span>
                                {/* Tooltip */}
                                <div className="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 bg-black text-white text-xs rounded py-1 px-2 transition-opacity whitespace-nowrap z-10">
                                    {data.value} kcal
                                </div>
                            </div>
                        )
                    })}
                 </div>
             </div>

            {/* Logs */}
            {activityHistory.length > 0 && (
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-bold text-gray-800 dark:text-white">รายการที่บันทึก (วันนี้)</h3>
                         <button 
                            onClick={() => { setItemToDelete(null); setShowConfirmDialog(true); }} 
                            className="text-sm text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 flex items-center gap-1 transition-colors"
                        >
                            <TrashIcon className="w-4 h-4" />
                            ล้างรายการวันนี้
                        </button>
                    </div>
                    <div className="max-h-60 overflow-y-auto pr-2 space-y-2">
                        {todaysEntries.length > 0 ? (
                            todaysEntries.map((entry) => (
                                <div key={entry.id} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                    <div>
                                        <p className="font-semibold text-gray-800 dark:text-gray-200">{entry.name}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">{new Date(entry.date).toLocaleTimeString('th-TH', { hour: '2-digit', minute:'2-digit' })}</p>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <p className="font-bold text-yellow-600 dark:text-yellow-400">{entry.caloriesBurned} kcal</p>
                                        <button onClick={() => { setItemToDelete(entry.id); setShowConfirmDialog(true); }} className="text-gray-400 hover:text-red-500 p-1">
                                            <TrashIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-center text-gray-500 py-4">ยังไม่มีการบันทึกสำหรับวันนี้</p>
                        )}
                    </div>
                </div>
            )}
            
            {showConfirmDialog && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={cancelClearHistory} role="dialog">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xl max-w-sm w-full mx-4" onClick={(e) => e.stopPropagation()}>
                        <h3 className="text-xl font-bold text-gray-800 dark:text-white">ยืนยันการลบ</h3>
                        <p className="mt-2 text-gray-600 dark:text-gray-300">{itemToDelete ? 'ต้องการลบรายการนี้ใช่หรือไม่?' : 'ต้องการล้างรายการของวันนี้ทั้งหมดใช่หรือไม่?'}</p>
                        <div className="mt-6 flex justify-end gap-3">
                            <button onClick={cancelClearHistory} className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg">ยกเลิก</button>
                            <button onClick={confirmClearHistory} className="px-4 py-2 bg-red-500 text-white rounded-lg">ยืนยัน</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ActivityTracker;
