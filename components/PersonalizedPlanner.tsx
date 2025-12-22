
import React, { useState, useContext, useEffect } from 'react';
import { PLANNER_ACTIVITY_LEVELS, CARB_PERCENTAGES, CUISINE_TYPES, DIETARY_PREFERENCES, HEALTH_CONDITIONS, LIFESTYLE_GOALS } from '../constants';
import { generateMealPlan } from '../services/geminiService';
import { PlannerResults, MealPlan, PlannerHistoryEntry } from '../types';
import { ArrowLeftIcon, SparklesIcon, UserCircleIcon } from './icons';
import { AppContext } from '../context/AppContext';

const PersonalizedPlanner: React.FC = () => {
    const { userProfile, setPlannerHistory, currentUser, foodHistory } = useContext(AppContext);
    
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
    
    const handleCalculateAndPlan = async () => {
        if (currentUser?.role === 'guest') return;
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
        } catch (e: any) {
            setError(e.message);
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
                        <h2 className="text-2xl font-bold">Personalized Lifestyle Planner</h2>
                        <p className="text-sm text-gray-500 mt-2">
                            AI จะดึงข้อมูลสุขภาพของคุณ (BMI, TDEE, โรคประจำตัว) <br/>
                            เพื่อสร้างแผนโภชนาการและกิจกรรมที่ "เหมาะสมกับคุณที่สุด"
                        </p>
                    </div>

                    <div className="bg-teal-50 dark:bg-teal-900/20 p-4 rounded-xl border border-teal-100 dark:border-teal-800 flex items-center gap-4">
                        <div className="bg-white dark:bg-gray-800 p-2 rounded-full shadow-sm">
                            <UserCircleIcon className="w-8 h-8 text-teal-600" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-gray-500 uppercase">ออกแบบสำหรับ</p>
                            <p className="font-bold text-gray-800 dark:text-white text-lg">{currentUser?.displayName}</p>
                            <p className="text-xs text-gray-500">Condition: {formData.healthCondition}</p>
                        </div>
                    </div>

                    <button onClick={handleCalculateAndPlan} className="w-full bg-gradient-to-r from-teal-500 to-emerald-600 text-white font-bold py-4 rounded-xl hover:from-teal-600 hover:to-emerald-700 shadow-lg transform transition-transform active:scale-95">
                        สร้างแผนสุขภาพส่วนตัว (Generate Plan)
                    </button>
                </div>
            ) : (
                <div className="space-y-6">
                    <div className="flex justify-between items-center">
                        <button onClick={() => setShowResults(false)} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white bg-gray-100 dark:bg-gray-700 px-4 py-2 rounded-lg transition-colors">
                            <ArrowLeftIcon className="w-5 h-5"/> ย้อนกลับ
                        </button>
                    </div>
                    
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
