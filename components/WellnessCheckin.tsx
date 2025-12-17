
import React, { useState, useContext, useMemo, useRef } from 'react';
import { AppContext } from '../context/AppContext';
import { MOOD_EMOJIS, SLEEP_HYGIENE_CHECKLIST, XP_VALUES } from '../constants';
import { MoonIcon, FaceSmileIcon, NoSymbolIcon, UserGroupIcon, SparklesIcon, HeartIcon, BeakerIcon, BoltIcon, CameraIcon } from './icons';
import { GoogleGenAI } from "@google/genai";
import CrisisModal from './CrisisModal';
import { extractHealthDataFromImage } from '../services/geminiService';

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
        <div className="fixed inset-0 bg-black/90 flex flex-col items-center justify-center z-[200] animate-fade-in">
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
        userProfile, apiKey, currentUser, gainXP, openSOS
    } = useContext(AppContext);

    const [activeTab, setActiveTab] = useState<'sleep' | 'mood' | 'habit' | 'social'>('sleep');
    const [showBreathing, setShowBreathing] = useState(false);
    const [showCrisisModal, setShowCrisisModal] = useState(false);
    const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
    const [analyzing, setAnalyzing] = useState(false);
    const [isSyncingSleep, setIsSyncingSleep] = useState(false);
    const sleepFileInputRef = useRef<HTMLInputElement>(null);

    // Forms State
    const [sleepData, setSleepData] = useState({ bedTime: '22:00', wakeTime: '06:00', quality: 3, checks: [] as string[] });
    const [moodData, setMoodData] = useState({ emoji: '😐', stress: 5, gratitude: '' });
    const [habitData, setHabitData] = useState({ alcohol: 0, smoking: 0, chemicals: 0, accidents: 0 });
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

        // Crisis Intervention Logic: Trigger immediately on high stress
        if (moodData.stress >= 8) {
            setShowCrisisModal(true);
        }
    };

    const handleHabitSubmit = () => {
        const now = new Date().toISOString();
        setHabitHistory(prev => [
            { id: Date.now().toString() + '_a', date: now, type: 'alcohol', amount: habitData.alcohol, isClean: habitData.alcohol === 0 },
            { id: Date.now().toString() + '_s', date: now, type: 'smoking', amount: habitData.smoking, isClean: habitData.smoking === 0 },
            { id: Date.now().toString() + '_c', date: now, type: 'chemicals', amount: habitData.chemicals, isClean: habitData.chemicals === 0 },
            { id: Date.now().toString() + '_ac', date: now, type: 'accidents', amount: habitData.accidents, isClean: habitData.accidents === 0 },
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

    const handleSleepFileSync = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsSyncingSleep(true);
        try {
            const reader = new FileReader();
            reader.onloadend = async () => {
                if (typeof reader.result === 'string') {
                    const base64 = reader.result.split(',')[1];
                    const data = await extractHealthDataFromImage(base64, file.type, 'sleep', apiKey);
                    
                    if (data.bedTime) setSleepData(prev => ({ ...prev, bedTime: data.bedTime }));
                    if (data.wakeTime) setSleepData(prev => ({ ...prev, wakeTime: data.wakeTime }));
                    
                    alert(`✅ AI อ่านข้อมูลสำเร็จ!\n- เข้านอน: ${data.bedTime || '-'}\n- ตื่นนอน: ${data.wakeTime || '-'}\n- ระยะเวลา: ${data.durationHours || '-'} ชม.`);
                }
            };
            reader.readAsDataURL(file);
        } catch (error) {
            alert('ไม่สามารถอ่านข้อมูลจากภาพได้');
        } finally {
            setIsSyncingSleep(false);
            if(sleepFileInputRef.current) sleepFileInputRef.current.value = "";
        }
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
        - Habits: Alcohol(${habitData.alcohol}), Smoking(${habitData.smoking}), Chemicals(${habitData.chemicals}), Accidents(${habitData.accidents})
        - Social: ${socialData.interaction} (${socialData.feeling})
        
        Give a short, encouraging summary (in Thai) focusing on 6 pillars of health and occupational safety.
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
        <div className="w-full space-y-6 animate-fade-in relative">
            {showBreathing && <BreathingExercise onClose={() => setShowBreathing(false)} />}
            {showCrisisModal && (
                <CrisisModal 
                    onClose={() => setShowCrisisModal(false)}
                    onOpenSOS={openSOS}
                    onBreathing={() => setShowBreathing(true)}
                    score={moodData.stress}
                />
            )}
            
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
                    { id: 'habit', icon: <NoSymbolIcon className="w-5 h-5" />, label: 'สาร/พฤติกรรมเสี่ยง' },
                    { id: 'social', icon: <UserGroupIcon className="w-5 h-5" />, label: 'สังคม' },
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-semibold text-sm transition-all whitespace-nowrap ${
                            activeTab === tab.id 
                            ? 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200 shadow-sm' 
                            : 'text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'
                        }`}
                    >
                        {tab.icon}
                        <span>{tab.label}</span>
                    </button>
                ))}
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg mt-6 min-h-[300px]">
                {activeTab === 'sleep' && (
                    <div className="animate-fade-in">
                        <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">คุณภาพการนอนหลับ (Restorative Sleep)</h3>
                        
                        {/* AI Sync Button for Sleep */}
                        <div className="mb-6">
                            <input 
                                type="file" 
                                accept="image/*" 
                                ref={sleepFileInputRef} 
                                onChange={handleSleepFileSync} 
                                className="hidden" 
                            />
                            <button 
                                onClick={() => sleepFileInputRef.current?.click()}
                                disabled={isSyncingSleep}
                                className="w-full py-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded-lg flex items-center justify-center gap-2 hover:bg-indigo-100 dark:hover:bg-indigo-800/50 transition-colors text-sm font-medium"
                            >
                                {isSyncingSleep ? (
                                    <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                    <CameraIcon className="w-4 h-4" />
                                )}
                                Sync ข้อมูลการนอนจากภาพ (App/Watch)
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div>
                                <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">เข้านอน</label>
                                <input type="time" value={sleepData.bedTime} onChange={e => setSleepData({...sleepData, bedTime: e.target.value})} className="w-full p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border-none focus:ring-2 focus:ring-teal-500" />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">ตื่นนอน</label>
                                <input type="time" value={sleepData.wakeTime} onChange={e => setSleepData({...sleepData, wakeTime: e.target.value})} className="w-full p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border-none focus:ring-2 focus:ring-teal-500" />
                            </div>
                        </div>
                        
                        <div className="mb-6">
                            <label className="block text-sm text-gray-600 dark:text-gray-300 mb-2">คุณภาพการนอน</label>
                            <div className="flex justify-between">
                                {[1, 2, 3, 4, 5].map(q => (
                                    <button
                                        key={q}
                                        onClick={() => setSleepData({...sleepData, quality: q})}
                                        className={`w-10 h-10 rounded-full font-bold transition-all ${sleepData.quality === q ? 'bg-indigo-500 text-white scale-110' : 'bg-gray-100 dark:bg-gray-700 text-gray-500'}`}
                                    >
                                        {q}
                                    </button>
                                ))}
                            </div>
                            <div className="flex justify-between text-xs text-gray-400 mt-1 px-1">
                                <span>แย่มาก</span>
                                <span>ดีเยี่ยม</span>
                            </div>
                        </div>

                        <div className="mb-6">
                            <label className="block text-sm text-gray-600 dark:text-gray-300 mb-2">Sleep Hygiene Checklist</label>
                            <div className="space-y-2">
                                {SLEEP_HYGIENE_CHECKLIST.map(item => (
                                    <label key={item} className="flex items-center space-x-2 cursor-pointer bg-gray-50 dark:bg-gray-700/50 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                                        <input 
                                            type="checkbox" 
                                            checked={sleepData.checks.includes(item)}
                                            onChange={(e) => {
                                                const newChecks = e.target.checked 
                                                    ? [...sleepData.checks, item]
                                                    : sleepData.checks.filter(i => i !== item);
                                                setSleepData({...sleepData, checks: newChecks});
                                            }}
                                            className="rounded text-teal-500 focus:ring-teal-500 w-4 h-4"
                                        />
                                        <span className="text-sm text-gray-700 dark:text-gray-300">{item}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <button 
                            onClick={handleSleepSubmit}
                            disabled={submitted.sleep}
                            className={`w-full py-3 rounded-xl font-bold text-white transition-all ${submitted.sleep ? 'bg-green-500' : 'bg-indigo-500 hover:bg-indigo-600'}`}
                        >
                            {submitted.sleep ? 'บันทึกแล้ว' : 'บันทึกการนอน'}
                        </button>
                    </div>
                )}

                {activeTab === 'mood' && (
                    <div className="animate-fade-in">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-gray-800 dark:text-white">อารมณ์ & ความเครียด</h3>
                            <button onClick={() => setShowBreathing(true)} className="text-xs text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-900/30 px-3 py-1 rounded-full hover:bg-indigo-200 dark:hover:bg-indigo-800 transition-colors">
                                🧘 ฝึกหายใจ
                            </button>
                        </div>

                        <div className="flex justify-between mb-8 overflow-x-auto pb-2 gap-2">
                            {MOOD_EMOJIS.map(m => (
                                <button 
                                    key={m.label}
                                    onClick={() => setMoodData({...moodData, emoji: m.emoji})}
                                    className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all min-w-[60px] ${moodData.emoji === m.emoji ? 'bg-rose-100 dark:bg-rose-900/30 ring-2 ring-rose-400' : 'hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                                >
                                    <span className="text-3xl filter drop-shadow-sm">{m.emoji}</span>
                                    <span className="text-[10px] text-gray-500 dark:text-gray-400">{m.label}</span>
                                </button>
                            ))}
                        </div>

                        <div className="mb-6">
                            <label className="flex justify-between text-sm text-gray-600 dark:text-gray-300 mb-2">
                                <span>ระดับความเครียด</span>
                                <span className={`font-bold ${moodData.stress >= 8 ? 'text-red-500 animate-pulse' : 'text-rose-500'}`}>{moodData.stress}/10</span>
                            </label>
                            <input 
                                type="range" min="1" max="10" 
                                value={moodData.stress}
                                onChange={(e) => setMoodData({...moodData, stress: parseInt(e.target.value)})}
                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 accent-rose-500"
                            />
                            {moodData.stress >= 8 && <p className="text-xs text-red-500 mt-1 font-bold">⚠️ ความเครียดระดับสูง ระบบจะแนะนำการช่วยเหลือ</p>}
                        </div>

                        <div className="mb-6">
                            <label className="block text-sm text-gray-600 dark:text-gray-300 mb-2">ขอบคุณสิ่งดีๆ ในวันนี้ (Gratitude Journal)</label>
                            <textarea 
                                value={moodData.gratitude}
                                onChange={(e) => setMoodData({...moodData, gratitude: e.target.value})}
                                placeholder="เช่น ได้ดื่มกาแฟอร่อยๆ, เพื่อนร่วมงานช่วยงาน..."
                                className="w-full p-3 bg-gray-50 dark:bg-gray-700 rounded-xl border-none focus:ring-2 focus:ring-rose-500 min-h-[80px]"
                            />
                        </div>

                        <button 
                            onClick={handleMoodSubmit}
                            disabled={submitted.mood}
                            className={`w-full py-3 rounded-xl font-bold text-white transition-all ${submitted.mood ? 'bg-green-500' : 'bg-rose-500 hover:bg-rose-600'}`}
                        >
                            {submitted.mood ? 'บันทึกแล้ว' : 'บันทึกความรู้สึก'}
                        </button>
                    </div>
                )}

                {activeTab === 'habit' && (
                    <div className="animate-fade-in">
                        {/* (Code for Habit tab remains the same as before) */}
                        <div className="text-center mb-6">
                            <h3 className="text-xl font-bold text-gray-800 dark:text-white">การหลีกเลี่ยงสารเสพติดและพฤติกรรมเสี่ยง</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">เป้าหมายคือการ ลด ละ เลิก เพื่อสุขภาพและความปลอดภัย (0 = ดีเยี่ยม)</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            {/* Alcohol */}
                            <div className={`p-6 rounded-2xl border-2 transition-all ${habitData.alcohol === 0 ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : 'border-red-200 bg-white dark:bg-gray-700'}`}>
                                <div className="flex justify-between items-center mb-4">
                                    <span className="text-lg font-bold text-gray-700 dark:text-gray-200">🍺 แอลกอฮอล์</span>
                                    {habitData.alcohol === 0 && <span className="px-2 py-1 bg-green-200 text-green-800 text-xs rounded-full font-bold">Clean!</span>}
                                </div>
                                <div className="flex items-center justify-center gap-6">
                                    <button onClick={() => setHabitData(prev => ({...prev, alcohol: Math.max(0, prev.alcohol - 1)}))} className="w-10 h-10 rounded-full bg-white dark:bg-gray-600 shadow-md flex items-center justify-center text-xl hover:bg-gray-100 dark:hover:bg-gray-500 text-gray-600 dark:text-gray-200">-</button>
                                    <div className="text-center w-16">
                                        <span className={`text-3xl font-bold ${habitData.alcohol > 0 ? 'text-red-500' : 'text-green-600'}`}>{habitData.alcohol}</span>
                                        <p className="text-[10px] text-gray-500 mt-1">แก้ว</p>
                                    </div>
                                    <button onClick={() => setHabitData(prev => ({...prev, alcohol: prev.alcohol + 1}))} className="w-10 h-10 rounded-full bg-white dark:bg-gray-600 shadow-md flex items-center justify-center text-xl hover:bg-gray-100 dark:hover:bg-gray-500 text-gray-600 dark:text-gray-200">+</button>
                                </div>
                            </div>
                            {/* Smoking */}
                            <div className={`p-6 rounded-2xl border-2 transition-all ${habitData.smoking === 0 ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : 'border-red-200 bg-white dark:bg-gray-700'}`}>
                                <div className="flex justify-between items-center mb-4">
                                    <span className="text-lg font-bold text-gray-700 dark:text-gray-200">🚬 บุหรี่/ยาสูบ</span>
                                    {habitData.smoking === 0 && <span className="px-2 py-1 bg-green-200 text-green-800 text-xs rounded-full font-bold">Clean!</span>}
                                </div>
                                <div className="flex items-center justify-center gap-6">
                                    <button onClick={() => setHabitData(prev => ({...prev, smoking: Math.max(0, prev.smoking - 1)}))} className="w-10 h-10 rounded-full bg-white dark:bg-gray-600 shadow-md flex items-center justify-center text-xl hover:bg-gray-100 dark:hover:bg-gray-500 text-gray-600 dark:text-gray-200">-</button>
                                    <div className="text-center w-16">
                                        <span className={`text-3xl font-bold ${habitData.smoking > 0 ? 'text-red-500' : 'text-green-600'}`}>{habitData.smoking}</span>
                                        <p className="text-[10px] text-gray-500 mt-1">มวน</p>
                                    </div>
                                    <button onClick={() => setHabitData(prev => ({...prev, smoking: prev.smoking + 1}))} className="w-10 h-10 rounded-full bg-white dark:bg-gray-600 shadow-md flex items-center justify-center text-xl hover:bg-gray-100 dark:hover:bg-gray-500 text-gray-600 dark:text-gray-200">+</button>
                                </div>
                            </div>
                        </div>
                        {habitData.alcohol === 0 && habitData.smoking === 0 && (
                            <div className="text-center p-4 bg-teal-50 dark:bg-teal-900/30 rounded-lg mb-6 border border-teal-200 dark:border-teal-700">
                                <p className="text-teal-700 dark:text-teal-300 font-medium">✨ ยอดเยี่ยมมาก! การลดละเลิกปัจจัยเสี่ยงช่วยเพิ่มความปลอดภัยและสุขภาพที่ดี</p>
                            </div>
                        )}
                        <button 
                            onClick={handleHabitSubmit}
                            disabled={submitted.habit}
                            className={`w-full py-4 rounded-xl font-bold text-white transition-all shadow-lg transform hover:scale-[1.02] ${submitted.habit ? 'bg-green-500 cursor-not-allowed' : 'bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600'}`}
                        >
                            {submitted.habit ? 'บันทึกเรียบร้อย' : 'ยืนยันการบันทึก'}
                        </button>
                    </div>
                )}

                {activeTab === 'social' && (
                    <div className="animate-fade-in">
                        {/* (Code for Social tab remains the same as before) */}
                        <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">ปฏิสัมพันธ์ทางสังคม (Healthy Connection)</h3>
                        <div className="mb-6">
                            <label className="block text-sm text-gray-600 dark:text-gray-300 mb-2">วันนี้คุณมีปฏิสัมพันธ์ที่ดีกับใครบ้าง?</label>
                            <input 
                                type="text"
                                value={socialData.interaction}
                                onChange={(e) => setSocialData({...socialData, interaction: e.target.value})}
                                placeholder="เช่น คุยกับเพื่อนเก่า, ทานข้าวกับครอบครัว..."
                                className="w-full p-3 bg-gray-50 dark:bg-gray-700 rounded-xl border-none focus:ring-2 focus:ring-teal-500"
                            />
                        </div>

                        <div className="mb-6">
                            <label className="block text-sm text-gray-600 dark:text-gray-300 mb-2">ความรู้สึกจากการมีปฏิสัมพันธ์</label>
                            <div className="grid grid-cols-3 gap-3">
                                {[
                                    { id: 'energized', label: '⚡ มีพลัง', color: 'bg-yellow-100 text-yellow-700' },
                                    { id: 'neutral', label: '😐 เฉยๆ', color: 'bg-gray-100 text-gray-700' },
                                    { id: 'drained', label: '🔋 หมดพลัง', color: 'bg-gray-200 text-gray-600' }
                                ].map(opt => (
                                    <button
                                        key={opt.id}
                                        onClick={() => setSocialData({...socialData, feeling: opt.id as any})}
                                        className={`py-3 rounded-lg text-sm font-bold transition-all ${socialData.feeling === opt.id ? 'ring-2 ring-teal-500 shadow-md ' + opt.color : 'bg-gray-50 dark:bg-gray-700 text-gray-500 hover:bg-gray-100'}`}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <button 
                            onClick={handleSocialSubmit}
                            disabled={submitted.social}
                            className={`w-full py-3 rounded-xl font-bold text-white transition-all ${submitted.social ? 'bg-green-500' : 'bg-teal-500 hover:bg-teal-600'}`}
                        >
                            {submitted.social ? 'บันทึกแล้ว' : 'บันทึกกิจกรรมสังคม'}
                        </button>
                    </div>
                )}
            </div>

            {/* AI Analysis Section */}
            <div className="bg-gradient-to-r from-violet-600 to-indigo-600 rounded-2xl p-1 shadow-lg mt-8">
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 h-full">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-indigo-600 flex items-center gap-2">
                            <SparklesIcon className="w-5 h-5 text-indigo-500" />
                            AI Health Summary
                        </h3>
                        <button 
                            onClick={analyzeWellness}
                            disabled={analyzing}
                            className="text-xs bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300 px-3 py-1.5 rounded-full font-bold hover:bg-indigo-100 transition-colors disabled:opacity-50"
                        >
                            {analyzing ? 'กำลังวิเคราะห์...' : 'วิเคราะห์ภาพรวมวันนี้'}
                        </button>
                    </div>
                    
                    {aiAnalysis ? (
                        <div className="prose prose-sm dark:prose-invert max-w-none text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/30 p-4 rounded-lg animate-fade-in">
                            <p>{aiAnalysis}</p>
                        </div>
                    ) : (
                        <p className="text-sm text-gray-400 text-center py-4">
                            บันทึกข้อมูลให้ครบ แล้วกดปุ่มวิเคราะห์เพื่อรับคำแนะนำจาก AI
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default WellnessCheckin;
