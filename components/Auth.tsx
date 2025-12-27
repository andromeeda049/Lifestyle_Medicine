
import React, { useState, useContext, useEffect, useRef } from 'react';
import { AppContext } from '../context/AppContext';
import { User } from '../types';
import { LineIcon, SparklesIcon } from './icons';
import { registerUser, verifyUser, socialAuth } from '../services/googleSheetService';
import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from "jwt-decode";
import liff from '@line/liff';
import { ORGANIZATIONS, TELEGRAM_BOT_USERNAME, APP_LOGO_URL } from '../constants';
import TelegramLoginButton from './TelegramLoginButton';

// LINE LIFF ID
const LINE_LIFF_ID = "2008705690-V5wrjpTX"; 

const emojis = ['😊', '😎', '🎉', '🚀', '🌟', '💡', '🌱', '🍎', '💪', '🧠', '👍', '✨'];
const getRandomEmoji = () => emojis[Math.floor(Math.random() * emojis.length)];

// --- DEMO USER FOR PRESENTATION ---
const DEMO_USER: User = {
    username: 'demo_user_01',
    displayName: 'ผู้ใช้งานสาธิต (Demo)',
    profilePicture: 'https://cdn-icons-png.flaticon.com/512/4140/4140048.png',
    role: 'user', // Role user เพื่อให้ใช้ได้ทุกฟีเจอร์
    organization: 'pho_satun', // ตั้งค่าเริ่มต้นให้ดูสมจริง
    email: 'demo@smartwellness.com'
};

const UserAuth: React.FC<{ onLogin: (user: User) => void }> = ({ onLogin }) => {
    const { scriptUrl } = useContext(AppContext);
    const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
    const [showEmailForm, setShowEmailForm] = useState(false);
    
    // Form States
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [selectedOrg, setSelectedOrg] = useState(ORGANIZATIONS[0].id);
    
    // UI States
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [statusMessage, setStatusMessage] = useState(''); // แสดงสถานะให้เห็นชัดๆ
    const [lineInitialized, setLineInitialized] = useState(false);
    
    // Prevent double execution in React Strict Mode
    const initializingRef = useRef(false);

    // --- 1. ROBUST LINE LOGIN LOGIC ---
    useEffect(() => {
        if (initializingRef.current) return;
        initializingRef.current = true;

        const initLiff = async () => {
            console.log("LIFF: Starting Initialization...");
            try {
                await liff.init({ liffId: LINE_LIFF_ID });
                console.log("LIFF: Initialized");
                setLineInitialized(true);
                
                // Auto Login Check
                if (liff.isLoggedIn()) {
                    console.log("LIFF: User is logged in");
                    setLoading(true);
                    setStatusMessage('เชื่อมต่อ LINE สำเร็จ! กำลังดึงข้อมูล...');
                    
                    const profile = await liff.getProfile();
                    console.log("LIFF: Profile fetched", profile);
                    
                    const idToken = liff.getDecodedIDToken();
                    const userEmail = idToken?.email || `${profile.userId}@line.me`;

                    if (scriptUrl) {
                        setStatusMessage('กำลังเข้าสู่ระบบฐานข้อมูล...');
                        const result = await socialAuth(scriptUrl, {
                            email: userEmail,
                            name: profile.displayName,
                            picture: profile.pictureUrl || '',
                            provider: 'line',
                            userId: profile.userId
                        });

                        if (result.success && result.user) {
                            onLogin({ ...result.user, authProvider: 'line' });
                        } else {
                            setLoading(false);
                            setError(result.message || 'Login Failed at Database');
                        }
                    } else {
                        setLoading(false);
                        setError('System Error: No Script URL');
                    }
                } else {
                    console.log("LIFF: User NOT logged in");
                }
            } catch (err: any) {
                console.error("LIFF Init Error:", err);
                // ไม่แสดง Error ใหญ่โต เพื่อให้ผู้ใช้เลือกวิธีอื่นได้
                setError(`LINE Init Warning: ${err.message}`); 
                setLoading(false);
            }
        };

        initLiff();
    }, [scriptUrl, onLogin]);

    const handleLineLoginClick = () => {
        setError('');
        if (!lineInitialized) {
            setError("ระบบ LINE ยังโหลดไม่เสร็จ กรุณารอสักครู่");
            return;
        }
        if (!liff.isLoggedIn()) {
            setStatusMessage('กำลังเปลี่ยนหน้าไปที่ LINE...');
            // Redirect to LINE Login
            liff.login(); 
        }
    };

    // --- EMERGENCY DEMO LOGIN ---
    const handleDemoLogin = () => {
        setLoading(true);
        setStatusMessage('กำลังเข้าสู่โหมดนำเสนอ...');
        setTimeout(() => {
            onLogin(DEMO_USER);
        }, 1500);
    };

    const handleGoogleSuccess = async (credentialResponse: any) => {
        if (!scriptUrl) return;
        setLoading(true);
        setStatusMessage('กำลังยืนยันตัวตนผ่าน Google...');
        try {
            const decoded: any = jwtDecode(credentialResponse.credential);
            const result = await socialAuth(scriptUrl, {
                email: decoded.email,
                name: decoded.name || 'Google User',
                picture: decoded.picture || '',
                provider: 'google',
                userId: decoded.sub
            });

            if (result.success && result.user) {
                onLogin({ ...result.user, authProvider: 'google' });
            } else {
                setLoading(false);
                setError('Google Login Failed');
            }
        } catch (err) {
            setLoading(false);
            setError('Google Login Error');
        }
    };

    const handleEmailSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!scriptUrl) return;
        
        setError('');
        setLoading(true);
        setStatusMessage('กำลังตรวจสอบข้อมูล...');

        try {
            if (authMode === 'register') {
                if (password !== confirmPassword) {
                    setError('รหัสผ่านไม่ตรงกัน');
                    setLoading(false);
                    return;
                }
                const newUser: User = {
                    username: `user_${Date.now()}`,
                    displayName: displayName.trim(),
                    profilePicture: getRandomEmoji(),
                    role: 'user',
                    email: email,
                    organization: selectedOrg
                };
                const result = await registerUser(scriptUrl, newUser, password);
                if (result.success) {
                    onLogin(newUser);
                } else {
                    setLoading(false);
                    setError(result.message || 'Registration failed');
                }
            } else {
                const result = await verifyUser(scriptUrl, email, password);
                if (result.success && result.user) {
                    onLogin(result.user);
                } else {
                    setLoading(false);
                    setError(result.message || 'อีเมลหรือรหัสผ่านไม่ถูกต้อง');
                }
            }
        } catch (err) {
            setLoading(false);
            setError("Connection Error");
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-12 space-y-6 min-h-[300px]">
                <div className="relative">
                    <div className="w-16 h-16 border-4 border-t-teal-500 border-gray-200 rounded-full animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-xl">⏳</span>
                    </div>
                </div>
                <div className="text-center">
                    <p className="text-gray-800 dark:text-white font-bold text-lg">กรุณารอสักครู่</p>
                    <p className="text-gray-500 text-sm mt-1">{statusMessage}</p>
                </div>
                <button onClick={() => setLoading(false)} className="text-xs text-red-400 hover:underline mt-4">ยกเลิก (Cancel)</button>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in">
             <div className="flex border-b dark:border-gray-700 mb-4">
                <button 
                    onClick={() => { setAuthMode('login'); setError(''); setShowEmailForm(false); }} 
                    className={`flex-1 pb-2 text-sm font-semibold text-center transition-colors ${authMode === 'login' ? 'border-b-2 border-teal-500 text-teal-600' : 'text-gray-500'}`}
                >
                    เข้าสู่ระบบ
                </button>
                <button 
                    onClick={() => { setAuthMode('register'); setError(''); setShowEmailForm(true); }} 
                    className={`flex-1 pb-2 text-sm font-semibold text-center transition-colors ${authMode === 'register' ? 'border-b-2 border-teal-500 text-teal-600' : 'text-gray-500'}`}
                >
                    สมัครสมาชิก
                </button>
            </div>

            {error && (
                <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 p-3 rounded-lg text-center animate-pulse">
                    <p className="text-red-600 dark:text-red-300 text-sm font-bold">{error}</p>
                </div>
            )}

            <div className="flex flex-col gap-3 justify-center items-center">
                 {/* Google Login */}
                 <div className="w-full flex justify-center">
                    <GoogleLogin
                        onSuccess={handleGoogleSuccess}
                        onError={() => setError('Google Login Failed')}
                        theme="filled_blue"
                        shape="pill"
                        text="continue_with"
                    />
                 </div>
                 
                 {/* LINE Login Button */}
                 <button 
                    type="button"
                    onClick={handleLineLoginClick}
                    className="flex items-center justify-center w-full bg-[#06C755] text-white font-bold py-2 px-4 rounded-full transition-all gap-2 text-sm h-[40px] max-w-[240px] hover:bg-[#05b64d] shadow-md hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={!lineInitialized}
                >
                    <LineIcon className="w-5 h-5 fill-current text-white" />
                    <span>{lineInitialized ? 'Log in with LINE' : 'Loading LINE...'}</span>
                </button>

                {/* --- PRESENTATION DEMO BUTTON (THE LIFESAVER) --- */}
                <button 
                    type="button"
                    onClick={handleDemoLogin}
                    className="flex items-center justify-center w-full bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-bold py-2 px-4 rounded-full transition-all gap-2 text-sm h-[40px] max-w-[240px] shadow-lg hover:scale-105 active:scale-95 ring-2 ring-purple-300 dark:ring-purple-900"
                >
                    <SparklesIcon className="w-5 h-5 text-yellow-300" />
                    <span>เข้าสู่โหมดนำเสนอ (Demo)</span>
                </button>
                {/* ----------------------------------------------- */}

            </div>

            <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-gray-300 dark:border-gray-600"></div>
                <button onClick={() => setShowEmailForm(!showEmailForm)} className="mx-4 text-xs text-gray-400 hover:text-teal-500">
                    Or with Email {showEmailForm ? '▲' : '▼'}
                </button>
                <div className="flex-grow border-t border-gray-300 dark:border-gray-600"></div>
            </div>

            {showEmailForm && (
                <form onSubmit={handleEmailSubmit} className="space-y-4 animate-fade-in-down">
                    {authMode === 'register' && (
                        <div>
                            <label className="block text-sm text-gray-700 dark:text-gray-300">ชื่อที่แสดง</label>
                            <input type="text" value={displayName} onChange={e => setDisplayName(e.target.value)} className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700" required />
                        </div>
                    )}
                    <div>
                        <label className="block text-sm text-gray-700 dark:text-gray-300">อีเมล</label>
                        <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700" required />
                    </div>
                    <div>
                        <label className="block text-sm text-gray-700 dark:text-gray-300">รหัสผ่าน</label>
                        <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700" required />
                    </div>
                    {authMode === 'register' && (
                        <>
                            <div>
                                <label className="block text-sm text-gray-700 dark:text-gray-300">ยืนยันรหัสผ่าน</label>
                                <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700" required />
                            </div>
                            <div>
                                <label className="block text-sm text-teal-700 dark:text-teal-400">หน่วยงาน</label>
                                <select value={selectedOrg} onChange={e => setSelectedOrg(e.target.value)} className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700">
                                    {ORGANIZATIONS.map(org => <option key={org.id} value={org.id}>{org.name}</option>)}
                                </select>
                            </div>
                        </>
                    )}
                    
                    <button type="submit" className="w-full bg-teal-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-teal-600 transition-all">
                        {authMode === 'login' ? 'เข้าสู่ระบบ' : 'สมัครสมาชิก'}
                    </button>
                </form>
            )}
        </div>
    );
};

const Auth: React.FC = () => {
    const { login } = useContext(AppContext);
    
    // Default view
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4 py-12 transition-colors duration-300">
            <div className="max-w-md w-full space-y-8 bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl border-t-8 border-teal-500">
                <div className="text-center">
                    <img src={APP_LOGO_URL} alt="Logo" className="mx-auto h-20 w-auto mb-4" />
                    <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white">Smart Wellness</h2>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">แพลตฟอร์มดูแลสุขภาพวิถีชีวิต</p>
                </div>

                <UserAuth onLogin={login} />
                
                <div className="mt-4 text-center">
                    <p className="text-xs text-gray-400">
                        พัฒนาโดย กลุ่มงานสุขภาพดิจิทัล สำนักงานสาธารณสุขจังหวัดสตูล
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Auth;
