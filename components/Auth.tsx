import React, { useState, useContext, useEffect } from 'react';
import { AppContext } from '../context/AppContext';
import { User } from '../types';
import { LineIcon, UserCircleIcon, UserGroupIcon, EnvelopeIcon, LockIcon, ArrowLeftIcon } from './icons';
import { registerUser, verifyUser, socialAuth } from '../services/googleSheetService';
import liff from '@line/liff';
import { ORGANIZATIONS, APP_LOGO_URL } from '../constants';

// Configuration
const LINE_LIFF_ID = "2008705690-V5wrjpTX";

const getRandomEmoji = () => {
    const emojis = ['😊', '😎', '🎉', '🚀', '🌟', '💡', '🌱', '🍎', '💪'];
    return emojis[Math.floor(Math.random() * emojis.length)];
};

const UserAuth: React.FC<{ onLogin: (user: User) => void }> = ({ onLogin }) => {
    const { scriptUrl } = useContext(AppContext);

    // UI State
    const [view, setView] = useState<'main' | 'admin'>('main');
    const [adminMode, setAdminMode] = useState<'login' | 'register'>('login');
    const [loading, setLoading] = useState(false);
    const [statusText, setStatusText] = useState('');
    const [error, setError] = useState('');

    // LINE State
    const [isLineReady, setIsLineReady] = useState(false);

    // Admin Form State
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [selectedOrg, setSelectedOrg] = useState(ORGANIZATIONS[0].id);

    // --- 1. CLEAN LINE INITIALIZATION ---
    useEffect(() => {
        const initLine = async () => {
            try {
                await liff.init({ liffId: LINE_LIFF_ID });
                setIsLineReady(true);

                if (liff.isLoggedIn()) {
                    setLoading(true);
                    setStatusText('กำลังยืนยันตัวตนผ่าน LINE...');
                    
                    const profile = await liff.getProfile();
                    const userEmail = liff.getDecodedIDToken()?.email || `${profile.userId}@line.me`;

                    if (scriptUrl) {
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
                            setError(res.message || 'เชื่อมต่อฐานข้อมูลไม่สำเร็จ');
                            setLoading(false);
                        }
                    }
                }
            } catch (err) {
                console.error("LINE Init Error:", err);
            }
        };
        initLine();
    }, [scriptUrl, onLogin]);

    const handleLineLogin = () => {
        if (!isLineReady) return;
        if (!liff.isLoggedIn()) {
            liff.login();
        }
    };

    // --- 2. ADMIN/EMAIL LOGIN ---
    const handleAdminSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!scriptUrl) return;
        setLoading(true);
        setStatusText('กำลังตรวจสอบข้อมูล...');
        setError('');

        try {
            if (adminMode === 'register') {
                const newUser: User = {
                    username: `user_${Date.now()}`,
                    displayName: displayName,
                    profilePicture: getRandomEmoji(),
                    role: 'user',
                    email: email,
                    organization: selectedOrg
                };
                const res = await registerUser(scriptUrl, newUser, password);
                if (res.success) {
                    onLogin(newUser);
                } else {
                    setError(res.message || 'สมัครสมาชิกไม่สำเร็จ');
                    setLoading(false);
                }
            } else {
                const res = await verifyUser(scriptUrl, email, password);
                if (res.success && res.user) {
                    onLogin(res.user);
                } else {
                    setError('อีเมลหรือรหัสผ่านไม่ถูกต้อง');
                    setLoading(false);
                }
            }
        } catch (err) {
            setError('เกิดข้อผิดพลาดในการเชื่อมต่อ');
            setLoading(false);
        }
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
            {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm text-center border border-red-200 flex items-center justify-center gap-2 mb-4 animate-bounce-in">
                    <span className="font-bold">!</span> {error}
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

            {/* --- ADMIN VIEW: Email/Password --- */}
            {view === 'admin' && (
                <div className="animate-slide-up">
                    <button 
                        onClick={() => { setView('main'); setError(''); }}
                        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 mb-4 transition-colors"
                    >
                        <ArrowLeftIcon className="w-4 h-4" /> กลับหน้าหลัก
                    </button>

                    <div className="bg-gray-50 dark:bg-gray-700/50 p-1.5 rounded-xl flex mb-6">
                        <button
                            type="button"
                            onClick={() => { setAdminMode('login'); setError(''); }}
                            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${adminMode === 'login' ? 'bg-white dark:bg-gray-600 shadow-sm text-teal-600 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}
                        >
                            เข้าสู่ระบบ
                        </button>
                        <button
                            type="button"
                            onClick={() => { setAdminMode('register'); setError(''); }}
                            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${adminMode === 'register' ? 'bg-white dark:bg-gray-600 shadow-sm text-teal-600 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}
                        >
                            ลงทะเบียน
                        </button>
                    </div>

                    <form onSubmit={handleAdminSubmit} className="space-y-4">
                        {adminMode === 'register' && (
                            <div className="relative group">
                                <UserCircleIcon className="absolute left-3 top-3.5 w-5 h-5 text-gray-400 group-focus-within:text-teal-500 transition-colors" />
                                <input
                                    type="text"
                                    placeholder="ชื่อที่แสดง (Display Name)"
                                    value={displayName}
                                    onChange={e => setDisplayName(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none transition-all text-sm"
                                    required
                                />
                            </div>
                        )}
                        
                        <div className="relative group">
                            <EnvelopeIcon className="absolute left-3 top-3.5 w-5 h-5 text-gray-400 group-focus-within:text-teal-500 transition-colors" />
                            <input
                                type="email"
                                placeholder="อีเมล (Email)"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none transition-all text-sm"
                                required
                            />
                        </div>
                        
                        <div className="relative group">
                            <LockIcon className="absolute left-3 top-3.5 w-5 h-5 text-gray-400 group-focus-within:text-teal-500 transition-colors" />
                            <input
                                type="password"
                                placeholder="รหัสผ่าน (Password)"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none transition-all text-sm"
                                required
                            />
                        </div>

                        {adminMode === 'register' && (
                            <div className="relative group">
                                <UserGroupIcon className="absolute left-3 top-3.5 w-5 h-5 text-gray-400 group-focus-within:text-teal-500 transition-colors" />
                                <select 
                                    value={selectedOrg} 
                                    onChange={e => setSelectedOrg(e.target.value)} 
                                    className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none text-sm appearance-none focus:ring-2 focus:ring-teal-500"
                                >
                                    {ORGANIZATIONS.map(org => <option key={org.id} value={org.id}>{org.name}</option>)}
                                </select>
                            </div>
                        )}

                        <button
                            type="submit"
                            className="w-full py-3 bg-gradient-to-r from-teal-600 to-emerald-600 text-white font-bold rounded-xl shadow-md hover:from-teal-700 hover:to-emerald-700 transition-all transform active:scale-95 mt-4"
                        >
                            {adminMode === 'login' ? 'เข้าสู่ระบบ' : 'ยืนยันการลงทะเบียน'}
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