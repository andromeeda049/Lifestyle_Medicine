
import React, { useState, useContext, useEffect } from 'react';
import { AppContext } from '../context/AppContext';
import { SunIcon, MoonIcon, BellIcon, LineIcon, SparklesIcon } from './icons';
import { sendTestNotification } from '../services/googleSheetService';

const Settings: React.FC = () => {
    const { scriptUrl, setScriptUrl, apiKey, setApiKey, isDataSynced, theme, setTheme, currentUser, userProfile, setUserProfile } = useContext(AppContext);
    
    const [currentScriptUrl, setCurrentScriptUrl] = useState(scriptUrl);
    const [currentApiKey, setCurrentApiKey] = useState(apiKey);
    const [saved, setSaved] = useState<'none' | 'sheets' | 'api' | 'notifications'>('none');
    const [showGoogleSheetsSettings, setShowGoogleSheetsSettings] = useState(false);
    const [showApiKeySettings, setShowApiKeySettings] = useState(false);
    const [testingNotif, setTestingNotif] = useState(false);

    useEffect(() => {
        setCurrentScriptUrl(scriptUrl);
    }, [scriptUrl]);

    useEffect(() => {
        setCurrentApiKey(apiKey);
    }, [apiKey]);


    const handleSheetsSave = (e: React.FormEvent) => {
        e.preventDefault();
        setScriptUrl(currentScriptUrl);
        setSaved('sheets');
        setTimeout(() => setSaved('none'), 3000);
    };
    
    const handleApiSave = (e: React.FormEvent) => {
        e.preventDefault();
        setApiKey(currentApiKey);
        setSaved('api');
        setTimeout(() => setSaved('none'), 3000);
    };

    const toggleNotifications = () => {
        if (!currentUser) return;
        
        const newValue = !userProfile.receiveDailyReminders;
        const updatedProfile = { ...userProfile, receiveDailyReminders: newValue };
        
        // Use existing context function to save to local state and sync to sheet
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
            if (result.success) {
                alert("ส่งข้อความทดสอบสำเร็จ! กรุณาตรวจสอบแอป LINE ของคุณ");
            } else {
                alert("ไม่สามารถส่งข้อความได้: " + result.message + "\n\n(กรุณาตรวจสอบว่าคุณ Log in ด้วย LINE หรือยัง และอัปเดต Code.gs)");
            }
        } catch (e) {
            alert("เกิดข้อผิดพลาดในการเชื่อมต่อ");
        } finally {
            setTestingNotif(false);
        }
    };

    const handleResetMission = () => {
        if (window.confirm("ต้องการรีเซ็ตสถานะภารกิจของวันนี้ใช่หรือไม่?\n(ระบบจะแจ้งเตือน Mission Complete อีกครั้งเมื่อคุณทำภารกิจครบ)")) {
            // Remove the local storage key that tracks daily completion
            // Note: Since useLocalStorage is hook based, direct removal requires a reload to sync App.tsx state cleanly for this specific case
            window.localStorage.removeItem('lastMissionCompleteDate');
            alert('รีเซ็ตเรียบร้อย! ระบบจะโหลดหน้าใหม่...');
            window.location.reload();
        }
    };

    const isRemindersOn = !!userProfile.receiveDailyReminders;
    const hasLineId = !!userProfile.lineUserId;

    return (
        <div className="space-y-8 animate-fade-in">
             <div className="bg-white dark:bg-gray-800 p-6 md:p-8 rounded-2xl shadow-lg w-full">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6 text-center">ลักษณะที่ปรากฏ</h2>
                <div className="flex justify-center gap-4">
                    <button
                        onClick={() => setTheme('light')}
                        className={`flex flex-col items-center justify-center w-32 h-24 p-4 rounded-lg border-2 transition-colors duration-200 ${
                            theme === 'light' ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/50' : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 hover:border-teal-400 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                        }`}
                        aria-pressed={theme === 'light'}
                    >
                        <SunIcon className="w-8 h-8 text-yellow-500 mb-2" />
                        <span className="font-semibold text-gray-800 dark:text-white">สว่าง</span>
                    </button>
                    <button
                        onClick={() => setTheme('dark')}
                        className={`flex flex-col items-center justify-center w-32 h-24 p-4 rounded-lg border-2 transition-colors duration-200 ${
                            theme === 'dark' ? 'border-teal-500 bg-slate-800' : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 hover:border-teal-400 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                        }`}
                         aria-pressed={theme === 'dark'}
                    >
                        <MoonIcon className="w-8 h-8 text-indigo-400 mb-2" />
                        <span className="font-semibold text-gray-800 dark:text-white">มืด</span>
                    </button>
                </div>
            </div>

            {/* Notification Settings (Visible for User and Admin) */}
            {currentUser?.role !== 'guest' && (
                <div className="bg-white dark:bg-gray-800 p-6 md:p-8 rounded-2xl shadow-lg w-full border-l-4 border-teal-500 transition-all hover:shadow-xl">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-full transition-colors duration-300 ${isRemindersOn ? 'bg-teal-100 dark:bg-teal-900/30' : 'bg-gray-100 dark:bg-gray-700'}`}>
                                <BellIcon className={`w-6 h-6 transition-colors duration-300 ${isRemindersOn ? 'text-teal-600 dark:text-teal-400' : 'text-gray-400'}`} />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-800 dark:text-white">
                                    การแจ้งเตือนรายวัน
                                </h2>
                                <p className="text-gray-600 dark:text-gray-300 text-sm mt-1">
                                    รับข้อความแจ้งเตือนภารกิจสุขภาพตอนเช้าผ่าน LINE
                                </p>
                                {!hasLineId && (
                                    <p className="text-red-500 text-xs mt-1 font-bold">
                                        ⚠️ ยังไม่เชื่อมต่อ LINE: กรุณา Log out แล้วเลือก "Log in with LINE"
                                    </p>
                                )}
                            </div>
                        </div>
                        <div className="flex flex-col items-end gap-2 w-full sm:w-auto">
                            <div className="flex items-center gap-2">
                                <label htmlFor="toggle-notif" className="relative inline-flex items-center cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        id="toggle-notif" 
                                        className="sr-only peer" 
                                        checked={isRemindersOn} 
                                        onChange={toggleNotifications} 
                                        disabled={!hasLineId}
                                    />
                                    <div className={`w-14 h-7 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-teal-300 dark:peer-focus:ring-teal-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all dark:border-gray-600 ${isRemindersOn ? 'peer-checked:bg-teal-600' : ''}`}></div>
                                </label>
                                <span className={`text-xs font-semibold ${isRemindersOn ? 'text-teal-600 dark:text-teal-400' : 'text-gray-400'}`}>
                                    {isRemindersOn ? 'เปิด' : 'ปิด'}
                                </span>
                            </div>
                            
                            {hasLineId && (
                                <div className="flex flex-col items-end gap-1 mt-2">
                                    <button 
                                        onClick={handleTestNotification}
                                        disabled={testingNotif}
                                        className="text-xs text-blue-500 hover:underline flex items-center gap-1"
                                    >
                                        <LineIcon className="w-3 h-3" />
                                        {testingNotif ? 'กำลังส่ง...' : 'ทดสอบส่งข้อความ LINE'}
                                    </button>
                                    
                                    <button 
                                        onClick={handleResetMission}
                                        className="text-xs text-orange-500 hover:underline flex items-center gap-1"
                                    >
                                        <SparklesIcon className="w-3 h-3" />
                                        รีเซ็ตสถานะ Mission (ทดสอบ)
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                    {saved === 'notifications' && (
                        <p className="text-sm text-green-500 mt-2 text-right font-medium animate-pulse">บันทึกการตั้งค่าแล้ว</p>
                    )}
                </div>
            )}

            {/* Advanced Settings (Admin Only) */}
            {currentUser?.role === 'admin' && (
                <>
                    <div className="bg-white dark:bg-gray-800 p-6 md:p-8 rounded-2xl shadow-lg w-full border border-orange-200 dark:border-orange-900/50">
                        <div className="flex items-center justify-between">
                            <div className="flex-1">
                                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                                ตั้งค่า Gemini API Key
                                </h2>
                                <p className="text-gray-600 dark:text-gray-300 text-sm mt-1">
                                    (สำหรับผู้ดูแลระบบ) ตั้งค่า API Key ของระบบ
                                </p>
                            </div>
                            <label htmlFor="toggle-api" className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" id="toggle-api" className="sr-only peer" checked={showApiKeySettings} onChange={() => setShowApiKeySettings(prev => !prev)} />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-teal-300 dark:peer-focus:ring-teal-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-teal-600"></div>
                            </label>
                        </div>
                    
                        {showApiKeySettings && (
                            <div className="mt-6 border-t pt-6 dark:border-gray-700 animate-fade-in">
                                {saved === 'api' && (
                                    <div className="bg-green-100 dark:bg-green-900/50 border-l-4 border-green-500 text-green-700 dark:text-green-300 p-4 rounded-md mb-6" role="alert">
                                        <p className="font-bold">บันทึก API Key สำเร็จ!</p>
                                    </div>
                                )}
                                <form onSubmit={handleApiSave} className="space-y-4">
                                    <div>
                                        <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Gemini API Key
                                        </label>
                                        <input
                                            type="password"
                                            id="apiKey"
                                            value={currentApiKey}
                                            onChange={(e) => setCurrentApiKey(e.target.value)}
                                            placeholder="วาง API Key ของคุณที่นี่"
                                            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 focus:ring-2 focus:ring-teal-500"
                                            required
                                        />
                                    </div>
                                    <button type="submit" className="w-full bg-teal-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-teal-600 focus:outline-none focus:ring-4 focus:ring-teal-300 dark:focus:ring-teal-700 transition-colors duration-300">
                                        บันทึก API Key
                                    </button>
                                </form>
                            </div>
                        )}
                    </div>

                    <div className="bg-white dark:bg-gray-800 p-6 md:p-8 rounded-2xl shadow-lg w-full border border-orange-200 dark:border-orange-900/50">
                        <div className="flex items-center justify-between">
                            <div className="flex-1">
                                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                                ตั้งค่าการเชื่อมต่อ Google Sheets
                                </h2>
                                <p className="text-gray-600 dark:text-gray-300 text-sm mt-1">
                                    (สำหรับผู้ดูแลระบบ) เชื่อมต่อเพื่อบันทึกและซิงค์ข้อมูล
                                </p>
                            </div>
                            <label htmlFor="toggle-sheets" className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" id="toggle-sheets" className="sr-only peer" checked={showGoogleSheetsSettings} onChange={() => setShowGoogleSheetsSettings(prev => !prev)} />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-teal-300 dark:peer-focus:ring-teal-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-teal-600"></div>
                            </label>
                        </div>
                    
                        {showGoogleSheetsSettings && (
                            <div className="mt-6 border-t pt-6 dark:border-gray-700 animate-fade-in">
                                {saved === 'sheets' && (
                                    <div className="bg-green-100 dark:bg-green-900/50 border-l-4 border-green-500 text-green-700 dark:text-green-300 p-4 rounded-md mb-6" role="alert">
                                        <p className="font-bold">บันทึก URL สำเร็จ!</p>
                                        <p>แอปจะพยายามดึงข้อมูลล่าสุดเมื่อคุณเปิดแอปครั้งถัดไป</p>
                                    </div>
                                )}
                                
                                <div className="flex items-center gap-2 mb-4 p-3 bg-blue-50 dark:bg-blue-900/50 rounded-lg">
                                    <span className={`w-3 h-3 rounded-full ${isDataSynced ? 'bg-green-500' : 'bg-yellow-500 animate-pulse'}`}></span>
                                    <p className="text-sm text-blue-800 dark:text-blue-200">
                                        สถานะ: {isDataSynced ? 'ข้อมูลเป็นปัจจุบัน' : 'กำลังซิงค์ข้อมูล...'}
                                    </p>
                                </div>

                                <form onSubmit={handleSheetsSave} className="space-y-4">
                                    <div>
                                        <label htmlFor="scriptUrl" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Web App URL จาก Google Apps Script
                                        </label>
                                        <input
                                            type="url"
                                            id="scriptUrl"
                                            value={currentScriptUrl}
                                            onChange={(e) => setCurrentScriptUrl(e.target.value)}
                                            placeholder="https://script.google.com/macros/s/.../exec"
                                            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 focus:ring-2 focus:ring-teal-500"
                                            required
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        className="w-full bg-teal-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-teal-600 focus:outline-none focus:ring-4 focus:ring-teal-300 dark:focus:ring-teal-700 transition-colors duration-300"
                                    >
                                        บันทึกการเชื่อมต่อ
                                    </button>
                                </form>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

export default Settings;
