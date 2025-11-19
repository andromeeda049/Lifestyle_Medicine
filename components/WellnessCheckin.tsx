import React, { useState, useContext, useMemo } from 'react';
import { AppContext } from '../context/AppContext';
import { MOOD_EMOJIS, SLEEP_HYGIENE_CHECKLIST, XP_VALUES } from '../constants';
import { MoonIcon, FaceSmileIcon, NoSymbolIcon, UserGroupIcon, SparklesIcon, HeartIcon } from './icons';
import { GoogleGenAI } from "@google/genai";

const BreathingExercise: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const [phase, setPhase] = useState<'Inhale' | 'Hold' | 'Exhale'>('Inhale');
    const [text, setText] = useState('หายใจเข้า...');
    
    React.useEffect(() => {
        const breathe = async () => {
            // 4-7-8 technique loop
            while(true) {
                setPhase('Inhale'); setText('หายใจเข้า (4 วินาที)');
                await new Promise(r => setTimeout(r, 4000));
                
                setPhase('Hold'); setText('กลั้นหายใจ (7 วินาที)');
                await new Promise(r => setTimeout(r, 7000));
                
                setPhase('Exhale'); setText('หายใจออกช้าๆ (8 วินาที)');
                await new Promise(r => setTimeout(r, 8000));
            }
        };
        breathe();
    }, []);

    return (
        <div className="fixed inset-0 bg-black/90 flex flex-col items-center justify-center z-50 animate-fade-in">
             <button onClick={onClose} className="absolute top-6 right-6 text-white text-xl hover:text-gray-300">ปิด</button>
             <h2 className="text-white text-3xl font-bold mb-8">ฝึกหายใจคลายเครียด (4-7-8)</h2>
             
             <div className={`w-64 h-64 rounded-full border-4 border-white/30 flex items-center justify-center transition-all duration-[4000ms] ease-in-out ${phase === 'Inhale' ? 'scale-125 bg-teal-500/50' : phase === 'Exhale' ? 'scale-75 bg-blue-500/30' : 'scale-100 bg-indigo-500/40'}`}>
                <div className="text-white text-center">
                    <p className="text-2xl font-bold mb-2">{phase === 'Inhale' ? '🌬️' : phase === 'Hold' ? '😶' : '😮‍💨'}</p>
                    <p className="text-lg">{text}</p>
                </div>
             </div>
             <p className="text-gray-400 mt-8 text-sm">ทำต่อเนื่อง 4-5 รอบจะช่วยลดความดันและคลายเครียดได้ทันที</p>
        </div>
    );
};

const WellnessCheckin: React.FC = () => {
    const { 
        setSleepHistory, setMoodHistory, setHabitHistory, setSocialHistory,
        sleepHistory, moodHistory, habitHistory, socialHistory,
        userProfile, apiKey, currentUser, gainXP
    } = useContext(AppContext);

    const [activeTab, setActiveTab] = useState<'sleep' | 'mood' | 'habit' | 'social'>('sleep');
    const [showBreathing, setShowBreathing] = useState(false);
    const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
    const [analyzing, setAnalyzing] = useState(false);

    // Forms State
    const [sleepData, setSleepData] = useState({ bedTime: '22:00', wakeTime: '06:00', quality: 3, checks: [] as string[] });
    const [moodData, setMoodData] = useState({ emoji: '😐', stress: 5, gratitude: '' });
    const [habitData, setHabitData] = useState({ alcohol: 0, smoking: 0 });
    const [socialData, setSocialData] = useState({ interaction: '', feeling: 'neutral' as 'energized' | 'neutral' | 'drained' });
    const [submitted, setSubmitted] = useState({ sleep: false, mood: false, habit: false, social: false });

    // --- Handlers ---

    const handleSleepSubmit = () => {
        const start = new Date(`2000-01-01T${sleepData.bedTime}`);
        const end = new Date(`2000-01-01T${sleepData.wakeTime}`);
        let diff = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
        if (diff < 0) diff += 24; // Cross midnight

        setSleepHistory(prev => [{
            id: Date.now().toString(), date: new Date().toISOString(),
            bedTime: sleepData.bedTime, wakeTime: sleepData.wakeTime,
            duration: diff, quality: sleepData.quality, hygieneChecklist: sleepData.checks
        }, ...prev]);
        setSubmitted(prev => ({ ...prev, sleep: true }));
        gainXP(XP_VALUES.SLEEP);
    };

    const handleMoodSubmit = () => {
        setMoodHistory(prev => [{
            id: Date.now().toString(), date: new Date().toISOString(),
            moodEmoji: moodData.emoji, stressLevel: moodData.stress, gratitude: moodData.gratitude
        }, ...prev]);
        setSubmitted(prev => ({ ...prev, mood: true }));
        gainXP(XP_VALUES.MOOD);
    };

    const handleHabitSubmit = () => {
        // Log two entries if needed, or just one per type. Simplifying to one unified push for UX, but context stores array.
        // We'll log separate entries.
        const now = new Date().toISOString();
        setHabitHistory(prev => [
            { id: Date.now().toString() + '_a', date: now, type: 'alcohol', amount: habitData.alcohol, isClean: habitData.alcohol === 0 },
            { id: Date.now().toString() + '_s', date: now, type: 'smoking', amount: habitData.smoking, isClean: habitData.smoking === 0 },
            ...prev
        ]);
        setSubmitted(prev => ({ ...prev, habit: true }));
        gainXP(XP_VALUES.WELLNESS);
    };

    const handleSocialSubmit = () => {
        if (!socialData.interaction) return;
        setSocialHistory(prev => [{
            id: Date.now().toString(), date: new Date().toISOString(),
            interaction: socialData.interaction, feeling: socialData.feeling
        }, ...prev]);
        setSubmitted(prev => ({ ...prev, social: true }));
        gainXP(XP_VALUES.WELLNESS);
    };

    const analyzeWellness = async () => {
        if (!apiKey) return;
        setAnalyzing(true);
        gainXP(XP_VALUES.WELLNESS); // Bonus for full analysis
        const ai = new GoogleGenAI({ apiKey });
        
        const prompt = `
        Act as a Lifestyle Medicine Coach. Analyze today's wellness check-in:
        - Sleep: ${sleepData.bedTime} to ${sleepData.wakeTime} (Quality: ${sleepData.quality}/5)
        - Mood: ${moodData.emoji}, Stress: ${moodData.stress}/10
        - Gratitude: ${moodData.gratitude}
        - Habits: Alcohol(${habitData.alcohol}), Smoking(${habitData.smoking})
        - Social: ${socialData.interaction} (${socialData.feeling})
        
        Give a short, encouraging summary (in Thai) focusing on 6 pillars of health.
        `;

        try {
            const result = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
            setAiAnalysis(result.text);
        } catch (e) {
            console.error(e);
        } finally {
            setAnalyzing(false);
        }
    };

    return (
        <div className="w-full space-y-6 animate-fade-in">
            {showBreathing && <BreathingExercise onClose={() => setShowBreathing(false)} />}
            
            <div className="text-center mb-6">
                <HeartIcon className="w-12 h-12 mx-auto text-rose-500" />
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white mt-2">เช็คอินสุขภาพประจำวัน</h2>
                <p className="text-gray-500 dark:text-gray-400">บันทึกความสมดุลของร่างกายและจิตใจ (Daily Wellness)</p>
            </div>

            {/* Tabs */}
            <div className="flex bg-white dark:bg-gray-800 rounded-xl p-1 shadow-sm overflow-x-auto">
                {[
                    { id: 'sleep', icon: <MoonIcon className="w-5 h-5" />, label: 'การนอน' },
                    { id: 'mood', icon: <FaceSmileIcon className="w-5 h-5" />, label: 'อารมณ์' },
                    { id: 'habit', icon: <NoSymbolIcon className="w-5 h-5" />, label: 'สารเสี่ยง' },
                    { id: 'social', icon: <UserGroupIcon className="w-5 h-5" />, label: 'สังคม' },
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-semibold text-sm transition-all whitespace-nowrap ${
                            activeTab === tab.id 
                            ? 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200 shadow-sm' 
                            : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}
                    >
                        {tab.icon}
                        {tab.label}
                        {submitted[tab.id as keyof typeof submitted] && <span className="text-green-500 ml-1">✓</span>}
                    </button>
                ))}
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg min-h-[300px]">
                {/* --- SLEEP SECTION --- */}
                {activeTab === 'sleep' && (
                    <div className="space-y-6 animate-fade-in">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">เวลาเข้านอน</label>
                                <input type="time" value={sleepData.bedTime} onChange={e => setSleepData({...sleepData, bedTime: e.target.value})} className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">เวลาตื่นนอน</label>
                                <input type="time" value={sleepData.wakeTime} onChange={e => setSleepData({...sleepData, wakeTime: e.target.value})} className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600" />
                            </div>
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">คุณภาพการนอน (ให้ดาว)</label>
                            <div className="flex gap-2">
                                {[1,2,3,4,5].map(star => (
                                    <button key={star} onClick={() => setSleepData({...sleepData, quality: star})} className={`text-3xl transition-transform hover:scale-110 ${star <= sleepData.quality ? 'grayscale-0' : 'grayscale opacity-30'}`}>⭐</button>
                                ))}
                            </div>
                        </div>

                        <div className="bg-indigo-50 dark:bg-indigo-900/30 p-4 rounded-lg">
                            <h4 className="font-bold text-indigo-800 dark:text-indigo-300 mb-2">Sleep Hygiene Checklist</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {SLEEP_HYGIENE_CHECKLIST.map(item => (
                                    <label key={item} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                                        <input 
                                            type="checkbox" 
                                            checked={sleepData.checks.includes(item)}
                                            onChange={e => {
                                                if (e.target.checked) setSleepData(p => ({...p, checks: [...p.checks, item]}));
                                                else setSleepData(p => ({...p, checks: p.checks.filter(c => c !== item)}));
                                            }}
                                            className="rounded text-indigo-500 focus:ring-indigo-500"
                                        />
                                        {item}
                                    </label>
                                ))}
                            </div>
                        </div>
                        <button onClick={handleSleepSubmit} disabled={submitted.sleep} className={`w-full py-3 rounded-lg font-bold text-white ${submitted.sleep ? 'bg-green-500' : 'bg-indigo-500 hover:bg-indigo-600'}`}>{submitted.sleep ? 'บันทึกเรียบร้อย' : 'บันทึกข้อมูลการนอน'}</button>
                    </div>
                )}

                {/* --- MOOD SECTION --- */}
                {activeTab === 'mood' && (
                    <div className="space-y-6 animate-fade-in">
                        <div>
                            <label className="block text-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">วันนี้รู้สึกอย่างไร?</label>
                            <div className="flex justify-center gap-3 flex-wrap">
                                {MOOD_EMOJIS.map(m => (
                                    <button key={m.label} onClick={() => setMoodData({...moodData, emoji: m.emoji})} className={`text-4xl p-2 rounded-xl transition-all ${moodData.emoji === m.emoji ? 'bg-yellow-100 scale-110 ring-2 ring-yellow-400' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`} title={m.label}>{m.emoji}</button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <div className="flex justify-between text-sm mb-1">
                                <span className="text-green-600">ผ่อนคลาย</span>
                                <span className="font-bold text-gray-700 dark:text-gray-200">ระดับความเครียด: {moodData.stress}/10</span>
                                <span className="text-red-600">เครียดมาก</span>
                            </div>
                            <input type="range" min="1" max="10" value={moodData.stress} onChange={e => setMoodData({...moodData, stress: parseInt(e.target.value)})} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 accent-rose-500" />
                        </div>
                        
                        <div>
                             <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">บันทึกความขอบคุณ (Gratitude Journal)</label>
                             <textarea 
                                value={moodData.gratitude}
                                onChange={e => setMoodData({...moodData, gratitude: e.target.value})}
                                placeholder="วันนี้มีเรื่องดีๆ อะไรเกิดขึ้นบ้าง..."
                                className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-yellow-400"
                                rows={2}
                             />
                        </div>

                        <div className="flex gap-3">
                             <button onClick={() => setShowBreathing(true)} className="flex-1 py-3 bg-teal-50 text-teal-700 font-bold rounded-lg border border-teal-200 hover:bg-teal-100">🧘 ฝึกหายใจ</button>
                             <button onClick={handleMoodSubmit} disabled={submitted.mood} className={`flex-1 py-3 font-bold text-white rounded-lg ${submitted.mood ? 'bg-green-500' : 'bg-yellow-500 hover:bg-yellow-600'}`}>{submitted.mood ? 'บันทึกแล้ว' : 'บันทึกอารมณ์'}</button>
                        </div>
                    </div>
                )}

                {/* --- HABIT SECTION --- */}
                {activeTab === 'habit' && (
                    <div className="space-y-6 animate-fade-in">
                        <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg text-center">
                             <h3 className="font-bold text-red-700 dark:text-red-300 mb-4">ติดตามสารเสี่ยง (Habit Tracker)</h3>
                             
                             <div className="space-y-4">
                                <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-700 rounded-lg shadow-sm">
                                    <div className="flex items-center gap-3">
                                        <span className="text-2xl">🍺</span>
                                        <span className="font-medium dark:text-white">แอลกอฮอล์</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => setHabitData(p => ({...p, alcohol: Math.max(0, p.alcohol - 1)}))} className="w-8 h-8 rounded-full bg-gray-200 text-xl font-bold">-</button>
                                        <span className="w-12 text-center font-bold text-lg dark:text-white">{habitData.alcohol}</span>
                                        <button onClick={() => setHabitData(p => ({...p, alcohol: p.alcohol + 1}))} className="w-8 h-8 rounded-full bg-gray-200 text-xl font-bold">+</button>
                                        <span className="text-xs text-gray-500 ml-1">แก้ว</span>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-700 rounded-lg shadow-sm">
                                    <div className="flex items-center gap-3">
                                        <span className="text-2xl">🚬</span>
                                        <span className="font-medium dark:text-white">บุหรี่</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => setHabitData(p => ({...p, smoking: Math.max(0, p.smoking - 1)}))} className="w-8 h-8 rounded-full bg-gray-200 text-xl font-bold">-</button>
                                        <span className="w-12 text-center font-bold text-lg dark:text-white">{habitData.smoking}</span>
                                        <button onClick={() => setHabitData(p => ({...p, smoking: p.smoking + 1}))} className="w-8 h-8 rounded-full bg-gray-200 text-xl font-bold">+</button>
                                        <span className="text-xs text-gray-500 ml-1">มวน</span>
                                    </div>
                                </div>
                             </div>
                             
                             {habitData.alcohol === 0 && habitData.smoking === 0 && (
                                 <p className="text-green-600 font-bold mt-4 animate-pulse">✨ ยอดเยี่ยม! วันนี้เป็น Clean Day ของคุณ</p>
                             )}
                        </div>
                        <button onClick={handleHabitSubmit} disabled={submitted.habit} className={`w-full py-3 rounded-lg font-bold text-white ${submitted.habit ? 'bg-green-500' : 'bg-red-500 hover:bg-red-600'}`}>{submitted.habit ? 'บันทึกเรียบร้อย' : 'บันทึกข้อมูล'}</button>
                    </div>
                )}

                {/* --- SOCIAL SECTION --- */}
                {activeTab === 'social' && (
                    <div className="space-y-6 animate-fade-in">
                        <div>
                             <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">วันนี้ได้พูดคุยหรือทำกิจกรรมกับใครบ้าง?</label>
                             <input 
                                type="text"
                                value={socialData.interaction}
                                onChange={e => setSocialData({...socialData, interaction: e.target.value})}
                                placeholder="เช่น ทานข้าวกับครอบครัว, โทรหาเพื่อนเก่า"
                                className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                             />
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">ความรู้สึกหลังพูดคุย</label>
                            <div className="grid grid-cols-3 gap-3">
                                <button onClick={() => setSocialData({...socialData, feeling: 'energized'})} className={`p-3 rounded-lg border-2 text-center ${socialData.feeling === 'energized' ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-200'}`}>
                                    ⚡ ได้รับพลัง
                                </button>
                                <button onClick={() => setSocialData({...socialData, feeling: 'neutral'})} className={`p-3 rounded-lg border-2 text-center ${socialData.feeling === 'neutral' ? 'border-gray-400 bg-gray-50' : 'border-gray-200'}`}>
                                    😐 เฉยๆ
                                </button>
                                <button onClick={() => setSocialData({...socialData, feeling: 'drained'})} className={`p-3 rounded-lg border-2 text-center ${socialData.feeling === 'drained' ? 'border-red-500 bg-red-50 text-red-700' : 'border-gray-200'}`}>
                                    🔋 หมดพลัง
                                </button>
                            </div>
                        </div>
                         <button onClick={handleSocialSubmit} disabled={submitted.social} className={`w-full py-3 rounded-lg font-bold text-white ${submitted.social ? 'bg-green-500' : 'bg-blue-500 hover:bg-blue-600'}`}>{submitted.social ? 'บันทึกเรียบร้อย' : 'บันทึกข้อมูลสังคม'}</button>
                    </div>
                )}
            </div>

            {/* AI Summary Button */}
            {Object.values(submitted).some(v => v) && !aiAnalysis && (
                <button 
                    onClick={analyzeWellness} 
                    disabled={analyzing}
                    className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold py-4 rounded-xl shadow-lg hover:opacity-90 transition-all flex items-center justify-center gap-2"
                >
                    {analyzing ? 'AI กำลังประมวลผล...' : <><SparklesIcon className="w-6 h-6" /> วิเคราะห์ภาพรวมประจำวันด้วย AI</>}
                </button>
            )}

            {/* AI Result */}
            {aiAnalysis && (
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border-t-4 border-purple-500 animate-fade-in">
                    <h3 className="font-bold text-purple-600 text-lg mb-3">🤖 บทวิเคราะห์สุขภาพประจำวัน</h3>
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">{aiAnalysis}</p>
                </div>
            )}
        </div>
    );
};

export default WellnessCheckin;