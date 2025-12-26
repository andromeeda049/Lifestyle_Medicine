
import React, { useState, useContext, useEffect } from 'react';
import { AppContext } from '../context/AppContext';
import { SunIcon, MoonIcon, BellIcon, LineIcon, SparklesIcon, ClipboardDocumentCheckIcon } from './icons';
import { sendTestNotification, sendTelegramTestNotification } from '../services/googleSheetService';
import { TELEGRAM_BOT_USERNAME } from '../constants';
import PDPAModal from './PDPAModal';

const Settings: React.FC = () => {
    const { scriptUrl, setScriptUrl, theme, setTheme, currentUser, userProfile, setUserProfile, logout } = useContext(AppContext);
    
    const [currentScriptUrl, setCurrentScriptUrl] = useState(scriptUrl);
    const [saved, setSaved] = useState<'none' | 'sheets' | 'notifications' | 'ai'>('none');
    const [testingNotif, setTestingNotif] = useState(false);
    const [testingTelegram, setTestingTelegram] = useState(false);
    const [showPDPA, setShowPDPA] = useState(false);
    
    const [aiInstruction, setAiInstruction] = useState(userProfile.aiSystemInstruction || '');

    useEffect(() => {
        setCurrentScriptUrl(scriptUrl);
        setAiInstruction(userProfile.aiSystemInstruction || '');
    }, [scriptUrl, userProfile]);

    const handleSheetsSave = (e: React.FormEvent) => {
        e.preventDefault();
        setScriptUrl(currentScriptUrl);
        setSaved('sheets');
        setTimeout(() => setSaved('none'), 3000);
    };

    const handleAISave = () => {
        if (!currentUser) return;
        const updatedProfile = { ...userProfile, aiSystemInstruction: aiInstruction };
        setUserProfile(updatedProfile, { 
            displayName: currentUser.displayName, 
            profilePicture: currentUser.profilePicture 
        });
        setSaved('ai');
        setTimeout(() => setSaved('none'), 2000);
    };

    const toggleNotifications = () => {
        if (!currentUser) return;
        const newValue = !userProfile.receiveDailyReminders;
        const updatedProfile = { ...userProfile, receiveDailyReminders: newValue };
        setUserProfile(updatedProfile, { 
            displayName: currentUser.displayName, 
            profilePicture: currentUser.profilePicture 
        });
        setSaved('notifications');
        setTimeout(() => setSaved('none'), 2000);
    };

    const handleTestNotification = async () => {
        if (!scriptUrl || !currentUser) return;
        setTestingNotif(true);
        try {
            const result = await sendTestNotification(scriptUrl, currentUser);
            if (result.success) alert("ส่งข้อความทดสอบ LINE สำเร็จ!");
            else alert("ล้มเหลว: " + result.message);
        } catch (e) {
            alert("เกิดข้อผิดพลาดในการเชื่อมต่อ");
        } finally {
            setTestingNotif(false);
        }
    };

    const handleTestTelegramNotification = async () => {
        if (!scriptUrl || !currentUser) return;
        setTestingTelegram(true);
        try {
            const result = await sendTelegramTestNotification(scriptUrl, currentUser);
            if (result.success) alert("ส่งข้อความทดสอบ Telegram สำเร็จ!");
            else alert("ล้มเหลว: " + result.message + "\n\n*โปรดตรวจสอบว่าคุณได้กด /start ที่บอทแล้วหรือยัง");
        } catch (e) {
            alert("เกิดข้อผิดพลาดในการเชื่อมต่อ");
        } finally {
            setTestingTelegram(false);
        }
    };

    const handleRevokePDPA = () => {
        if (window.confirm("คุณต้องการยกเลิกความยินยอมใช่หรือไม่? \n\nระบบจะลงชื่อออกอัตโนมัติ เพื่อคุ้มครองข้อมูลของคุณตามนโยบาย PDPA")) {
            if (!currentUser) return;
            const updatedProfile = { ...userProfile, pdpaAccepted: false, pdpaAcceptedDate: '' };
            setUserProfile(updatedProfile, { displayName: currentUser.displayName, profilePicture: currentUser.profilePicture });
            setShowPDPA(false);
            setTimeout(() => logout(), 500);
        }
    };

    const isRemindersOn = !!userProfile.receiveDailyReminders;
    const hasLineId = !!userProfile.lineUserId;
    const hasTelegramId = !!userProfile.telegramUserId;
    const isSuperAdmin = currentUser?.role === 'admin' && currentUser?.organization === 'all';

    return (
        <div className="space-y-8 animate-fade-in">
             <div className="bg-white dark:bg-gray-800 p-6 md:p-8 rounded-2xl shadow-lg w-full">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6 text-center uppercase tracking-tight">Appearance</h2>
                <div className="flex justify-center gap-4">
                    <button
                        onClick={() => setTheme('light')}
                        className={`flex flex-col items-center justify-center w-32 h-24 p-4 rounded-xl border-2 transition-all ${
                            theme === 'light' ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/20' : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900'
                        }`}
                    >
                        <SunIcon className="w-8 h-8 text-amber-500 mb-2" />
                        <span className="text-xs font-bold uppercase">Light</span>
                    </button>
                    <button
                        onClick={() => setTheme('dark')}
                        className={`flex flex-col items-center justify-center w-32 h-24 p-4 rounded-xl border-2 transition-all ${
                            theme === 'dark' ? 'border-teal-500 bg-slate-800' : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900'
                        }`}
                    >
                        <MoonIcon className="w-8 h-8 text-indigo-400 mb-2" />
                        <span className="text-xs font-bold uppercase">Dark</span>
                    </button>
                </div>
            </div>

            {currentUser?.role !== 'guest' && (
                <>
                    {/* Notification Management */}
                    <div className="bg-white dark:bg-gray-800 p-6 md:p-8 rounded-2xl shadow-md w-full border-l-4 border-teal-500">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <BellIcon className={`w-6 h-6 ${isRemindersOn ? 'text-teal-600' : 'text-slate-300'}`} />
                                <h2 className="text-lg font-bold text-slate-800 dark:text-white">Daily Notifications</h2>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" className="sr-only peer" checked={isRemindersOn} onChange={toggleNotifications} />
                                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
                            </label>
                        </div>

                        <div className="space-y-4">
                            {/* LINE Section */}
                            <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <LineIcon className="w-5 h-5 text-[#06C755]" />
                                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300">LINE Notify</span>
                                </div>
                                {hasLineId ? (
                                    <button onClick={handleTestNotification} disabled={testingNotif} className="text-[10px] font-black uppercase text-teal-600 hover:underline">
                                        {testingNotif ? 'Sending...' : 'Test Send'}
                                    </button>
                                ) : (
                                    <span className="text-[10px] font-bold text-rose-500 uppercase">Not Linked</span>
                                )}
                            </div>

                            {/* Telegram Section */}
                            <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800 flex flex-col gap-3">
                                <div className="flex items-center justify-between w-full">
                                    <div className="flex items-center gap-3">
                                        <span className="text-xl">✈️</span>
                                        <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Telegram Bot</span>
                                    </div>
                                    {hasTelegramId ? (
                                        <button onClick={handleTestTelegramNotification} disabled={testingTelegram} className="text-[10px] font-black uppercase text-blue-500 hover:underline">
                                            {testingTelegram ? 'Sending...' : 'Test Send'}
                                        </button>
                                    ) : (
                                        <span className="text-[10px] font-bold text-rose-500 uppercase">Not Linked</span>
                                    )}
                                </div>
                                
                                <a 
                                    href={`https://t.me/${TELEGRAM_BOT_USERNAME}`} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-[10px] bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 p-2 rounded-lg text-center font-bold hover:brightness-95 transition-all"
                                >
                                    คลิกเพื่อเปิดแชทกับ @{TELEGRAM_BOT_USERNAME} และกด START
                                </a>
                            </div>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-4 uppercase tracking-widest text-center font-bold">
                            *Link your account by logging in with Social ID
                        </p>
                    </div>

                    <div className="bg-white dark:bg-gray-800 p-6 md:p-8 rounded-2xl shadow-md w-full border-l-4 border-indigo-500">
                        <div className="flex items-center gap-4 justify-between">
                            <div className="flex items-center gap-4">
                                <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-900/20">
                                    <ClipboardDocumentCheckIcon className="w-6 h-6 text-indigo-600" />
                                </div>
                                <div>
                                    <h2 className="text-base font-bold text-slate-800 dark:text-white">Privacy & PDPA</h2>
                                    <p className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Manage your data consent</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => setShowPDPA(true)}
                                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300"
                            >
                                Review
                            </button>
                        </div>
                    </div>
                </>
            )}

            {isSuperAdmin && (
                <div className="bg-white dark:bg-gray-800 p-6 md:p-8 rounded-2xl shadow-md w-full border-l-4 border-purple-500">
                    <div className="flex items-center gap-3 mb-4">
                        <SparklesIcon className="w-6 h-6 text-purple-600" />
                        <h2 className="text-base font-bold text-slate-800 dark:text-white uppercase tracking-tight">AI System Persona</h2>
                    </div>
                    <textarea 
                        value={aiInstruction}
                        onChange={(e) => setAiInstruction(e.target.value)}
                        placeholder="Define AI Behavior..."
                        className="w-full p-3 border-2 border-slate-100 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-900 text-sm focus:border-purple-400 outline-none transition-colors min-h-[100px]"
                    />
                    <div className="flex justify-end mt-3">
                        <button 
                            onClick={handleAISave}
                            className="px-6 py-2 bg-purple-600 text-white rounded-xl text-[11px] font-black uppercase tracking-widest shadow-sm active:scale-95 transition-all"
                        >
                            {saved === 'ai' ? 'SAVED' : 'SAVE AI RULES'}
                        </button>
                    </div>
                </div>
            )}

            {showPDPA && (
                <PDPAModal 
                    onAccept={() => setShowPDPA(false)}
                    onRevoke={handleRevokePDPA}
                    isSettingsMode={true}
                    onClose={() => setShowPDPA(false)}
                />
            )}
        </div>
    );
};

export default Settings;
