import React, { useState, useContext, useEffect } from 'react';
import { AppContext } from '../context/AppContext';
import { SunIcon, MoonIcon } from './icons';

const Settings: React.FC = () => {
    const { scriptUrl, setScriptUrl, apiKey, setApiKey, isDataSynced, theme, setTheme } = useContext(AppContext);
    
    const [currentScriptUrl, setCurrentScriptUrl] = useState(scriptUrl);
    const [currentApiKey, setCurrentApiKey] = useState(apiKey);
    const [saved, setSaved] = useState<'none' | 'sheets' | 'api'>('none');
    const [showGoogleSheetsSettings, setShowGoogleSheetsSettings] = useState(false);
    const [showApiKeySettings, setShowApiKeySettings] = useState(false);

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

    return (
        <div className="space-y-8">
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

            <div className="bg-white dark:bg-gray-800 p-6 md:p-8 rounded-2xl shadow-lg w-full">
                 <div className="flex items-center justify-between">
                    <div className="flex-1">
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                           ตั้งค่า Gemini API Key
                        </h2>
                        <p className="text-gray-600 dark:text-gray-300 text-sm mt-1">
                            (สำหรับผู้ใช้ขั้นสูง) ตั้งค่า API Key ของคุณเอง
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

            <div className="bg-white dark:bg-gray-800 p-6 md:p-8 rounded-2xl shadow-lg w-full">
                 <div className="flex items-center justify-between">
                    <div className="flex-1">
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                           ตั้งค่าการเชื่อมต่อ Google Sheets
                        </h2>
                        <p className="text-gray-600 dark:text-gray-300 text-sm mt-1">
                            (สำหรับผู้ใช้ขั้นสูง) เชื่อมต่อเพื่อบันทึกและซิงค์ข้อมูลของคุณ
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
        </div>
    );
};

export default Settings;