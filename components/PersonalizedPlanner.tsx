import React, { useState, useContext } from 'react';
import { PLANNER_ACTIVITY_LEVELS, CARB_PERCENTAGES, CUISINE_TYPES, DIETARY_PREFERENCES, HEALTH_CONDITIONS, LIFESTYLE_GOALS } from '../constants';
import { generateMealPlan } from '../services/geminiService';
import { PlannerResults, MealPlan, PlannerHistoryEntry } from '../types';
import { PrinterIcon, ArrowLeftIcon } from './icons';
import { AppContext } from '../context/AppContext';

const PersonalizedPlanner: React.FC = () => {
    const { userProfile, plannerHistory, setPlannerHistory, apiKey, currentUser } = useContext(AppContext);

    const isGuest = currentUser?.role === 'guest';

    const [formData, setFormData] = useState(() => ({
        gender: userProfile.gender || 'male',
        age: userProfile.age || '',
        weight: userProfile.weight || '',
        height: userProfile.height || '',
        waist: userProfile.waist || '',
        hip: userProfile.hip || '',
        activityLevel: userProfile.activityLevel || PLANNER_ACTIVITY_LEVELS[2].value,
        carbPercentage: 20,
        cuisine: CUISINE_TYPES[0],
        diet: DIETARY_PREFERENCES[0],
        healthCondition: userProfile.healthCondition || HEALTH_CONDITIONS[0],
        lifestyleGoal: LIFESTYLE_GOALS[0] // New field
    }));
    const [results, setResults] = useState<PlannerResults | null>(null);
    const [mealPlan, setMealPlan] = useState<MealPlan | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showResults, setShowResults] = useState(false);
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const getWhrRisk = (whr: number, gender: string): { risk: string; color: string } => {
        if (gender === 'female') {
            if (whr <= 0.80) return { risk: 'ความเสี่ยงต่ำ', color: 'text-green-600 dark:text-green-400' };
            if (whr <= 0.85) return { risk: 'ความเสี่ยงปานกลาง', color: 'text-yellow-600 dark:text-yellow-400' };
            return { risk: 'ความเสี่ยงสูง', color: 'text-red-600 dark:text-red-400' };
        } else { // male
            if (whr <= 0.95) return { risk: 'ความเสี่ยงต่ำ', color: 'text-green-600 dark:text-green-400' };
            if (whr <= 1.0) return { risk: 'ความเสี่ยงปานกลาง', color: 'text-yellow-600 dark:text-yellow-400' };
            return { risk: 'ความเสี่ยงสูง', color: 'text-red-600 dark:text-red-400' };
        }
    };

    const handleCalculateAndPlan = async () => {
        if (isGuest) return;
        setShowResults(true);
        setLoading(true);
        setError(null);
        setResults(null);
        setMealPlan(null);

        const { gender, age, weight, height, waist, hip, activityLevel, carbPercentage } = formData;
        const ageN = parseInt(age);
        const weightN = parseFloat(weight);
        const heightN = parseFloat(height);
        const waistN = parseFloat(waist);
        const hipN = parseFloat(hip);

        if (!(ageN > 0 && weightN > 0 && heightN > 0 && waistN > 0 && hipN > 0)) {
            setError('กรุณากรอกข้อมูลตัวเลขให้ถูกต้องและครบถ้วน');
            setLoading(false);
            setShowResults(false);
            return;
        }

        // Calculations
        const heightM = heightN / 100;
        const bmi = weightN / (heightM * heightM);
        const whr = waistN / hipN;
        const { risk: whrRisk } = getWhrRisk(whr, gender);

        let bmr: number;
        if (gender === 'male') {
            bmr = (10 * weightN) + (6.25 * heightN) - (5 * ageN) + 5;
        } else {
            bmr = (10 * weightN) + (6.25 * heightN) - (5 * ageN) - 161;
        }
        const tdee = bmr * Number(activityLevel);

        const proteinGoalG = weightN * 1.5;
        const proteinGoalKcal = proteinGoalG * 4;

        const carbGoalKcal = tdee * (Number(carbPercentage) / 100);
        const carbGoalG = carbGoalKcal / 4;

        const fatGoalKcal = tdee - (proteinGoalKcal + carbGoalKcal);
        const fatGoalG = fatGoalKcal / 9;

        const calculatedResults: PlannerResults = {
            bmi, whr, whrRisk, bmr, tdee,
            proteinGoal: proteinGoalG,
            carbGoal: carbGoalG,
            fatGoal: fatGoalG,
        };
        setResults(calculatedResults);

        try {
            const plan = await generateMealPlan(
                calculatedResults, 
                formData.cuisine, 
                formData.diet, 
                formData.healthCondition, 
                formData.lifestyleGoal,
                apiKey
            );
            setMealPlan(plan);

            // Save to history
            const newEntry: PlannerHistoryEntry = {
                id: new Date().toISOString(),
                date: new Date().toISOString(),
                cuisine: formData.cuisine,
                diet: formData.diet,
                tdee: tdee,
                plan: plan
            };
            setPlannerHistory(prev => [newEntry, ...prev].slice(0, 10));

        } catch (e: any) {
            setError(e.message || "เกิดข้อผิดพลาดในการสร้างแผน");
        } finally {
            setLoading(false);
        }
    };
    
    const handlePrint = () => {
        window.print();
    };

    const ResultCard: React.FC<{ title: string, value: string, unit?: string, color?: string, sub?: string, subColor?: string }> = 
    ({ title, value, unit, color = 'text-gray-800 dark:text-white', sub, subColor = 'text-gray-500 dark:text-gray-400' }) => (
        <div className="bg-white/60 dark:bg-gray-700/50 p-4 rounded-lg text-center shadow-sm">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-300">{title}</p>
            <p className={`text-3xl font-bold my-1 ${color}`}>{value}</p>
            {unit && <p className={`text-sm font-medium ${color}`}>{unit}</p>}
            {sub && <p className={`text-xs font-semibold ${subColor}`}>{sub}</p>}
        </div>
    );

    const FormView = () => (
        <div className="max-w-lg mx-auto bg-white dark:bg-gray-800 p-6 md:p-8 rounded-2xl shadow-lg space-y-4 animate-fade-in">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2 text-center">Lifestyle Planner</h2>
            <p className="text-center text-gray-600 dark:text-gray-300 -mt-2 mb-4">
                วางแผนอาหารและกิจกรรมตามเป้าหมาย Lifestyle Medicine
            </p>
            
            {/* Basic Stats */}
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">เพศ</label>
                    <select name="gender" value={formData.gender} onChange={handleChange} className="w-full mt-1 p-2 border dark:border-gray-600 rounded-md bg-white dark:bg-gray-700">
                        <option value="male">ชาย</option>
                        <option value="female">หญิง</option>
                    </select>
                </div>
                 <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">อายุ (ปี)</label>
                    <input type="number" name="age" value={formData.age} onChange={handleChange} className="w-full mt-1 p-2 border dark:border-gray-600 rounded-md dark:bg-gray-700" placeholder="เช่น 40"/>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
                 <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">น้ำหนัก (กก.)</label>
                    <input type="number" name="weight" value={formData.weight} onChange={handleChange} className="w-full mt-1 p-2 border dark:border-gray-600 rounded-md dark:bg-gray-700" placeholder="เช่น 75"/>
                </div>
                 <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">ส่วนสูง (ซม.)</label>
                    <input type="number" name="height" value={formData.height} onChange={handleChange} className="w-full mt-1 p-2 border dark:border-gray-600 rounded-md dark:bg-gray-700" placeholder="เช่น 175"/>
                </div>
            </div>

             <div className="grid grid-cols-2 gap-3">
                 <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">รอบเอว (ซม.)</label>
                    <input type="number" name="waist" value={formData.waist} onChange={handleChange} className="w-full mt-1 p-2 border dark:border-gray-600 rounded-md dark:bg-gray-700" placeholder="เช่น 90"/>
                </div>
                 <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">รอบสะโพก (ซม.)</label>
                    <input type="number" name="hip" value={formData.hip} onChange={handleChange} className="w-full mt-1 p-2 border dark:border-gray-600 rounded-md dark:bg-gray-700" placeholder="เช่น 100"/>
                </div>
            </div>

            <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">ระดับกิจกรรม</label>
                <select name="activityLevel" value={formData.activityLevel} onChange={handleChange} className="w-full mt-1 p-2 border dark:border-gray-600 rounded-md bg-white dark:bg-gray-700">
                    {PLANNER_ACTIVITY_LEVELS.map(level => <option key={level.value} value={level.value}>{level.label}</option>)}
                </select>
            </div>
            
             <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">สัดส่วนคาร์โบไฮเดรต</label>
                <select name="carbPercentage" value={formData.carbPercentage} onChange={handleChange} className="w-full mt-1 p-2 border dark:border-gray-600 rounded-md bg-white dark:bg-gray-700">
                    {CARB_PERCENTAGES.map(p => <option key={p} value={p}>{p}%</option>)}
                </select>
            </div>

            <div className="border-t dark:border-gray-700 pt-4 space-y-4">
                <h3 className="text-lg font-bold text-gray-800 dark:text-white text-center">การปรับแต่งเฉพาะบุคคล (Personalization)</h3>
                 <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">อาหารตามภูมิภาค</label>
                    <select name="cuisine" value={formData.cuisine} onChange={handleChange} className="w-full mt-1 p-2 border dark:border-gray-600 rounded-md bg-white dark:bg-gray-700">
                        {CUISINE_TYPES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>
                 <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">สไตล์การกิน / ข้อจำกัด</label>
                    <select name="diet" value={formData.diet} onChange={handleChange} className="w-full mt-1 p-2 border dark:border-gray-600 rounded-md bg-white dark:bg-gray-700">
                        {DIETARY_PREFERENCES.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                </div>
                 <div>
                    <label className="text-sm font-medium text-red-600 dark:text-red-400">โรคประจำตัว / ความเสี่ยง NCDs</label>
                    <select name="healthCondition" value={formData.healthCondition} onChange={handleChange} className="w-full mt-1 p-2 border border-red-300 dark:border-red-800 rounded-md bg-red-50 dark:bg-red-900/20 text-gray-800 dark:text-gray-200">
                        {HEALTH_CONDITIONS.map(condition => <option key={condition} value={condition}>{condition}</option>)}
                    </select>
                </div>
                <div>
                    <label className="text-sm font-medium text-teal-600 dark:text-teal-400">เป้าหมายไลฟ์สไตล์ (Lifestyle Goal)</label>
                    <select name="lifestyleGoal" value={formData.lifestyleGoal} onChange={handleChange} className="w-full mt-1 p-2 border border-teal-300 dark:border-teal-700 rounded-md bg-teal-50 dark:bg-teal-900/20 text-gray-800 dark:text-gray-200">
                        {LIFESTYLE_GOALS.map(goal => <option key={goal} value={goal}>{goal}</option>)}
                    </select>
                </div>
            </div>

            <div className="relative">
                <button
                    onClick={handleCalculateAndPlan}
                    disabled={loading || isGuest}
                    className="w-full bg-teal-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-teal-600 focus:outline-none focus:ring-4 focus:ring-teal-300 dark:focus:ring-teal-800 transition-all duration-300 transform hover:scale-105 disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed disabled:scale-100"
                >
                    {loading ? 'กำลังสร้างแผน AI...' : 'คำนวณและสร้างแผน'}
                </button>
                {isGuest && (
                    <div className="absolute inset-0 bg-white/80 dark:bg-gray-800/80 flex items-center justify-center rounded-lg text-center p-4">
                        <p className="font-semibold text-gray-700 dark:text-gray-300">🔒 กรุณาสร้างโปรไฟล์เพื่อใช้งานฟีเจอร์ AI</p>
                    </div>
                )}
            </div>
            {error && <p className="text-center text-red-500 bg-red-100 dark:bg-red-900/50 dark:text-red-400 p-3 rounded-lg mt-4">{error}</p>}
        </div>
    );

    const ResultsView = () => (
        <div className="animate-fade-in space-y-8">
            <div className="flex justify-between items-center print:hidden">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">แผน Lifestyle Medicine ของคุณ</h2>
                <button
                    onClick={() => { setShowResults(false); setError(null); }}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-semibold rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
                >
                    <ArrowLeftIcon className="w-5 h-5" />
                    แก้ไข
                </button>
            </div>

            {loading && !results && (
                 <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg text-center">
                    <div className="flex flex-col items-center justify-center gap-4">
                        <div className="w-12 h-12 border-4 border-t-teal-500 border-gray-200 dark:border-gray-600 rounded-full animate-spin"></div>
                        <p className="text-teal-600 dark:text-teal-400 font-medium">กำลังประมวลผล...</p>
                    </div>
                 </div>
            )}

            {results && (
                <div id="results-summary" className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg animate-fade-in print:hidden">
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4 text-center">สรุปเป้าหมายสุขภาพ</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <ResultCard title="BMI" value={results.bmi.toFixed(1)} />
                        <ResultCard title="WHR" value={results.whr.toFixed(2)} sub={results.whrRisk} subColor={getWhrRisk(results.whr, formData.gender).color} />
                        <ResultCard title="BMR" value={results.bmr.toFixed(0)} unit="kcal" color="text-orange-500 dark:text-orange-400"/>
                        <ResultCard title="TDEE" value={results.tdee.toFixed(0)} unit="kcal/วัน" color="text-green-500 dark:text-green-400"/>
                    </div>
                    <div className="mt-6 bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                        <h3 className="text-lg font-bold text-gray-700 dark:text-white text-center mb-3">เป้าหมายสารอาหารหลัก (Macros)</h3>
                         <div className="grid grid-cols-3 gap-3 text-center">
                            <div>
                                <p className="font-bold text-2xl text-red-500 dark:text-red-400">{results.proteinGoal.toFixed(0)}g</p>
                                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">โปรตีน</p>
                            </div>
                            <div>
                                <p className="font-bold text-2xl text-blue-500 dark:text-blue-400">{results.carbGoal.toFixed(0)}g</p>
                                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">คาร์โบไฮเดรต</p>
                            </div>
                            <div>
                                <p className="font-bold text-2xl text-yellow-500 dark:text-yellow-400">{results.fatGoal.toFixed(0)}g</p>
                                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">ไขมัน</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div id="meal-plan-section" className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg animate-fade-in print:shadow-none dark:print:bg-white dark:print:text-black">
                 {loading && results && (
                     <div className="text-center">
                        <div className="flex flex-col items-center justify-center gap-4">
                            <div className="w-12 h-12 border-4 border-t-teal-500 border-gray-200 dark:border-gray-600 rounded-full animate-spin"></div>
                            <p className="text-teal-600 dark:text-teal-400 font-medium">AI กำลังจัดสรรเมนูและกิจกรรม...</p>
                        </div>
                     </div>
                )}
                {error && <p className="text-center text-red-500 bg-red-100 dark:bg-red-900/50 dark:text-red-400 p-3 rounded-lg">{error}</p>}
                
                {mealPlan && results && (
                    <div className="printable-area">
                         <div className="flex justify-between items-center mb-4 print:hidden">
                            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">แผนอาหารและกิจกรรม 7 วัน</h2>
                            <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-semibold rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600">
                                <PrinterIcon className="w-5 h-5"/>
                                พิมพ์
                            </button>
                        </div>
                         <div className="mb-4 text-gray-600 dark:text-gray-300 print:hidden">
                            <p>แผนนี้ออกแบบตามหลัก Lifestyle Medicine เพื่อเป้าหมาย: <span className="font-semibold text-teal-600 dark:text-teal-400">{formData.lifestyleGoal}</span></p>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse text-sm dark:text-gray-200 dark:print:text-black">
                                <thead className="bg-gray-100 dark:bg-gray-700">
                                    <tr>
                                        <th className="p-3 font-semibold text-left border-b dark:border-gray-600">ช่วงเวลา</th>
                                        <th className="p-3 font-semibold text-left border-b dark:border-gray-600">รายการ</th>
                                        <th className="p-3 font-semibold text-right border-b dark:border-gray-600">Cal / ระยะเวลา</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {mealPlan.map(day => (
                                        <React.Fragment key={day.day}>
                                            <tr className="bg-teal-50 dark:bg-teal-900/40 font-bold border-b border-teal-100 dark:border-teal-800"><td colSpan={3} className="p-3 text-teal-800 dark:text-teal-200 text-lg">{day.day}</td></tr>
                                            
                                            {/* Meals */}
                                            <tr>
                                                <td className="p-3 border-b dark:border-gray-600 text-gray-500 dark:text-gray-400 font-medium">เช้า</td>
                                                <td className="p-3 border-b dark:border-gray-600">{day.breakfast.menu}</td>
                                                <td className="p-3 border-b dark:border-gray-600 text-right">{day.breakfast.calories.toFixed(0)} kcal</td>
                                            </tr>
                                            <tr>
                                                <td className="p-3 border-b dark:border-gray-600 text-gray-500 dark:text-gray-400 font-medium">กลางวัน</td>
                                                <td className="p-3 border-b dark:border-gray-600">{day.lunch.menu}</td>
                                                <td className="p-3 border-b dark:border-gray-600 text-right">{day.lunch.calories.toFixed(0)} kcal</td>
                                            </tr>
                                            <tr>
                                                <td className="p-3 border-b dark:border-gray-600 text-gray-500 dark:text-gray-400 font-medium">เย็น</td>
                                                <td className="p-3 border-b dark:border-gray-600">{day.dinner.menu}</td>
                                                <td className="p-3 border-b dark:border-gray-600 text-right">{day.dinner.calories.toFixed(0)} kcal</td>
                                            </tr>

                                            {/* Activities */}
                                            {day.activities && day.activities.map((act, idx) => (
                                                <tr key={idx} className="bg-purple-50 dark:bg-purple-900/20">
                                                    <td className="p-3 border-b dark:border-gray-600 text-purple-600 dark:text-purple-400 font-medium">กิจกรรม</td>
                                                    <td className="p-3 border-b dark:border-gray-600">
                                                        <span className="font-semibold">{act.activity}</span>
                                                        <br/>
                                                        <span className="text-xs text-gray-500 dark:text-gray-400">({act.benefit})</span>
                                                    </td>
                                                    <td className="p-3 border-b dark:border-gray-600 text-right">{act.duration}</td>
                                                </tr>
                                            ))}

                                            <tr className="bg-gray-100 dark:bg-gray-700 font-semibold text-xs">
                                                <td colSpan={2} className="p-2 text-right">รวมพลังงานอาหาร</td>
                                                <td className="p-2 text-right">{day.dailyTotal.calories.toFixed(0)} kcal</td>
                                            </tr>
                                        </React.Fragment>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );

    return (
        <div className="w-full">
            {showResults ? <ResultsView /> : <FormView />}
        </div>
    );
};

export default PersonalizedPlanner;