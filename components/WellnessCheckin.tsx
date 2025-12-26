
import React, { useState, useContext, useMemo } from 'react';
import { AppContext } from '../context/AppContext';
import { MOOD_EMOJIS, SLEEP_HYGIENE_CHECKLIST, XP_VALUES } from '../constants';
import { MoonIcon, FaceSmileIcon, NoSymbolIcon, UserGroupIcon, SparklesIcon, HeartIcon, XIcon, PhoneIcon, ClipboardCheckIcon } from './icons';
import CrisisModal from './CrisisModal';
import { GoogleGenAI } from "@google/genai";

const WellnessCheckin: React.FC = () => {
    const { 
        sleepHistory, setSleepHistory, 
        moodHistory, setMoodHistory, 
        habitHistory, setHabitHistory, 
        socialHistory, setSocialHistory,
        gainXP, openSOS, userProfile
    } = useContext(AppContext);

    const [activeTab, setActiveTab] = useState<'sleep' | 'mood' | 'habit' | 'social'>('sleep');
    const [showCrisisModal, setShowCrisisModal] = useState(false);
    const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
    const [analyzing, setAnalyzing] = useState(false);

    // --- Check if done today ---
    const isToday = (dateString: string) => {
        const d = new Date(dateString);
        const today = new Date();
        return d.getDate() === today.getDate() &&
               d.getMonth() === today.getMonth() &&
               d.getFullYear() === today.getFullYear();
    };

    const isSleepDone = useMemo(() => sleepHistory.some(h => isToday(h.date)), [sleepHistory]);
    const isMoodDone = useMemo(() => moodHistory.some(h => isToday(h.date)), [moodHistory]);
    const isHabitDone = useMemo(() => habitHistory.some(h => isToday(h.date)), [habitHistory]);
    const isSocialDone = useMemo(() => socialHistory.some(h => isToday(h.date)), [socialHistory]);

    // --- State Management ---
    const [sleepData, setSleepData] = useState({ 
        bedTime: '22:00', 
        wakeTime: '06:00', 
        quality: 3, 
        checks: [] as string[] 
    });
    
    const [moodData, setMoodData] = useState({ 
        emoji: '😐', 
        stress: 5, 
        gratitude: '' 
    });
    
    const [habitData, setHabitData] = useState({ 
        alcohol: 0, 
        smoking: 0, 
        chemicals: 0, 
        accidents: 0,
        isClean: false 
    });
    
    const [socialData, setSocialData] = useState({ 
        interaction: '', 
        feeling: 'neutral' as 'energized' | 'neutral' | 'drained' 
    });

    const calculateDuration = (bed: string, wake: string) => {
        const [bH, bM] = bed.split(':').map(Number);
        const [wH, wM] = wake.split(':').map(Number);
        let duration = (wH * 60 + wM) - (bH * 60 + bM);
        if (duration < 0) duration += 24 * 60;
        return (duration / 60).toFixed(1);
    };

    const handleSleepSave = () => {
        const duration = parseFloat(calculateDuration(sleepData.bedTime, sleepData.wakeTime));
        setSleepHistory(prev => [{
            id: Date.now().toString(),
            date: new Date().toISOString(),
            bedTime: sleepData.bedTime,
            wakeTime: sleepData.wakeTime,
            duration: duration,
            quality: sleepData.quality,
            hygieneChecklist: sleepData.checks
        }, ...prev]);
        gainXP(XP_VALUES.SLEEP, 'SLEEP');
    };

    const handleMoodSave = () => {
        setMoodHistory(prev => [{
            id: Date.now().toString(),
            date: new Date().toISOString(),
            moodEmoji: moodData.emoji,
            stressLevel: moodData.stress,
            gratitude: moodData.gratitude
        }, ...prev]);
        gainXP(XP_VALUES.MOOD, 'MOOD');
    };

    const handleHabitSave = () => {
        // Save entry for each non-zero type or a single "clean" entry
        if (habitData.isClean) {
             setHabitHistory(prev => [{
                id: Date.now().toString(),
                date: new Date().toISOString(),
                type: 'alcohol', // Dummy type
                amount: 0,
                isClean: true
            }, ...prev]);
        } else {
            (['alcohol', 'smoking', 'chemicals', 'accidents'] as const).forEach(type => {
                if (habitData[type] > 0) {
                    setHabitHistory(prev => [{
                        id: Date.now().toString() + type,
                        date: new Date().toISOString(),
                        type: type,
                        amount: habitData[type],
                        isClean: false
                    }, ...prev]);
                }
            });
        }
        gainXP(XP_VALUES.WELLNESS, 'WELLNESS');
    };

    const handleSocialSave = () => {
        if (!socialData.interaction) return alert('กรุณาระบุกิจกรรมทางสังคม');
        setSocialHistory(prev => [{
            id: Date.now().toString(),
            date: new Date().toISOString(),
            interaction: socialData.interaction,
            feeling: socialData.feeling
        }, ...prev]);
        gainXP(XP_VALUES.WELLNESS, 'WELLNESS');
        setSocialData({...socialData, interaction: ''}); // Reset text
    };

    const handleWellnessAnalyze = async () => {
        setAnalyzing(true);
        try {
            const prompt = `Analyze today's wellness: 
            Sleep: ${calculateDuration(sleepData.bedTime, sleepData.wakeTime)} hrs, Quality ${sleepData.quality}/5. 
            Mood: Stress ${moodData.stress}/10. 
            Risk Habits: Alcohol ${habitData.alcohol}, Smoking ${habitData.smoking}. 
            Social: ${socialData.interaction} (${socialData.feeling}).
            Provide a short, encouraging summary in Thai (2 sentences max).`;
            
            const config: any = {};
            if (userProfile?.aiSystemInstruction) {
                config.systemInstruction = userProfile.aiSystemInstruction;
            }

            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const response = await ai.models.generateContent({ 
              model: 'gemini-3-flash-preview', 
              contents: prompt,
              config: config
            });
            setAiAnalysis(response.text || "ไม่สามารถสรุปข้อมูลได้");
            // Bonus XP for full review
            gainXP(10);
        } catch (e) { console.error(e); }
        finally { setAnalyzing(false); }
    };

    // Helper for Tab Buttons
    const TabButton: React.FC<{ 
        id: typeof activeTab, 
        label: string, 
        icon: React.ReactNode, 
        isDone: boolean,
        activeColor: string 
    }> = ({ id, label, icon, isDone, activeColor }) => (
        <button 
            onClick={() => setActiveTab(id)} 
            className={`flex-1 py-3 px-2 rounded-lg text-sm font-bold flex items-center justify-center gap-1.5 transition-all relative ${
                activeTab === id 
                ? `${activeColor} text-white shadow-md` 
                : isDone 
                    ? 'bg-green-50 text-green-700 border-2 border-green-200' 
                    : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
        >
            {isDone && activeTab !== id ? <span className="font-bold text-lg">✓</span> : icon} 
            <span className="hidden sm:inline">{label}</span>
            {isDone && activeTab !== id && <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></span>}
        </button>
    );

    return (
        <div className="w-full space-y-6 animate-fade-in relative">
            {showCrisisModal && <CrisisModal onClose={() => setShowCrisisModal(false)} onOpenSOS={openSOS} onBreathing={() => {}} score={moodData.stress} />}
            
            <div className="text-center">
                <HeartIcon className="w-12 h-12 mx-auto text-rose-500" />
                <h2 className="text-2xl font-bold mt-2 text-gray-800 dark:text-white">เช็คอินสุขภาพประจำวัน</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">บันทึก 4 มิติเพื่อสมดุลชีวิต</p>
            </div>

            <div className="flex bg-white dark:bg-gray-800 rounded-xl p-1 shadow-sm overflow-x-auto border border-gray-200 dark:border-gray-700 gap-1">
                <TabButton id="sleep" label="การนอน" icon={<MoonIcon className="w-4 h-4" />} isDone={isSleepDone} activeColor="bg-indigo-600" />
                <TabButton id="mood" label="อารมณ์" icon={<FaceSmileIcon className="w-4 h-4" />} isDone={isMoodDone} activeColor="bg-rose-500" />
                <TabButton id="habit" label="เสี่ยง" icon={<NoSymbolIcon className="w-4 h-4" />} isDone={isHabitDone} activeColor="bg-orange-500" />
                <TabButton id="social" label="สังคม" icon={<UserGroupIcon className="w-4 h-4" />} isDone={isSocialDone} activeColor="bg-teal-600" />
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg min-h-[350px] border border-gray-100 dark:border-gray-700">
                {/* --- SLEEP TAB --- */}
                {activeTab === 'sleep' && (
                    <div className="space-y-6 animate-fade-in">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">เวลาเข้านอน</label>
                                <input type="time" value={sleepData.bedTime} onChange={(e) => setSleepData({...sleepData, bedTime: e.target.value})} className="w-full p-3 bg-gray-50 dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600 font-bold" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">เวลาตื่นนอน</label>
                                <input type="time" value={sleepData.wakeTime} onChange={(e) => setSleepData({...sleepData, wakeTime: e.target.value})} className="w-full p-3 bg-gray-50 dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600 font-bold" />
                            </div>
                        </div>
                        
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-2">คุณภาพการนอน (1-5)</label>
                            <div className="flex justify-between px-2">
                                {[1, 2, 3, 4, 5].map(score => (
                                    <button 
                                        key={score} 
                                        onClick={() => setSleepData({...sleepData, quality: score})}
                                        className={`w-10 h-10 rounded-full font-bold transition-all ${sleepData.quality >= score ? 'bg-indigo-500 text-white shadow-lg scale-110' : 'bg-gray-200 dark:bg-gray-700 text-gray-400'}`}
                                    >
                                        {score}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-xl">
                            <p className="text-xs font-bold text-indigo-700 dark:text-indigo-300 mb-2">Sleep Hygiene Checklist:</p>
                            <div className="grid grid-cols-1 gap-2">
                                {SLEEP_HYGIENE_CHECKLIST.slice(0,4).map(item => (
                                    <label key={item} className="flex items-center gap-2 cursor-pointer">
                                        <input 
                                            type="checkbox" 
                                            checked={sleepData.checks.includes(item)}
                                            onChange={(e) => {
                                                const newChecks = e.target.checked 
                                                    ? [...sleepData.checks, item] 
                                                    : sleepData.checks.filter(c => c !== item);
                                                setSleepData({...sleepData, checks: newChecks});
                                            }}
                                            className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500" 
                                        />
                                        <span className="text-sm text-gray-700 dark:text-gray-300">{item}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <button 
                            onClick={handleSleepSave} 
                            className={`w-full py-3 font-bold rounded-xl shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 ${
                                isSleepDone 
                                ? 'bg-green-500 text-white hover:bg-green-600' 
                                : 'bg-indigo-600 text-white hover:bg-indigo-700'
                            }`}
                        >
                            {isSleepDone ? (
                                <><span>✓ บันทึกวันนี้เรียบร้อยแล้ว</span></>
                            ) : (
                                `บันทึกการนอน (${calculateDuration(sleepData.bedTime, sleepData.wakeTime)} ชม.)`
                            )}
                        </button>
                        {isSleepDone && <p className="text-center text-xs text-gray-400">กดบันทึกซ้ำเพื่ออัปเดตข้อมูล</p>}
                    </div>
                )}

                {/* --- MOOD TAB --- */}
                {activeTab === 'mood' && (
                    <div className="space-y-6 animate-fade-in">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-2 text-center">วันนี้รู้สึกอย่างไร?</label>
                            <div className="flex justify-between overflow-x-auto gap-2 py-2">
                                {MOOD_EMOJIS.map(m => (
                                    <button 
                                        key={m.label} 
                                        onClick={() => setMoodData({...moodData, emoji: m.emoji})} 
                                        className={`p-3 rounded-2xl border-2 transition-all ${moodData.emoji === m.emoji ? 'border-rose-500 bg-rose-50 dark:bg-rose-900/30 scale-110 shadow-md' : 'border-transparent hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                                    >
                                        <span className="text-3xl block">{m.emoji}</span>
                                        <span className="text-[10px] text-gray-500">{m.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <div className="flex justify-between mb-2">
                                <label className="text-xs font-bold text-gray-500">ระดับความเครียด</label>
                                <span className={`text-sm font-bold ${moodData.stress >= 8 ? 'text-red-500' : 'text-gray-700 dark:text-gray-300'}`}>{moodData.stress}/10</span>
                            </div>
                            <input 
                                type="range" 
                                min="1" max="10" 
                                value={moodData.stress} 
                                onChange={(e) => { 
                                    const v = parseInt(e.target.value); 
                                    setMoodData({...moodData, stress: v}); 
                                    if(v >= 8) setShowCrisisModal(true); 
                                }} 
                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-rose-500" 
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-2">เรื่องดีๆ ของวันนี้ (Gratitude)</label>
                            <textarea 
                                value={moodData.gratitude} 
                                onChange={(e) => setMoodData({...moodData, gratitude: e.target.value})}
                                placeholder="พิมพ์เรื่องที่ทำให้ยิ้มได้..." 
                                className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-sm focus:ring-2 focus:ring-rose-500"
                                rows={2}
                            />
                        </div>

                        <button 
                            onClick={handleMoodSave} 
                            className={`w-full py-3 font-bold rounded-xl shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 ${
                                isMoodDone
                                ? 'bg-green-500 text-white hover:bg-green-600'
                                : 'bg-rose-500 text-white hover:bg-rose-600'
                            }`}
                        >
                            {isMoodDone ? (
                                <><span>✓ บันทึกวันนี้เรียบร้อยแล้ว</span></>
                            ) : (
                                'บันทึกอารมณ์'
                            )}
                        </button>
                        {isMoodDone && <p className="text-center text-xs text-gray-400">กดบันทึกซ้ำเพื่ออัปเดตข้อมูล</p>}
                    </div>
                )}

                {/* --- HABIT TAB --- */}
                {activeTab === 'habit' && (
                    <div className="space-y-6 animate-fade-in">
                        <div className={`flex items-center gap-3 p-4 rounded-xl border transition-colors ${habitData.isClean ? 'bg-green-100 border-green-300 dark:bg-green-900/40 dark:border-green-700' : 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800'}`}>
                            <input 
                                type="checkbox" 
                                checked={habitData.isClean} 
                                onChange={(e) => setHabitData({...habitData, isClean: e.target.checked})}
                                className="w-6 h-6 text-green-600 rounded focus:ring-green-500"
                            />
                            <div>
                                <p className="font-bold text-green-800 dark:text-green-300">วันนี้ "คลีน" (Clean Day)</p>
                                <p className="text-xs text-green-600 dark:text-green-400">ไม่ดื่ม ไม่สูบ ไม่มีความเสี่ยง</p>
                            </div>
                        </div>

                        {!habitData.isClean && (
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-600 flex flex-col items-center">
                                    <span className="text-2xl mb-2">🍺</span>
                                    <span className="text-xs font-bold mb-2">แอลกอฮอล์ (แก้ว)</span>
                                    <div className="flex items-center gap-3">
                                        <button onClick={() => setHabitData(p => ({...p, alcohol: Math.max(0, p.alcohol-1)}))} className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 font-bold">-</button>
                                        <span className="font-bold">{habitData.alcohol}</span>
                                        <button onClick={() => setHabitData(p => ({...p, alcohol: p.alcohol+1}))} className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 font-bold">+</button>
                                    </div>
                                </div>
                                <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-600 flex flex-col items-center">
                                    <span className="text-2xl mb-2">🚬</span>
                                    <span className="text-xs font-bold mb-2">บุหรี่ (มวน)</span>
                                    <div className="flex items-center gap-3">
                                        <button onClick={() => setHabitData(p => ({...p, smoking: Math.max(0, p.smoking-1)}))} className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 font-bold">-</button>
                                        <span className="font-bold">{habitData.smoking}</span>
                                        <button onClick={() => setHabitData(p => ({...p, smoking: p.smoking+1}))} className="w-8 h-8 rounded-full bg-gray-800 text-white font-bold">+</button>
                                    </div>
                                </div>
                            </div>
                        )}

                        <button 
                            onClick={handleHabitSave} 
                            className={`w-full py-3 font-bold rounded-xl shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 ${
                                isHabitDone
                                ? 'bg-green-500 text-white hover:bg-green-600'
                                : 'bg-orange-500 text-white hover:bg-orange-600'
                            }`}
                        >
                            {isHabitDone ? (
                                <><span>✓ บันทึกวันนี้เรียบร้อยแล้ว</span></>
                            ) : (
                                'บันทึกพฤติกรรม'
                            )}
                        </button>
                        {isHabitDone && <p className="text-center text-xs text-gray-400">กดบันทึกซ้ำเพื่ออัปเดตข้อมูล</p>}
                    </div>
                )}

                {/* --- SOCIAL TAB --- */}
                {activeTab === 'social' && (
                    <div className="space-y-6 animate-fade-in">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-2">วันนี้ได้พูดคุยหรือทำกิจกรรมกับใครบ้าง?</label>
                            <input 
                                type="text" 
                                value={socialData.interaction} 
                                onChange={(e) => setSocialData({...socialData, interaction: e.target.value})}
                                placeholder="เช่น กินข้าวกับเพื่อน, โทรหาแม่, ประชุมทีม" 
                                className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-2">ความรู้สึกหลังทำกิจกรรม</label>
                            <div className="grid grid-cols-3 gap-3">
                                {[
                                    { id: 'energized', label: 'มีพลัง', icon: '⚡' },
                                    { id: 'neutral', label: 'เฉยๆ', icon: '😐' },
                                    { id: 'drained', label: 'เหนื่อย', icon: '🔋' }
                                ].map((item) => (
                                    <button
                                        key={item.id}
                                        onClick={() => setSocialData({...socialData, feeling: item.id as any})}
                                        className={`p-3 rounded-xl border flex flex-col items-center gap-1 transition-all ${
                                            socialData.feeling === item.id 
                                            ? 'bg-teal-50 border-teal-500 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300' 
                                            : 'border-gray-200 dark:border-gray-700 text-gray-500'
                                        }`}
                                    >
                                        <span className="text-xl">{item.icon}</span>
                                        <span className="text-xs font-bold">{item.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <button 
                            onClick={handleSocialSave} 
                            className={`w-full py-3 font-bold rounded-xl shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 ${
                                isSocialDone
                                ? 'bg-green-500 text-white hover:bg-green-600'
                                : 'bg-teal-600 text-white hover:bg-teal-700'
                            }`}
                        >
                            {isSocialDone ? (
                                <><span>✓ บันทึกวันนี้เรียบร้อยแล้ว</span></>
                            ) : (
                                'บันทึกกิจกรรมสังคม'
                            )}
                        </button>
                        {isSocialDone && <p className="text-center text-xs text-gray-400">กดบันทึกซ้ำเพื่ออัปเดตข้อมูล</p>}
                    </div>
                )}
            </div>

            {/* AI Summary Section */}
            <div className="bg-gradient-to-r from-violet-600 to-indigo-600 rounded-2xl p-4 text-white shadow-lg">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold flex items-center gap-2"><SparklesIcon className="w-5 h-5" /> AI Health Summary</h3>
                    <button onClick={handleWellnessAnalyze} disabled={analyzing} className="bg-white/20 px-4 py-1.5 rounded-full text-xs font-bold hover:bg-white/30 backdrop-blur-sm transition-colors">
                        {analyzing ? 'กำลังวิเคราะห์...' : 'สรุปภาพรวมวันนี้'}
                    </button>
                </div>
                {aiAnalysis && (
                    <div className="bg-white/10 p-4 rounded-xl border border-white/20 animate-fade-in">
                        <p className="text-sm leading-relaxed font-medium">{aiAnalysis}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default WellnessCheckin;
