
import React, { useState, useContext, useEffect } from 'react';
import { AppContext } from '../context/AppContext';
import { SunIcon, MoonIcon, BellIcon, LineIcon, SparklesIcon, ClipboardDocumentCheckIcon } from './icons';
import { sendTestNotification } from '../services/googleSheetService';
import PDPAModal from './PDPAModal';

const Settings: React.FC = () => {
    const { scriptUrl, setScriptUrl, isDataSynced, theme, setTheme, currentUser, userProfile, setUserProfile, logout } = useContext(AppContext);
    
    const [currentScriptUrl, setCurrentScriptUrl] = useState(scriptUrl);
    const [saved, setSaved] = useState<'none' | 'sheets' | 'notifications'>('none');
    const [showGoogleSheetsSettings, setShowGoogleSheetsSettings] = useState(false);
    const [testingNotif, setTestingNotif] = useState(false);
    const [showPDPA, setShowPDPA] = useState(false);

    useEffect(() => {
        setCurrentScriptUrl(scriptUrl);
    }, [scriptUrl]);

    const handleSheetsSave = (e: React.FormEvent) => {
        e.preventDefault();
        setScriptUrl(currentScriptUrl);
        setSaved('sheets');
        setTimeout(() => setSaved('none'), 3000);
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
            if (result.success) alert("ส่งข้อความทดสอบสำเร็จ!");
            else alert("ไม่สามารถส่งข้อความได้: " + result.message);
        } catch (e) {
            alert("เกิดข้อผิดพลาดในการเชื่อมต่อ");
        } finally {
            setTestingNotif(false);
        }
    };

    const handleRevokePDPA = () => {
        if (window.confirm("คุณต้องการยกเลิกความยินยอมใช่หรือไม่? \n\nหากยกเลิก คุณจะไม่สามารถใช้งานแอปพลิเคชันได้และระบบจะลงชื่อออกอัตโนมัติ เพื่อคุ้มครองข้อมูลของคุณตามนโยบาย PDPA")) {
            if (!currentUser) return;
            
            const updatedProfile = { 
                ...userProfile, 
                pdpaAccepted: false, 
                pdpaAcceptedDate: '' 
            };
            setUserProfile(updatedProfile, { 
                displayName: currentUser.displayName, 
                profilePicture: currentUser.profilePicture 
            });
            
            setShowPDPA(false);
            setTimeout(() => {
                logout();
            }, 500);
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
                            theme === 'light' ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/50' : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 hover:border-teal-400 hover:bg-gray-50'
                        }`}
                    >
                        <SunIcon className="w-8 h-8 text-yellow-500 mb-2" />
                        <span className="font-semibold text-gray-800 dark:text-white">สว่าง</span>
                    </button>
                    <button
                        onClick={() => setTheme('dark')}
                        className={`flex flex-col items-center justify-center w-32 h-24 p-4 rounded-lg border-2 transition-colors duration-200 ${
                            theme === 'dark' ? 'border-teal-500 bg-slate-800' : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 hover:border-teal-400 hover:bg-gray-50'
                        }`}
                    >
                        <MoonIcon className="w-8 h-8 text-indigo-400 mb-2" />
                        <span className="font-semibold text-gray-800 dark:text-white">มืด</span>
                    </button>
                </div>
            </div>

            {currentUser?.role !== 'guest' && (
                <>
                    <div className="bg-white dark:bg-gray-800 p-6 md:p-8 rounded-2xl shadow-lg w-full border-l-4 border-teal-500">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <div className={`p-3 rounded-full ${isRemindersOn ? 'bg-teal-100 dark:bg-teal-900/30' : 'bg-gray-100 dark:bg-gray-700'}`}>
                                    <BellIcon className={`w-6 h-6 ${isRemindersOn ? 'text-teal-600 dark:text-teal-400' : 'text-gray-400'}`} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-gray-800 dark:text-white">การแจ้งเตือนรายวัน</h2>
                                    <p className="text-gray-600 dark:text-gray-300 text-sm mt-1">รับภารกิจสุขภาพตอนเช้าผ่าน LINE</p>
                                    {!hasLineId && <p className="text-red-500 text-xs mt-1 font-bold">⚠️ กรุณา Log in ด้วย LINE</p>}
                                </div>
                            </div>
                            <div className="flex flex-col items-end gap-2 w-full sm:w-auto">
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" className="sr-only peer" checked={isRemindersOn} onChange={toggleNotifications} disabled={!hasLineId} />
                                    <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-teal-300 dark:peer-focus:ring-teal-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all dark:border-gray-600 peer-checked:bg-teal-600"></div>
                                </label>
                                {hasLineId && (
                                    <button onClick={handleTestNotification} disabled={testingNotif} className="text-xs text-blue-500 hover:underline">
                                        {testingNotif ? 'กำลังส่ง...' : 'ทดสอบส่งข้อความ LINE'}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* PDPA Section */}
                    <div className="bg-white dark:bg-gray-800 p-6 md:p-8 rounded-2xl shadow-lg w-full border-l-4 border-indigo-500">
                        <div className="flex flex-col sm:flex-row items-center gap-4 justify-between">
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-full bg-indigo-100 dark:bg-indigo-900/30">
                                    <ClipboardDocumentCheckIcon className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-gray-800 dark:text-white">PDPA & Privacy</h2>
                                    <p className="text-gray-600 dark:text-gray-300 text-sm mt-1">จัดการความยินยอมและข้อมูลส่วนบุคคล</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => setShowPDPA(true)}
                                className="px-6 py-2.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg text-sm font-bold text-gray-700 dark:text-gray-200 transition-colors w-full sm:w-auto"
                            >
                                ตรวจสอบ / แก้ไข
                            </button>
                        </div>
                    </div>
                </>
            )}

            {currentUser?.role === 'admin' && (
                <div className="bg-white dark:bg-gray-800 p-6 md:p-8 rounded-2xl shadow-lg w-full border border-orange-200">
                    <div className="flex items-center justify-between">
                        <div className="flex-1">
                            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Google Sheets Connect</h2>
                            <p className="text-gray-600 dark:text-gray-300 text-sm mt-1">เชื่อมต่อเพื่อบันทึกและซิงค์ข้อมูลวิจัย</p>
                        </div>
                        <button onClick={() => setShowGoogleSheetsSettings(!showGoogleSheetsSettings)} className="text-teal-600 font-bold">จัดการ</button>
                    </div>
                    {showGoogleSheetsSettings && (
                        <form onSubmit={handleSheetsSave} className="mt-6 space-y-4 animate-fade-in border-t pt-4">
                            <input type="url" value={currentScriptUrl} onChange={(e) => setCurrentScriptUrl(e.target.value)} placeholder="Web App URL" className="w-full p-2 border rounded-md dark:bg-gray-700" required />
                            <button type="submit" className="w-full bg-teal-500 text-white font-bold py-3 rounded-lg hover:bg-teal-600">บันทึกการเชื่อมต่อ</button>
                        </form>
                    )}
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
