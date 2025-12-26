
import React, { useState, useContext, useMemo } from 'react';
import { AppContext } from '../context/AppContext';
import { WaterHistoryEntry } from '../types';
import { TrashIcon, WaterDropIcon, ShareIcon } from './icons';
import { XP_VALUES } from '../constants';

const MAX_HISTORY_ITEMS = 50; // Keep a bit more history for charts

const WaterTracker: React.FC = () => {
    const { waterHistory, setWaterHistory, waterGoal, setWaterGoal, clearWaterHistory, gainXP } = useContext(AppContext);
    const [customAmount, setCustomAmount] = useState('');
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<string | null>(null);

    // Calculate today's intake with robust date comparison
    const todaysEntries = useMemo(() => {
        const now = new Date();
        return waterHistory.filter(entry => {
            const entryDate = new Date(entry.date);
            return entryDate.getDate() === now.getDate() &&
                   entryDate.getMonth() === now.getMonth() &&
                   entryDate.getFullYear() === now.getFullYear();
        }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()); // Newest first
    }, [waterHistory]);

    const totalIntakeToday = useMemo(() => {
        return todaysEntries.reduce((sum, entry) => sum + entry.amount, 0);
    }, [todaysEntries]);

    const progressPercentage = Math.min(100, Math.max(0, (totalIntakeToday / waterGoal) * 100));

    // --- Handlers ---
    
    const addWater = (amount: number) => {
        const newEntry: WaterHistoryEntry = {
            id: Date.now().toString(),
            date: new Date().toISOString(),
            amount: amount
        };
        // Update local state first to feel responsive
        setWaterHistory(prev => [newEntry, ...prev].slice(0, MAX_HISTORY_ITEMS));
        // Trigger Gamification Check (Anti-cheat logic resides in AppContext)
        gainXP(XP_VALUES.WATER, 'WATER');
    };

    const handleCustomAdd = (e: React.FormEvent) => {
        e.preventDefault();
        const amount = parseInt(customAmount);
        if (amount > 0) {
            addWater(amount);
            setCustomAmount('');
        }
    };
    
    const handleGoalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newGoal = parseInt(e.target.value);
        if (newGoal > 0) {
            setWaterGoal(newGoal);
        }
    };

    const handleDeleteHistoryItem = (id: string) => {
        setWaterHistory(prev => prev.filter(item => item.id !== id));
        setItemToDelete(null);
    };

    const confirmClearHistory = () => {
        if (itemToDelete) {
            handleDeleteHistoryItem(itemToDelete);
        } else {
            clearWaterHistory();
        }
        setShowConfirmDialog(false);
    };

    const cancelClearHistory = () => {
        setShowConfirmDialog(false);
        setItemToDelete(null);
    };

    // --- Chart Logic ---
    const chartData = useMemo(() => {
        const last7Days = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const displayDate = d.toLocaleDateString('th-TH', { weekday: 'short' });
            
            const dailyTotal = waterHistory
                .filter(entry => {
                    const entryDate = new Date(entry.date);
                    return entryDate.getDate() === d.getDate() &&
                           entryDate.getMonth() === d.getMonth() &&
                           entryDate.getFullYear() === d.getFullYear();
                })
                .reduce((sum, entry) => sum + entry.amount, 0);
            
            last7Days.push({ date: displayDate, value: dailyTotal });
        }
        return last7Days;
    }, [waterHistory]);

    const maxChartValue = Math.max(waterGoal, ...chartData.map(d => d.value)) * 1.1;

    return (
        <div className="w-full space-y-8 animate-fade-in">
            {/* Main Tracker Card */}
            <div className="bg-white dark:bg-gray-800 p-6 md:p-8 rounded-2xl shadow-lg relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-300 to-blue-600"></div>
                
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6 text-center flex items-center justify-center gap-2">
                    <WaterDropIcon className="w-8 h-8 text-blue-500" />
                    บันทึกการดื่มน้ำ
                </h2>

                <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-12">
                    {/* Progress Circle */}
                    <div className="relative w-48 h-48 md:w-56 md:h-56 flex-shrink-0">
                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                            <circle
                                className="text-gray-200 dark:text-gray-700 stroke-current"
                                strokeWidth="8"
                                cx="50"
                                cy="50"
                                r="40"
                                fill="transparent"
                            ></circle>
                            <circle
                                className="text-blue-500 progress-ring__circle stroke-current transition-all duration-500 ease-out"
                                strokeWidth="8"
                                strokeLinecap="round"
                                cx="50"
                                cy="50"
                                r="40"
                                fill="transparent"
                                strokeDasharray="251.2"
                                strokeDashoffset={251.2 - (251.2 * progressPercentage) / 100}
                            ></circle>
                        </svg>
                        <div className="absolute top-0 left-0 w-full h-full flex flex-col items-center justify-center">
                            <span className="text-4xl font-bold text-gray-800 dark:text-white">{totalIntakeToday}</span>
                            <span className="text-sm text-gray-500 dark:text-gray-400">/ {waterGoal} ml</span>
                            {totalIntakeToday >= waterGoal && (
                                <span className="text-xs font-bold text-green-500 mt-1">🎉 สำเร็จเป้าหมาย!</span>
                            )}
                        </div>
                    </div>

                    {/* Controls */}
                    <div className="flex flex-col gap-4 w-full max-w-xs">
                         <div className="grid grid-cols-2 gap-3">
                            <button type="button" onClick={() => addWater(250)} className="flex flex-col items-center justify-center p-3 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-800/50 rounded-xl border border-blue-200 dark:border-blue-700 transition-colors active:scale-95">
                                <span className="text-2xl">🥛</span>
                                <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">แก้ว (250ml)</span>
                            </button>
                             <button type="button" onClick={() => addWater(600)} className="flex flex-col items-center justify-center p-3 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-800/50 rounded-xl border border-blue-200 dark:border-blue-700 transition-colors active:scale-95">
                                <span className="text-2xl">🍶</span>
                                <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">ขวด (600ml)</span>
                            </button>
                        </div>
                        
                        <form onSubmit={handleCustomAdd} className="flex gap-2">
                            <input 
                                type="number" 
                                value={customAmount} 
                                onChange={(e) => setCustomAmount(e.target.value)} 
                                placeholder="ระบุจำนวน (ml)" 
                                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                            <button type="button" className="bg-blue-500 text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-600 transition-colors" onClick={handleCustomAdd}>+</button>
                        </form>

                        <div className="mt-2">
                            <label className="text-xs text-gray-500 dark:text-gray-400">เป้าหมายรายวัน (ml)</label>
                            <input 
                                type="number" 
                                value={waterGoal} 
                                onChange={handleGoalChange} 
                                className="w-full px-2 py-1 text-sm border-b border-gray-300 dark:border-gray-600 bg-transparent focus:outline-none focus:border-blue-500 text-gray-700 dark:text-gray-300"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* History Chart */}
             <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg">
                 <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">สถิติย้อนหลัง 7 วัน</h3>
                 <div className="flex items-end justify-between h-40 gap-2">
                    {chartData.map((data, index) => {
                        const heightPercent = (data.value / (maxChartValue || 2500)) * 100; // Avoid division by zero
                        const isGoalMet = data.value >= waterGoal;
                        return (
                            <div key={index} className="flex-1 flex flex-col items-center group relative">
                                <div 
                                    className={`w-full max-w-[30px] rounded-t-md transition-all duration-500 ${isGoalMet ? 'bg-green-400 dark:bg-green-500' : 'bg-blue-400 dark:bg-blue-500'}`}
                                    style={{ height: `${heightPercent}%` }}
                                ></div>
                                <span className="text-xs text-gray-500 dark:text-gray-400 mt-2">{data.date}</span>
                                {/* Tooltip */}
                                <div className="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 bg-black text-white text-xs rounded py-1 px-2 transition-opacity whitespace-nowrap z-10">
                                    {data.value} ml
                                </div>
                            </div>
                        )
                    })}
                 </div>
                 {/* Goal Line dashed overlay could be added here but simple bars are fine */}
                 <div className="border-t border-gray-200 dark:border-gray-700 mt-1 pt-2 text-center">
                    <span className="text-xs text-gray-400">เส้นเป้าหมาย: {waterGoal} ml</span>
                 </div>
             </div>

            {/* Logs */}
            {waterHistory.length > 0 && (
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-bold text-gray-800 dark:text-white">ประวัติการดื่มน้ำ (วันนี้)</h3>
                         <button 
                            onClick={() => { setItemToDelete(null); setShowConfirmDialog(true); }} 
                            className="text-sm text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 flex items-center gap-1 transition-colors"
                        >
                            <TrashIcon className="w-4 h-4" />
                            ล้างประวัติทั้งหมด
                        </button>
                    </div>
                    <div className="max-h-60 overflow-y-auto pr-2 space-y-2">
                        {todaysEntries.length > 0 ? (
                            todaysEntries.map((entry) => (
                                <div key={entry.id} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <span className="text-blue-500">💧</span>
                                        <div>
                                            <p className="font-bold text-gray-800 dark:text-gray-200">{entry.amount} ml</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">{new Date(entry.date).toLocaleTimeString('th-TH', { hour: '2-digit', minute:'2-digit' })}</p>
                                        </div>
                                    </div>
                                    <button onClick={() => { setItemToDelete(entry.id); setShowConfirmDialog(true); }} className="text-gray-400 hover:text-red-500 p-1">
                                        <TrashIcon className="w-4 h-4" />
                                    </button>
                                </div>
                            ))
                        ) : (
                            <p className="text-center text-gray-500 py-4">ยังไม่มีการบันทึกสำหรับวันนี้</p>
                        )}
                    </div>
                </div>
            )}

             {showConfirmDialog && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 transition-opacity duration-300 animate-fade-in" onClick={cancelClearHistory} role="dialog" aria-modal="true">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xl max-w-sm w-full mx-4 transform transition-all duration-300 scale-95 animate-scale-in" onClick={(e) => e.stopPropagation()}>
                        <h3 className="text-xl font-bold text-gray-800 dark:text-white">ยืนยันการลบ</h3>
                        <p className="mt-2 text-gray-600 dark:text-gray-300">{itemToDelete ? 'ต้องการลบรายการนี้ใช่หรือไม่?' : 'คุณแน่ใจหรือไม่ว่าต้องการล้างประวัติการดื่มน้ำทั้งหมด?'}</p>
                        <div className="mt-6 flex justify-end gap-3">
                            <button onClick={cancelClearHistory} className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-semibold rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none transition-colors">ยกเลิก</button>
                            <button onClick={confirmClearHistory} className="px-4 py-2 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 focus:outline-none transition-colors">ยืนยัน</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default WaterTracker;
