
import React, { useState, useContext, useEffect, useRef } from 'react';
import { AppContext } from '../context/AppContext';
import { User } from '../types';
import { LineIcon } from './icons';
import { registerUser, verifyUser, socialAuth } from '../services/googleSheetService';
import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from "jwt-decode";
import liff from '@line/liff';
import { ORGANIZATIONS, ADMIN_CREDENTIALS, TELEGRAM_BOT_USERNAME } from '../constants';
import TelegramLoginButton from './TelegramLoginButton';

// !!! สำคัญ: แทนที่ด้วย LIFF ID ของคุณที่ได้จาก LINE Developers Console !!!
const LINE_LIFF_ID = "2008705690-V5wrjpTX"; 

// !!! ใส่ URL ของ Logo ที่นี่ !!!
const APP_LOGO_URL = "https://img2.pic.in.th/pic/lifestyle-medicine-logo.png"; // Placeholder Icon

const emojis = ['😊', '😎', '🎉', '🚀', '🌟', '💡', '🌱', '🍎', '💪', '🧠', '👍', '✨'];
const getRandomEmoji = () => emojis[Math.floor(Math.random() * emojis.length)];

const GuestLogin: React.FC<{ onLogin: (user: User) => void }> = ({ onLogin }) => {
    const [displayName, setDisplayName] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (displayName.trim().length < 2) {
            setError('ชื่อต้องมีความยาวอย่างน้อย 2 ตัวอักษร');
            return;
        }
        setError('');
        onLogin({
            username: `guest_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            displayName: displayName.trim(),
            profilePicture: '👤',
            role: 'guest',
            organization: 'general'
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6 animate-fade-in">
             <div className="w-28 h-28 mx-auto rounded-full flex items-center justify-center bg-gray-100 dark:bg-gray-700 border-4 border-gray-200 dark:border-gray-700 shadow-md">
                <span className="text-6xl">👤</span>
            </div>
            <div>
                <label htmlFor="guestName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 text-left">
                   กรอกชื่อเพื่อทดลองใช้งาน
                </label>
                <input
                    type="text"
                    id="guestName"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="เช่น ผู้เยี่ยมชม"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-colors"
                    required
                />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button
                type="submit"
                className="w-full bg-gray-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-gray-600 focus:outline-none focus:ring-4 focus:ring-gray-300 dark:focus:ring-gray-800 transition-all duration-300 transform hover:scale-105"
            >
                เข้าสู่ระบบในฐานะ Guest
            </button>
        </form>
    );
};


const UserAuth: React.FC<{ onLogin: (user: User) => void }> = ({ onLogin }) => {
    const { scriptUrl } = useContext(AppContext);
    const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
    const [showEmailForm, setShowEmailForm] = useState(false);
    
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [selectedOrg, setSelectedOrg] = useState(ORGANIZATIONS[0].id); // New state for organization
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [isLiffReady, setIsLiffReady] = useState(false);
    
    // Use ref to prevent double initialization in React Strict Mode
    const liffInitialized = useRef(false);

    // Initialize LIFF
    useEffect(() => {
        if (liffInitialized.current) return;
        liffInitialized.current = true;

        const initLiff = async () => {
            try {
                await liff.init({ 
                    liffId: LINE_LIFF_ID,
                    withLoginOnExternalBrowser: false 
                });
                
                setIsLiffReady(true);
                
                // Check if user is logged in
                if (liff.isLoggedIn()) {
                    setLoading(true);
                    try {
                        const profile = await liff.getProfile();
                        const idToken = liff.getDecodedIDToken();
                        const userEmail = idToken?.email || `${profile.userId}@line.me`;

                        if (!scriptUrl) {
                            throw new Error('ไม่พบ URL เชื่อมต่อ Google Sheets');
                        }

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
                            // If backend auth fails, force logout so user can retry manually
                            liff.logout();
                            handleAuthError(result.message);
                        }
                    } catch (err: any) {
                        console.error("Auto-login error:", err);
                        // Force logout if profile fetch or other steps fail (e.g. invalid token)
                        liff.logout();
                        setError("การเข้าสู่ระบบอัตโนมัติขัดข้อง กรุณากดปุ่ม Login อีกครั้ง");
                    } finally {
                        setLoading(false);
                    }
                }
            } catch (err: any) {
                console.error("LIFF Init Error:", err);
                setError(`LINE Login Error: ${err.message || 'Incorrect LIFF ID'}`);
                setLoading(false);
            }
        };

        initLiff();
    }, [scriptUrl, onLogin]);

    // Google Login Logic (OIDC Flow)
    const handleGoogleSuccess = async (credentialResponse: any) => {
        if (!scriptUrl) {
            setError('ไม่พบ URL การเชื่อมต่อ Google Sheets กรุณาตั้งค่าในโหมด Admin ก่อน');
            return;
        }
        
        setLoading(true);
        try {
            const decoded: any = jwtDecode(credentialResponse.credential);
            const result = await socialAuth(scriptUrl, {
                email: decoded.email,
                name: decoded.name,
                picture: decoded.picture,
                provider: 'google'
            });

            if (result.success && result.user) {
                onLogin({ ...result.user, authProvider: 'google' });
            } else {
                handleAuthError(result.message);
            }
        } catch (err) {
            console.error("Google Login Process Error:", err);
            setError('ไม่สามารถประมวลผลข้อมูลการล็อกอินได้');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleError = () => {
        setError('การเข้าสู่ระบบด้วย Google ล้มเหลว');
    };

    // Telegram Login Logic
    const handleTelegramLogin = async (user: any) => {
        if (!scriptUrl) {
            setError('ไม่พบ URL การเชื่อมต่อ Google Sheets');
            return;
        }
        setLoading(true);
        try {
            // Construct a dummy email for Telegram users since email is not provided
            // Use telegram_id as unique identifier
            const dummyEmail = `${user.id}@telegram.bot`;
            const fullName = user.first_name + (user.last_name ? ' ' + user.last_name : '');

            const result = await socialAuth(scriptUrl, {
                email: dummyEmail,
                name: fullName,
                picture: user.photo_url || '',
                provider: 'telegram',
                userId: user.id.toString()
            });

            if (result.success && result.user) {
                onLogin({ ...result.user, authProvider: 'telegram' });
            } else {
                handleAuthError(result.message);
            }
        } catch (err: any) {
            console.error("Telegram Login Error:", err);
            setError('เกิดข้อผิดพลาดในการล็อกอินผ่าน Telegram');
        } finally {
            setLoading(false);
        }
    };

    const handleLineLogin = async () => {
        if (!scriptUrl) {
            setError('ไม่พบ URL การเชื่อมต่อ Google Sheets');
            return;
        }

        try {
            if (!isLiffReady) {
                 await liff.init({ liffId: LINE_LIFF_ID });
                 setIsLiffReady(true);
            }

            if (!liff.isLoggedIn()) {
                liff.login(); // Redirects to LINE
            } else {
                setLoading(true);
                try {
                    const profile = await liff.getProfile();
                    const idToken = liff.getDecodedIDToken();
                    const userEmail = idToken?.email || `${profile.userId}@line.me`;
                    
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
                        liff.logout(); // Ensure clean state on logic failure
                        handleAuthError(result.message);
                    }
                } catch (err: any) {
                    console.error("Manual login profile fetch error:", err);
                    liff.logout(); // Ensure clean state on API failure
                    throw err;
                } finally {
                    setLoading(false);
                }
            }
        } catch (err: any) {
            console.error("LINE Login Error:", err);
            setError(`Login Failed: ${err.message}. ตรวจสอบ LIFF ID ในโค้ด`);
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!scriptUrl) {
            setError('ไม่พบ URL การเชื่อมต่อ Google Sheets กรุณาตั้งค่าในโหมด Admin ก่อน หรือใช้โหมด Guest');
            return;
        }

        setLoading(true);

        if (authMode === 'register') {
            // REGISTER LOGIC
            if (password !== confirmPassword) {
                setError('รหัสผ่านไม่ตรงกัน');
                setLoading(false);
                return;
            }
            if (displayName.trim().length < 2) {
                setError('ชื่อต้องมีความยาวอย่างน้อย 2 ตัวอักษร');
                setLoading(false);
                return;
            }

            const newUser: User = {
                username: `user_${Date.now()}`,
                displayName: displayName.trim(),
                profilePicture: getRandomEmoji(),
                role: 'user',
                email: email,
                authProvider: 'email',
                organization: selectedOrg // Add selected org
            };

            const result = await registerUser(scriptUrl, newUser, password);
            
            if (result.success) {
                onLogin(newUser);
            } else {
                handleAuthError(result.message);
            }

        } else {
            // LOGIN LOGIC
            const result = await verifyUser(scriptUrl, email, password);
            
            if (result.success && result.user) {
                onLogin(result.user);
            } else {
                handleAuthError(result.message);
            }
        }
        setLoading(false);
    };

    const handleAuthError = (msg?: string) => {
        if (msg && msg.includes("Invalid action")) {
            setError("Google Apps Script ของคุณเป็นเวอร์ชันเก่า ไม่รองรับการเข้าสู่ระบบ กรุณาอัปเดต Code.gs ใน Apps Script Editor และ Deploy ใหม่");
        } else {
            setError(msg || 'อีเมลหรือรหัสผ่านไม่ถูกต้อง');
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-8 space-y-4 animate-fade-in">
                <div className="w-12 h-12 border-4 border-t-teal-500 border-gray-200 rounded-full animate-spin"></div>
                <p className="text-gray-600 dark:text-gray-300">กำลังเข้าสู่ระบบ...</p>
                <button onClick={() => { liff.logout(); setLoading(false); }} className="text-xs text-red-500 underline">ยกเลิกและ Logout</button>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in">
             <div className="flex border-b dark:border-gray-700 mb-4">
                <button 
                    onClick={() => { setAuthMode('login'); setError(''); setShowEmailForm(false); }} 
                    className={`flex-1 pb-2 text-sm font-semibold text-center transition-colors ${authMode === 'login' ? 'border-b-2 border-teal-500 text-teal-600 dark:text-teal-400' : 'text-gray-500 dark:text-gray-400'}`}
                >
                    เข้าสู่ระบบ
                </button>
                <button 
                    onClick={() => { setAuthMode('register'); setError(''); setShowEmailForm(true); }} 
                    className={`flex-1 pb-2 text-sm font-semibold text-center transition-colors ${authMode === 'register' ? 'border-b-2 border-teal-500 text-teal-600 dark:text-teal-400' : 'text-gray-500 dark:text-gray-400'}`}
                >
                    สมัครสมาชิก
                </button>
            </div>

            <div className="flex flex-col gap-3 justify-center items-center">
                 <div className="w-full flex justify-center">
                    <GoogleLogin
                        onSuccess={handleGoogleSuccess}
                        onError={handleGoogleError}
                        theme="filled_blue"
                        shape="pill"
                        text="continue_with"
                    />
                 </div>
                 <button 
                    type="button"
                    onClick={handleLineLogin}
                    className={`flex items-center justify-center w-full bg-[#06C755] text-white font-bold py-2 px-4 rounded-full transition-colors gap-2 text-sm h-[40px] max-w-[240px] hover:bg-[#05b64d] shadow-md`}
                >
                    {isLiffReady ? (
                        <>
                            <LineIcon className="w-5 h-5 fill-current text-white" />
                            <span>Log in with LINE</span>
                        </>
                    ) : (
                        <div className="flex items-center gap-2">
                             <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                             <span>กำลังโหลด LINE...</span>
                        </div>
                    )}
                </button>

                {/* Telegram Login Button */}
                <div className="w-full max-w-[240px] flex justify-center">
                    <TelegramLoginButton 
                        botName={TELEGRAM_BOT_USERNAME} 
                        onAuth={handleTelegramLogin} 
                        cornerRadius={20}
                    />
                </div>
            </div>

            {/* Divider with Toggle Button */}
            <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-gray-300 dark:border-gray-600"></div>
                <button 
                    type="button"
                    onClick={() => setShowEmailForm(!showEmailForm)}
                    className="flex-shrink-0 mx-4 text-gray-400 text-xs hover:text-teal-600 dark:hover:text-teal-400 transition-colors cursor-pointer focus:outline-none flex items-center gap-1 group"
                >
                    Or with Email 
                    <span className={`transform transition-transform duration-200 text-[10px] ${showEmailForm ? 'rotate-180' : ''}`}>▼</span>
                </button>
                <div className="flex-grow border-t border-gray-300 dark:border-gray-600"></div>
            </div>

            {/* Collapsible Email Form */}
            {showEmailForm && (
                <form onSubmit={handleSubmit} className="space-y-4 animate-fade-in-down origin-top">
                    {authMode === 'register' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">ชื่อที่แสดง (Display Name)</label>
                            <input
                                type="text"
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg focus:ring-2 focus:ring-teal-500"
                                placeholder="ชื่อของคุณ"
                                required={authMode === 'register'}
                            />
                        </div>
                    )}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">อีเมล</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg focus:ring-2 focus:ring-teal-500"
                            placeholder="name@example.com"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">รหัสผ่าน</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg focus:ring-2 focus:ring-teal-500"
                            placeholder="********"
                            required
                        />
                    </div>
                    {authMode === 'register' && (
                        <>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">ยืนยันรหัสผ่าน</label>
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg focus:ring-2 focus:ring-teal-500"
                                    placeholder="********"
                                    required={authMode === 'register'}
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-teal-700 dark:text-teal-400 mb-1">สังกัด/หน่วยงาน (Organization)</label>
                                <select 
                                    value={selectedOrg}
                                    onChange={(e) => setSelectedOrg(e.target.value)}
                                    className="w-full px-4 py-2 border border-teal-300 dark:border-teal-700 bg-teal-50 dark:bg-teal-900/20 rounded-lg focus:ring-2 focus:ring-teal-500 text-gray-800 dark:text-gray-200"
                                >
                                    {ORGANIZATIONS.map(org => (
                                        <option key={org.id} value={org.id}>{org.name}</option>
                                    ))}
                                </select>
                                <p className="text-xs text-gray-500 mt-1">*เลือกหน่วยงานเพื่อให้ข้อมูลสุขภาพของคุณถูกรวบรวมได้ถูกต้อง</p>
                            </div>
                        </>
                    )}

                    {error && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg animate-fade-in">
                            <p className="text-red-500 text-sm text-center">{error}</p>
                            {error.includes('Google') && (
                                <p className="text-xs text-red-400 text-center mt-1">
                                    *หากทดสอบใน AI Studio ให้ใช้ <b>Guest Mode</b> แทน
                                </p>
                            )}
                            {error.includes('LIFF ID') && (
                                <p className="text-xs text-red-400 text-center mt-1">
                                    *ดูวิธีตั้งค่า LIFF ID ในคู่มือ (README)
                                </p>
                            )}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-teal-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-teal-600 focus:outline-none focus:ring-4 focus:ring-teal-300 dark:focus:ring-teal-800 transition-all duration-300 transform hover:scale-105 disabled:bg-gray-400 disabled:cursor-not-allowed disabled:transform-none"
                    >
                        {loading ? 'กำลังดำเนินการ...' : (authMode === 'login' ? 'เข้าสู่ระบบ' : 'สมัครสมาชิก')}
                    </button>
                </form>
            )}
        </div>
    );
};

const Auth: React.FC = () => {
    const { login } = useContext(AppContext);
    const [view, setView] = useState<'main' | 'guest'>('main');

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-teal-500 to-blue-600 dark:from-gray-900 dark:to-gray-800">
            <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-2xl w-full max-w-md text-center animate-scale-in">
                <div className="mb-6">
                    <img 
                        src={APP_LOGO_URL} 
                        alt="Logo" 
                        className="w-24 h-24 mx-auto rounded-2xl shadow-lg mb-4 object-cover"
                        onError={(e) => {
                            e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%2314b8a6'%3E%3Cpath d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z'/%3E%3C/svg%3E";
                        }} 
                    />
                    <h1 className="text-3xl font-black text-gray-800 dark:text-white mb-1">Smart Lifestyle</h1>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">Health Innovation for Everyone</p>
                </div>

                {view === 'guest' ? (
                    <>
                        <GuestLogin onLogin={login} />
                        <button 
                            onClick={() => setView('main')}
                            className="mt-6 text-sm text-gray-500 underline hover:text-teal-600 dark:hover:text-teal-400"
                        >
                            กลับไปหน้าเข้าสู่ระบบ
                        </button>
                    </>
                ) : (
                    <>
                        <UserAuth onLogin={login} />
                        <div className="mt-8 pt-4 border-t border-gray-100 dark:border-gray-700">
                            <button 
                                onClick={() => setView('guest')}
                                className="text-xs font-bold text-gray-400 hover:text-teal-600 dark:hover:text-teal-400 transition-colors uppercase tracking-widest"
                            >
                                ทดลองใช้งาน (Guest Mode)
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default Auth;
