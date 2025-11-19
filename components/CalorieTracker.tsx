import React, { useState, useContext, useMemo } from 'react';
import { AppContext } from '../context/AppContext';
import { CalorieHistoryEntry } from '../types';
import { TrashIcon, BeakerIcon } from './icons';
import { COMMON_MEALS } from '../constants';

const MAX_HISTORY_ITEMS = 100;

const CalorieTracker: React.FC = () => {
    const { calorieHistory, setCalorieHistory, clearCalorieHistory, tdeeHistory } = useContext(AppContext);
    
    const [customName, setCustomName] = useState('');
    const [customCalories, setCustomCalories] = useState('');
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<string | null>(null);

    const latestTdee = useMemo(() => {
        return [...tdeeHistory].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
    }, [tdeeHistory]);

    const tdeeGoal = latestTdee ? Math.round(latestTdee.value) : 2000;

    const todaysEntries = useMemo(() => {
        const now = new Date();
        return calorieHistory.filter(entry => {
            const entryDate = new Date(entry.date);
            return entryDate.getDate() === now.getDate() &&
                   entryDate.getMonth() === now.getMonth() &&
                   entryDate.getFullYear() === now.getFullYear();
        }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [calorieHistory]);

    const totalCaloriesToday = useMemo(() => {
        return todaysEntries.reduce((sum, entry) => sum + entry.calories, 0);
    }, [todaysEntries]);

    const progressPercentage = Math.min(100, Math.max(0, (totalCaloriesToday / tdeeGoal) * 100));
    const isOverGoal = totalCaloriesToday > tdeeGoal;

    const addCalorieEntry = (name: string, calories: number) => {
        const newEntry: CalorieHistoryEntry = {
            id: Date.now().toString(),
            date: new Date().toISOString(),
            name,
            calories
        };
        setCalorieHistory(prev => [newEntry, ...prev].slice(0, MAX_HISTORY_ITEMS));
    };

    const handleCustomAdd = (e: React.FormEvent) => {
        e.preventDefault();
        const calories = parseInt(customCalories);
        if (customName.trim() && calories > 0) {
            addCalorieEntry(customName.trim(), calories);
            setCustomName('');
            setCustomCalories('');
        }
    };
    
    const handleDeleteHistoryItem = (id: string) => {
        setCalorieHistory(prev => prev.filter(item => item.id !== id));
        setItemToDelete(null);
    };

    const confirmClearHistory = () => {
        if (itemToDelete) {
            handleDeleteHistoryItem(itemToDelete);
        } else {
            const todaysIds = todaysEntries.map(entry => entry.id);
            setCalorieHistory(prev => prev.filter(entry => !todaysIds.includes(entry.id)));
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
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6 text-center flex items-center justify-center gap-2">
                    <BeakerIcon className="w-8 h-8 text-orange-500" />
                    บันทึกแคลอรี่วันนี้
                </h2>

                {/* Progress Bar */}
                <div className="mb-6">
                    <div className="flex justify-between items-center text-sm font-semibold mb-1">
                        <span className={`text-lg font-bold ${isOverGoal ? 'text-red-500' : 'text-orange-600 dark:text-orange-400'}`}>{totalCaloriesToday.toLocaleString()} kcal</span>
                        <span className="text-gray-500 dark:text-gray-400">เป้าหมาย: {tdeeGoal.toLocaleString()} kcal</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 relative overflow-hidden">
                        <div 
                           className={`h-4 rounded-full transition-all duration-500 ${isOverGoal ? 'bg-red-500' : 'bg-orange-500'}`}
                           style={{ width: `${progressPercentage}%` }}>
                        </div>
                    </div>
                    {isOverGoal && <p className="text-xs text-red-500 text-center mt-1">คุณบริโภคเกินเป้าหมายแล้ว!</p>}
                </div>

                {/* Quick Add */}
                 <div className="mb-6">
                    <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2 text-center uppercase tracking-wide">เพิ่มรายการด่วน</h3>
                    <div className="flex flex-wrap justify-center gap-2">
                         {COMMON_MEALS.map(meal => (
                            <button 
                                key={meal.name}
                                onClick={() => addCalorieEntry(meal.name, meal.calories)}
                                className="px-3 py-2 bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 text-xs font-semibold rounded-full hover:bg-orange-100 dark:hover:bg-orange-800/50 transition-colors"
                            >
                                {meal.name} (~{meal.calories} kcal)
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
                            placeholder="ชื่ออาหาร" 
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg focus:ring-2 focus:ring-orange-500"
                        />
                         <input 
                            type="number" 
                            value={customCalories} 
                            onChange={(e) => setCustomCalories(e.target.value)} 
                            placeholder="แคลอรี่" 
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg focus:ring-2 focus:ring-orange-500"
                        />
                    </div>
                    <button type="submit" disabled={!customName || !customCalories} className="w-full bg-orange-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-orange-600 disabled:bg-gray-400 transition-colors">
                        เพิ่มรายการ
                    </button>
                </form>
            </div>

            {/* Logs */}
            {calorieHistory.length > 0 && (
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
                                        <p className="font-bold text-orange-600 dark:text-orange-400">{entry.calories} kcal</p>
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

export default CalorieTracker;
