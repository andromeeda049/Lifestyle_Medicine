
import React, { useState, useContext, useEffect } from 'react';
import { AppContext } from '../context/AppContext';
import { User } from '../types';
import { LineIcon, LockIcon, ArrowLeftIcon, ExclamationTriangleIcon } from './icons';
import { socialAuth } from '../services/googleSheetService';
import liff from '@line/liff';
import { ORGANIZATIONS, APP_LOGO_URL, ADMIN_CREDENTIALS } from '../constants';

// Configuration
const LINE_LIFF_ID = "2008705690-V5wrjpTX";

const UserAuth: React.FC<{ onLogin: (user: User) => void }> = ({ onLogin }) => {
    const { scriptUrl } = useContext(AppContext);

    // UI State
    const [view, setView] = useState<'main' | 'admin'>('main');
    const [loading, setLoading] = useState(false);
    const [statusText, setStatusText] = useState('');
    const [error, setError] = useState('');

    // LINE State
    const [isLineReady, setIsLineReady] = useState(false);
    const [lineError, setLineError] = useState('');

    // Admin Form State
    const [password, setPassword] = useState('');

    // --- 1. CLEAN LINE INITIALIZATION ---
    useEffect(() => {
        const initLine = async () => {
            try {
                // Check if LIFF is already initialized to avoid double init error
                if (!liff.id) {
                    await liff.init({ liffId: LINE_LIFF_ID });
                }
                setIsLineReady(true);

                // Auto Login Logic
                if (liff.isLoggedIn()) {
                    setLoading(true);
                    setStatusText('กำลังเชื่อมต่อฐานข้อมูล...');
                    
                    const profile = await liff.getProfile();
                    const userEmail = liff.getDecodedIDToken()?.email || `${profile.userId}@line.me`;

                    if (scriptUrl) {
                        try {
                            const res = await socialAuth(scriptUrl, {
                                email: userEmail,
                                name: profile.displayName,
                                picture: profile.pictureUrl || '',
                                provider: 'line',
                                userId: profile.userId
                            });

                            if (res.success && res.user) {
                                onLogin({ ...res.user, authProvider: 'line' });
                            } else {
                                // Show SPECIFIC Backend Error
                                setError(`เชื่อมต่อฐานข้อมูลไม่สำเร็จ: ${res.message}`);
                                setLoading(false);
                            }
                        } catch (fetchErr: any) {
                            setError(`Network Error: ${fetchErr.message}`);
                            setLoading(false);
                        }
                    } else {
                        setError('ไม่พบ URL ของ Google Script (กรุณาตั้งค่าใน Admin)');
                        setLoading(false);
                    }
                }
            } catch (err: any) {
                console.error("LINE Init Error:", err);
                setLineError(err.message || "LINE Init Failed");
                setLoading(false);
            }
        };
        initLine();
    }, [scriptUrl, onLogin]);

    const handleLineLogin = () => {
        setError('');
        if (!isLineReady) {
            setError('LINE ยังไม่พร้อมใช้งาน (กรุณารีเฟรช)');
            return;
        }
        if (!liff.isLoggedIn()) {
            liff.login();
        } else {
            // Already logged in but maybe stuck? Retry init logic manually
            window.location.reload();
        }
    };

    // --- 2. ADMIN PASSWORD LOGIN (SIMPLIFIED) ---
    const handleAdminLogin = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        setStatusText('กำลังตรวจสอบสิทธิ์...');

        // Simulate slight delay for UX
        setTimeout(() => {
            const targetOrgId = ADMIN_CREDENTIALS[password];

            if (targetOrgId) {
                const orgName = ORGANIZATIONS.find(o => o.id === targetOrgId)?.name || 'Admin';
                
                const adminUser: User = {
                    username: `admin_${targetOrgId}`,
                    displayName: `Admin: ${orgName}`,
                    profilePicture: '🛡️',
                    role: 'admin',
                    organization: targetOrgId,
                    authProvider: 'email'
                };
                
                onLogin(adminUser);
            } else {
                setError('รหัสผ่านไม่ถูกต้อง (Access Denied)');
                setLoading(false);
            }
        }, 800);
    };

    // --- 3. GUEST LOGIN ---
    const handleGuestLogin = () => {
        const guestUser: User = {
            username: `guest_${Date.now()}`,
            displayName: 'Guest User',
            profilePicture: '👤',
            role: 'guest',
            organization: 'general'
        };
        onLogin(guestUser);
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-gray-600 dark:text-gray-300 font-medium animate-pulse">{statusText}</p>
            </div>
        );
    }

    return (
        <div className="animate-fade-in relative w-full">
            {/* Error Banner */}
            {(error || lineError) && (
                <div className="bg-red-50 text-red-600 p-4 rounded-xl text-xs text-left border border-red-200 flex flex-col gap-1 mb-4 animate-bounce-in shadow-sm">
                    <div className="flex items-center gap-2 font-bold text-sm">
                        <ExclamationTriangleIcon className="w-5 h-5" />
                        เกิดข้อผิดพลาด
                    </div>
                    <p>{error || lineError}</p>
                    {error.includes("Script") && (
                        <p className="mt-1 text-red-400 italic">
                            *คำแนะนำ: กรุณาตรวจสอบว่า Google Apps Script ได้ Deploy เป็น "New Version" แล้วหรือยัง
                        </p>
                    )}
                </div>
            )}

            {/* --- MAIN VIEW: User Focus --- */}
            {view === 'main' && (
                <div className="space-y-4">
                    <button
                        onClick={handleLineLogin}
                        disabled={!isLineReady}
                        className={`w-full py-4 rounded-2xl font-bold text-white flex items-center justify-center gap-3 shadow-lg shadow-green-100 dark:shadow-none transition-all transform hover:scale-[1.02] active:scale-95 ${isLineReady ? 'bg-[#06C755] hover:bg-[#05b64d]' : 'bg-gray-300 cursor-not-allowed'}`}
                    >
                        <LineIcon className="w-7 h-7 fill-current" />
                        <span className="text-lg">เข้าสู่ระบบด้วย LINE</span>
                    </button>

                    <div className="pt-4 pb-2">
                        <div className="relative flex py-2 items-center">
                            <div className="flex-grow border-t border-gray-200 dark:border-gray-700"></div>
                            <span className="flex-shrink-0 mx-4 text-gray-400 text-xs bg-white dark:bg-gray-800 px-2">ตัวเลือกอื่น</span>
                            <div className="flex-grow border-t border-gray-200 dark:border-gray-700"></div>
                        </div>
                    </div>

                    <button 
                        onClick={() => setView('admin')}
                        className="w-full py-3 bg-white dark:bg-gray-700 border-2 border-gray-100 dark:border-gray-600 text-gray-700 dark:text-gray-200 font-bold rounded-xl hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors text-sm"
                    >
                        สำหรับเจ้าหน้าที่ (Staff Login)
                    </button>

                    <button 
                        onClick={handleGuestLogin}
                        className="w-full py-2 text-gray-400 hover:text-teal-600 dark:hover:text-teal-400 text-xs transition-colors underline"
                    >
                        ทดลองใช้งานทั่วไป (Guest Mode)
                    </button>
                </div>
            )}

            {/* --- ADMIN VIEW: Password Only --- */}
            {view === 'admin' && (
                <div className="animate-slide-up">
                    <button 
                        onClick={() => { setView('main'); setError(''); setPassword(''); }}
                        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 mb-6 transition-colors"
                    >
                        <ArrowLeftIcon className="w-4 h-4" /> กลับหน้าหลัก
                    </button>

                    <div className="text-center mb-6">
                        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-3">
                            <LockIcon className="w-8 h-8 text-gray-500 dark:text-gray-300" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-800 dark:text-white">เข้าสู่ระบบเจ้าหน้าที่</h3>
                        <p className="text-xs text-gray-500">กรุณากรอกรหัสผ่านหน่วยงาน (Access Code)</p>
                    </div>

                    <form onSubmit={handleAdminLogin} className="space-y-4">
                        <div className="relative group">
                            <LockIcon className="absolute left-3 top-3.5 w-5 h-5 text-gray-400 group-focus-within:text-teal-500 transition-colors" />
                            <input
                                type="password"
                                placeholder="รหัสผ่าน (Password)"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none transition-all text-sm font-bold tracking-widest"
                                required
                                autoFocus
                            />
                        </div>

                        <button
                            type="submit"
                            className="w-full py-3 bg-gradient-to-r from-gray-700 to-gray-900 text-white font-bold rounded-xl shadow-md hover:from-black hover:to-gray-800 transition-all transform active:scale-95 mt-4"
                        >
                            ยืนยันรหัสผ่าน
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
};

const Auth: React.FC = () => {
    const { login } = useContext(AppContext);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4 py-12 font-sans">
            <div className="max-w-sm w-full bg-white dark:bg-gray-800 p-8 rounded-[2.5rem] shadow-2xl border border-white/50 dark:border-gray-700 relative overflow-hidden">
                {/* Decorative Background Blobs */}
                <div className="absolute top-0 left-0 w-40 h-40 bg-teal-500 opacity-10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
                <div className="absolute bottom-0 right-0 w-40 h-40 bg-purple-500 opacity-10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2 pointer-events-none"></div>

                <div className="text-center mb-8 relative z-10">
                    <div className="mx-auto w-24 h-24 mb-4 bg-white rounded-3xl shadow-lg flex items-center justify-center animate-bounce-in p-4">
                        <img src={APP_LOGO_URL} alt="Logo" className="w-full h-full object-contain" />
                    </div>
                    <h2 className="text-2xl font-black text-gray-800 dark:text-white tracking-tight">Smart Wellness</h2>
                    <p className="text-gray-500 dark:text-gray-400 text-xs font-medium uppercase tracking-widest mt-1">Lifestyle Medicine Innovation</p>
                </div>

                <div className="relative z-10">
                    <UserAuth onLogin={login} />
                </div>
                
                <div className="mt-8 text-center pt-6 relative z-10 border-t border-gray-100 dark:border-gray-700/50">
                    <p className="text-[10px] text-gray-400">
                        © 2024 Digital Health Satun<br/>
                        สำนักงานสาธารณสุขจังหวัดสตูล
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Auth;
