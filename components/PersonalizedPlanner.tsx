
import React, { useState, useContext, useEffect, useMemo } from 'react';
import { PLANNER_ACTIVITY_LEVELS, CARB_PERCENTAGES, CUISINE_TYPES, DIETARY_PREFERENCES, HEALTH_CONDITIONS, LIFESTYLE_GOALS, XP_VALUES } from '../constants';
import { generateMealPlan } from '../services/geminiService';
import { PlannerResults, MealPlan, PlannerHistoryEntry } from '../types';
import { ArrowLeftIcon, SparklesIcon, UserCircleIcon, ScaleIcon, FireIcon, HeartIcon, ChartBarIcon, TrophyIcon, ExclamationTriangleIcon, ClipboardListIcon } from './icons';
import { AppContext } from '../context/AppContext';

const PersonalizedPlanner: React.FC = () => {
    const { userProfile, setPlannerHistory, currentUser, foodHistory, gainXP, plannerHistory } = useContext(AppContext);
    
    // Auto-populate from profile
    const [formData, setFormData] = useState({
        gender: 'male',
        age: '',
        weight: '',
        height: '',
        waist: '',
        hip: '',
        activityLevel: PLANNER_ACTIVITY_LEVELS[2].value,
        carbPercentage: 20,
        cuisine: CUISINE_TYPES[0],
        diet: DIETARY_PREFERENCES[0],
        healthCondition: HEALTH_CONDITIONS[0],
        lifestyleGoal: LIFESTYLE_GOALS[0]
    });

    useEffect(() => {
        if (userProfile) {
            setFormData(prev => ({
                ...prev,
                gender: userProfile.gender || 'male',
                age: userProfile.age ? String(userProfile.age) : '',
                weight: userProfile.weight ? String(userProfile.weight) : '',
                height: userProfile.height ? String(userProfile.height) : '',
                waist: userProfile.waist ? String(userProfile.waist) : '',
                hip: userProfile.hip ? String(userProfile.hip) : '',
                activityLevel: userProfile.activityLevel || PLANNER_ACTIVITY_LEVELS[2].value,
                healthCondition: userProfile.healthCondition || HEALTH_CONDITIONS[0]
            }));
        }
    }, [userProfile]);

    const [results, setResults] = useState<PlannerResults | null>(null);
    const [mealPlan, setMealPlan] = useState<MealPlan | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showResults, setShowResults] = useState(false);

    // --- CHECK WEEKLY LIMIT ---
    const canCreatePlan = useMemo(() => {
        if (plannerHistory.length === 0) return true;
        const lastPlanDate = new Date(plannerHistory[0].date).getTime();
        const now = new Date().getTime();
        const diffDays = (now - lastPlanDate) / (1000 * 3600 * 24);
        return diffDays >= 7;
    }, [plannerHistory]);

    const daysUntilNextPlan = useMemo(() => {
        if (plannerHistory.length === 0) return 0;
        const lastPlanDate = new Date(plannerHistory[0].date).getTime();
        const nextPlanDate = lastPlanDate + (7 * 24 * 3600 * 1000);
        const now = new Date().getTime();
        const diff = Math.ceil((nextPlanDate - now) / (1000 * 3600 * 24));
        return Math.max(0, diff);
    }, [plannerHistory]);

    // Calculate Preview Stats on the fly
    const previewStats = useMemo(() => {
        const weightN = parseFloat(formData.weight);
        const heightN = parseFloat(formData.height);
        const ageN = parseInt(formData.age);
        
        if (!weightN || !heightN || !ageN) return null;

        const heightM = heightN / 100;
        const bmi = weightN / (heightM * heightM);
        
        let bmr = (formData.gender === 'male') 
            ? (10 * weightN + 6.25 * heightN - 5 * ageN + 5) 
            : (10 * weightN + 6.25 * heightN - 5 * ageN - 161);
        
        const tdee = bmr * Number(formData.activityLevel);

        return {
            bmi: bmi.toFixed(1),
            tdee: Math.round(tdee).toLocaleString(),
            condition: formData.healthCondition,
            waist: formData.waist ? `${formData.waist} ซม.` : '-',
            hip: formData.hip ? `${formData.hip} ซม.` : '-'
        };
    }, [formData]);
    
    const handleCalculateAndPlan = async () => {
        if (currentUser?.role === 'guest') return;
        if (!canCreatePlan) {
            alert(`คุณเพิ่งสร้างแผนไป กรุณารออีก ${daysUntilNextPlan} วัน เพื่อประเมินผลลัพธ์ก่อนสร้างแผนใหม่`);
            return;
        }

        setShowResults(true); setLoading(true); setError(null);
        
        const weightN = parseFloat(formData.weight);
        const heightN = parseFloat(formData.height);
        const ageN = parseInt(formData.age);
        const heightM = heightN / 100;
        const bmi = weightN / (heightM * heightM);
        const whr = parseFloat(formData.waist) / parseFloat(formData.hip);
        let bmr = (formData.gender === 'male') ? (10 * weightN + 6.25 * heightN - 5 * ageN + 5) : (10 * weightN + 6.25 * heightN - 5 * ageN - 161);
        const tdee = bmr * Number(formData.activityLevel);

        const calculated: PlannerResults = { bmi, whr, whrRisk: 'Normal', bmr, tdee, proteinGoal: weightN * 1.5, carbGoal: (tdee * formData.carbPercentage / 100) / 4, fatGoal: 50 };
        setResults(calculated);

        try {
            const plan = await generateMealPlan(calculated, formData.cuisine, formData.diet, formData.healthCondition, formData.lifestyleGoal, foodHistory, userProfile.aiSystemInstruction);
            setMealPlan(plan);
            const entry: PlannerHistoryEntry = { id: new Date().toISOString(), date: new Date().toISOString(), cuisine: formData.cuisine, diet: formData.diet, tdee, plan };
            setPlannerHistory(prev => [entry, ...prev].slice(0, 10));
            // Grant XP for generating plan
            gainXP(XP_VALUES.PLANNER, 'PLANNER');
        } catch (e: any) {
            console.error("Planner Error:", e);
            setError(e.message || "เกิดข้อผิดพลาดในการเชื่อมต่อกับ AI");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full">
            {!showResults ? (
                <div className="max-w-lg mx-auto bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg space-y-6">
                    <div className="text-center">
                        <SparklesIcon className="w-12 h-12 text-teal-500 mx-auto mb-2" />
                        <h2 className="text-2xl font-bold dark:text-white">Personalized Lifestyle Planner</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                            AI จะดึงข้อมูลสุขภาพของคุณเพื่อสร้างแผนโภชนาการและกิจกรรมที่ "เหมาะสมกับคุณที่สุด"
                        </p>
                    </div>

                    <div className="bg-teal-50 dark:bg-teal-900/20 p-4 rounded-xl border border-teal-100 dark:border-teal-800 flex items-center gap-4">
                        <div className="bg-white dark:bg-gray-800 p-2 rounded-full shadow-sm">
                            <UserCircleIcon className="w-8 h-8 text-teal-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-gray-500 uppercase">ออกแบบสำหรับ</p>
                            <p className="font-bold text-gray-800 dark:text-white text-lg truncate">{currentUser?.displayName}</p>
                        </div>
                    </div>

                    {/* Health Data Snapshot */}
                    {previewStats && (
                        <div className="space-y-3">
                            <div className="grid grid-cols-3 gap-3">
                                <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-xl border border-gray-100 dark:border-gray-700 flex flex-col items-center text-center">
                                    <ScaleIcon className="w-5 h-5 text-blue-500 mb-1" />
                                    <span className="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-bold">BMI</span>
                                    <span className="font-bold text-gray-800 dark:text-white">{previewStats.bmi}</span>
                                </div>
                                <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-xl border border-gray-100 dark:border-gray-700 flex flex-col items-center text-center">
                                    <FireIcon className="w-5 h-5 text-orange-500 mb-1" />
                                    <span className="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-bold">TDEE</span>
                                    <span className="font-bold text-gray-800 dark:text-white">{previewStats.tdee}</span>
                                </div>
                                <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-xl border border-gray-100 dark:border-gray-700 flex flex-col items-center text-center">
                                    <HeartIcon className="w-5 h-5 text-rose-500 mb-1" />
                                    <span className="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-bold">Condition</span>
                                    <span className="font-bold text-gray-800 dark:text-white text-xs leading-tight line-clamp-2">{previewStats.condition}</span>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-xl border border-gray-100 dark:border-gray-700 flex flex-col items-center text-center">
                                    <ChartBarIcon className="w-5 h-5 text-purple-500 mb-1" />
                                    <span className="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-bold">รอบเอว</span>
                                    <span className="font-bold text-gray-800 dark:text-white">{previewStats.waist}</span>
                                </div>
                                <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-xl border border-gray-100 dark:border-gray-700 flex flex-col items-center text-center">
                                    <ChartBarIcon className="w-5 h-5 text-purple-500 mb-1" />
                                    <span className="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-bold">รอบสะโพก</span>
                                    <span className="font-bold text-gray-800 dark:text-white">{previewStats.hip}</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Goal Selection */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                            <TrophyIcon className="w-4 h-4 text-yellow-500" />
                            เป้าหมายของแผน (Plan Goal)
                        </label>
                        <select
                            name="lifestyleGoal"
                            value={formData.lifestyleGoal}
                            onChange={(e) => setFormData({...formData, lifestyleGoal: e.target.value})}
                            className="w-full p-3 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all text-gray-700 dark:text-white font-medium"
                        >
                            {LIFESTYLE_GOALS.map(g => (
                                <option key={g} value={g}>{g}</option>
                            ))}
                        </select>
                    </div>

                    <button 
                        onClick={handleCalculateAndPlan} 
                        disabled={!canCreatePlan}
                        className={`w-full font-bold py-4 rounded-xl shadow-lg transform transition-transform active:scale-95 flex flex-col items-center justify-center gap-1 ${
                            canCreatePlan 
                            ? 'bg-gradient-to-r from-teal-500 to-emerald-600 text-white hover:from-teal-600 hover:to-emerald-700'
                            : 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                        }`}
                    >
                        <span>สร้างแผนสุขภาพส่วนตัว</span>
                        <span className="text-[10px] font-normal opacity-90">
                            {canCreatePlan ? '(Generate Personalized Plan)' : `(รออีก ${daysUntilNextPlan} วัน)`}
                        </span>
                    </button>
                    
                    {!canCreatePlan && (
                        <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 text-xs rounded-lg text-center border border-yellow-200 dark:border-yellow-800">
                            <strong>Note:</strong> สามารถสร้างแผนได้สัปดาห์ละ 1 ครั้ง เพื่อให้คุณมีเวลาปฏิบัติตามแผนอย่างเต็มที่
                        </div>
                    )}
                </div>
            ) : (
                <div className="space-y-6">
                    <div className="flex justify-between items-center">
                        <button onClick={() => setShowResults(false)} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white bg-gray-100 dark:bg-gray-700 px-4 py-2 rounded-lg transition-colors">
                            <ArrowLeftIcon className="w-5 h-5"/> ย้อนกลับ
                        </button>
                    </div>
                    
                    {error && (
                        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-center">
                            <div className="flex flex-col items-center gap-2">
                                <ExclamationTriangleIcon className="w-8 h-8 text-red-500" />
                                <h3 className="font-bold text-red-600 dark:text-red-400">เกิดข้อผิดพลาด</h3>
                                <p className="text-sm text-gray-600 dark:text-gray-300">{error}</p>
                                <button onClick={handleCalculateAndPlan} className="mt-2 px-4 py-2 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600">ลองใหม่อีกครั้ง</button>
                            </div>
                        </div>
                    )}

                    {loading ? (
                        <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-2xl shadow-lg">
                            <div className="w-16 h-16 border-4 border-t-teal-500 border-gray-200 rounded-full animate-spin mx-auto mb-4"></div>
                            <h3 className="text-xl font-bold text-gray-800 dark:text-white">AI กำลังทำงาน...</h3>
                            <p className="text-gray-500 mt-2">กำลังคำนวณแคลอรี่ที่เหมาะสมและเลือกเมนูอาหารสำหรับคุณ</p>
                        </div>
                    ) : mealPlan && (
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg overflow-x-auto animate-fade-in">
                            <div className="mb-4">
                                <h3 className="text-xl font-bold text-gray-800 dark:text-white">แผนสุขภาพ 7 วันของคุณ</h3>
                                <p className="text-sm text-gray-500">เป้าหมายพลังงาน: ~{Math.round(results?.tdee || 0)} kcal/วัน</p>
                                <p className="text-xs text-teal-600 font-bold mt-1">Goal: {formData.lifestyleGoal}</p>
                            </div>
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-200">
                                        <th className="p-3 text-left rounded-l-lg">วัน</th>
                                        <th className="p-3 text-left">เช้า</th>
                                        <th className="p-3 text-left">กลางวัน</th>
                                        <th className="p-3 text-left">เย็น</th>
                                        <th className="p-3 text-left rounded-r-lg">กิจกรรม</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                    {mealPlan.map(day => (
                                        <tr key={day.day} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                            <td className="p-3 font-bold text-teal-600 dark:text-teal-400 whitespace-nowrap">{day.day}</td>
                                            <td className="p-3 text-gray-700 dark:text-gray-300">{day.breakfast.menu}</td>
                                            <td className="p-3 text-gray-700 dark:text-gray-300">{day.lunch.menu}</td>
                                            <td className="p-3 text-gray-700 dark:text-gray-300">{day.dinner.menu}</td>
                                            <td className="p-3 text-xs text-gray-500 dark:text-gray-400">
                                                {day.activities.map(a => a.activity).join(", ")}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default PersonalizedPlanner;
