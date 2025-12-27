
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
    
    // LIFF State
    const [isLiffReady, setIsLiffReady] = useState(false);
    const [isLiffInitializing, setIsLiffInitializing] = useState(true);
    
    // Use ref to prevent double initialization in React Strict Mode
    const liffInitialized = useRef(false);

    // Initialize LIFF
    useEffect(() => {
        if (liffInitialized.current) return;
        liffInitialized.current = true;

        const initLiff = async () => {
            try {
                // Race condition to prevent infinite loading if LIFF hangs
                const initPromise = liff.init({ 
                    liffId: LINE_LIFF_ID,
                    withLoginOnExternalBrowser: false 
                });
                
                const timeoutPromise = new Promise((_, reject) => 
                    setTimeout(() => reject(new Error("LIFF Init Timeout")), 5000)
                );

                await Promise.race([initPromise, timeoutPromise]);
                
                setIsLiffReady(true);
                
                // Check if user is logged in (Auto Login)
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
                        liff.logout();
                        // Don't set global error here to avoid scaring user, just let them click login again
                    } finally {
                        setLoading(false);
                    }
                }
            } catch (err: any) {
                console.error("LIFF Init Error:", err);
                // Just log, don't break UI. Button will handle retry.
            } finally {
                setIsLiffInitializing(false); // Stop loading spinner
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
        setError('');
        try {
            const decoded: any = jwtDecode(credentialResponse.credential);
            
            // Log payload for debugging (optional)
            // console.log("Google Payload:", decoded);

            // Use 'sub' as userId for Google accounts to ensure unique identification
            const result = await socialAuth(scriptUrl, {
                email: decoded.email,
                name: decoded.name || 'Google User',
                picture: decoded.picture || '',
                provider: 'google',
                userId: decoded.sub // Important for new user registration
            });

            if (result.success && result.user) {
                onLogin({ ...result.user, authProvider: 'google' });
            } else {
                console.error("Google Auth Backend Fail:", result.message);
                handleAuthError(result.message);
            }
        } catch (err: any) {
            console.error("Google Login Process Error:", err);
            setError(`การเข้าสู่ระบบด้วย Google ล้มเหลว: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleError = () => {
        setError('การเชื่อมต่อกับ Google ล้มเหลว กรุณาลองใหม่อีกครั้ง');
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
            // Attempt Init if not ready
            if (!isLiffReady) {
                 setIsLiffInitializing(true);
                 await liff.init({ 
                     liffId: LINE_LIFF_ID,
                     withLoginOnExternalBrowser: false 
                 });
                 setIsLiffReady(true);
                 setIsLiffInitializing(false);
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
                    setError("ไม่สามารถดึงข้อมูล LINE Profile ได้ กรุณาลองใหม่");
                } finally {
                    setLoading(false);
                }
            }
        } catch (err: any) {
            console.error("LINE Login Error:", err);
            setIsLiffInitializing(false);
            setError(`Login Failed: ${err.message}. ตรวจสอบการเชื่อมต่ออินเทอร์เน็ต`);
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
            setError(msg || 'ระบบขัดข้อง หรือข้อมูลไม่ถูกต้อง กรุณาลองใหม่');
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-8 space-y-4 animate-fade-in">
                <div className="w-12 h-12 border-4 border-t-teal-500 border-gray-200 rounded-full animate-spin"></div>
                <p className="text-gray-600 dark:text-gray-300">กำลังเข้าสู่ระบบ...</p>
                <button onClick={() => { try { liff.logout(); } catch(e){} setLoading(false); }} className="text-xs text-red-500 underline">ยกเลิกและ Logout</button>
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
                        useOneTap={false}
                    />
                 </div>
                 <button 
                    type="button"
                    onClick={handleLineLogin}
                    className={`flex items-center justify-center w-full bg-[#06C755] text-white font-bold py-2 px-4 rounded-full transition-colors gap-2 text-sm h-[40px] max-w-[240px] hover:bg-[#05b64d] shadow-md ${isLiffInitializing ? 'opacity-80 cursor-wait' : ''}`}
                    disabled={isLiffInitializing}
                >
                    {isLiffInitializing ? (
                        <div className="flex items-center gap-2">
                             <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                             <span>กำลังโหลด LINE...</span>
                        </div>
                    ) : (
                        <>
                            <LineIcon className="w-5 h-5 fill-current text-white" />
                            <span>Log in with LINE</span>
                        </>
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
        <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50 dark:bg-gray-900 transition-colors">
            <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-3xl shadow-xl overflow-hidden">
                {/* Header / Logo Area */}
                <div className="bg-gradient-to-r from-teal-500 to-emerald-500 p-8 text-center text-white relative">
                    <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-inner">
                        <span className="text-4xl font-bold">🌿</span>
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight">Smart Lifestyle</h1>
                    <p className="text-teal-100 text-sm mt-1">Wellness & NCDs Prevention</p>
                </div>

                <div className="p-8">
                    {view === 'main' ? (
                        <>
                            <UserAuth onLogin={login} />
                            <div className="mt-6 text-center">
                                <p className="text-xs text-gray-400">หรือ</p>
                                <button 
                                    onClick={() => setView('guest')}
                                    className="mt-2 text-sm text-gray-500 hover:text-teal-600 dark:text-gray-400 dark:hover:text-teal-400 font-semibold transition-colors"
                                >
                                    เข้าใช้งานแบบไม่ลงทะเบียน (Guest)
                                </button>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="mb-4">
                                <button 
                                    onClick={() => setView('main')}
                                    className="text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 flex items-center gap-1"
                                >
                                    ← ย้อนกลับ
                                </button>
                            </div>
                            <GuestLogin onLogin={login} />
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Auth;
