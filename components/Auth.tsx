
import React, { useState, useContext, useEffect } from 'react';
import { AppContext } from '../context/AppContext';
import { User } from '../types';
import { LineIcon } from './icons';
import { registerUser, verifyUser, socialAuth } from '../services/googleSheetService';
import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from "jwt-decode";
import liff from '@line/liff';
import { ORGANIZATIONS, TELEGRAM_BOT_USERNAME, APP_LOGO_URL } from '../constants';
import TelegramLoginButton from './TelegramLoginButton';

// LINE LIFF ID configuration
const LINE_LIFF_ID = "2008705690-V5wrjpTX"; 

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
        onLogin({
            username: `guest_${Date.now()}`,
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
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">กรอกชื่อเพื่อทดลองใช้งาน</label>
                <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="เช่น ผู้เยี่ยมชม"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg focus:ring-2 focus:ring-gray-500"
                    required
                />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button type="submit" className="w-full bg-gray-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-gray-600 transition-all">
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
    const [selectedOrg, setSelectedOrg] = useState(ORGANIZATIONS[0].id);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    
    // Initial LIFF Setup
    useEffect(() => {
        const initializeLiff = async () => {
            try {
                await liff.init({ liffId: LINE_LIFF_ID });
                if (liff.isLoggedIn()) {
                    await handleLineProfileFetch();
                }
            } catch (err) {
                console.error("LIFF Init Failed", err);
            }
        };
        initializeLiff();
    }, []);

    const handleLineProfileFetch = async () => {
        setLoading(true);
        try {
            const profile = await liff.getProfile();
            const idToken = liff.getDecodedIDToken();
            const email = idToken?.email || `${profile.userId}@line.me`;
            
            if (scriptUrl) {
                const result = await socialAuth(scriptUrl, {
                    email: email,
                    name: profile.displayName,
                    picture: profile.pictureUrl || '',
                    provider: 'line',
                    userId: profile.userId
                });
                
                if (result.success && result.user) {
                    onLogin({ ...result.user, authProvider: 'line' });
                    return; // Don't stop loading on success
                } else {
                    setError(result.message || 'Login failed');
                }
            }
        } catch (err: any) {
            console.error("Line Profile Error:", err);
            setError('ไม่สามารถดึงข้อมูล LINE ได้');
        }
        setLoading(false);
    };

    const handleLineLogin = () => {
        if (!scriptUrl) {
            setError('System Error: No Script URL');
            return;
        }
        if (!liff.isInClient() && !liff.isLoggedIn()) {
            liff.login();
        } else {
            handleLineProfileFetch();
        }
    };

    const handleGoogleSuccess = async (credentialResponse: any) => {
        if (!scriptUrl) {
            setError('System Error: No Script URL');
            return;
        }
        setLoading(true);
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
                return; // Keep loading true while app mounts
            } else {
                setError(result.message || 'Google Login Failed');
            }
        } catch (err: any) {
            console.error(err);
            setError('Google Login Error');
        }
        setLoading(false);
    };

    const handleTelegramLogin = async (user: any) => {
        if (!scriptUrl) return;
        setLoading(true);
        try {
            const result = await socialAuth(scriptUrl, {
                email: `${user.id}@telegram.bot`,
                name: user.first_name + (user.last_name ? ' ' + user.last_name : ''),
                picture: user.photo_url || '',
                provider: 'telegram',
                userId: user.id.toString()
            });

            if (result.success && result.user) {
                onLogin({ ...result.user, authProvider: 'telegram' });
                return;
            } else {
                setError(result.message || 'Telegram Login Failed');
            }
        } catch (err) {
            setError('Telegram Error');
        }
        setLoading(false);
    };

    const handleEmailSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!scriptUrl) {
            setError('System Error: No Script URL');
            return;
        }
        
        setError('');
        setLoading(true);

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
                    return;
                } else {
                    setError(result.message || 'Registration failed');
                }
            } else {
                const result = await verifyUser(scriptUrl, email, password);
                if (result.success && result.user) {
                    onLogin(result.user);
                    return;
                } else {
                    setError(result.message || 'อีเมลหรือรหัสผ่านไม่ถูกต้อง');
                }
            }
        } catch (err) {
            setError("Connection Error");
        }
        setLoading(false);
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-8 space-y-4">
                <div className="w-12 h-12 border-4 border-t-teal-500 border-gray-200 rounded-full animate-spin"></div>
                <p className="text-gray-600 dark:text-gray-300">กำลังเข้าสู่ระบบ...</p>
                {/* Fallback to cancel loading if stuck */}
                <button onClick={() => setLoading(false)} className="text-xs text-gray-400 hover:text-red-500 mt-4 underline">
                    ยกเลิก / Cancel
                </button>
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
                 <div className="w-full flex justify-center">
                    <GoogleLogin
                        onSuccess={handleGoogleSuccess}
                        onError={() => setError('Google Login Failed')}
                        theme="filled_blue"
                        shape="pill"
                        text="continue_with"
                    />
                 </div>
                 
                 <button 
                    type="button"
                    onClick={handleLineLogin}
                    className="flex items-center justify-center w-full bg-[#06C755] text-white font-bold py-2 px-4 rounded-full transition-colors gap-2 text-sm h-[40px] max-w-[240px] hover:bg-[#05b64d] shadow-md"
                >
                    <LineIcon className="w-5 h-5 fill-current text-white" />
                    <span>Log in with LINE</span>
                </button>

                <div className="w-full max-w-[240px] flex justify-center">
                    <TelegramLoginButton 
                        botName={TELEGRAM_BOT_USERNAME} 
                        onAuth={handleTelegramLogin} 
                        cornerRadius={20}
                    />
                </div>
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
    const [view, setView] = useState<'user' | 'guest'>('user');

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4 py-12 transition-colors duration-300">
            <div className="max-w-md w-full space-y-8 bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl">
                <div className="text-center">
                    <img src={APP_LOGO_URL} alt="Logo" className="mx-auto h-20 w-auto mb-4" />
                    <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white">Smart Wellness</h2>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">แพลตฟอร์มดูแลสุขภาพวิถีชีวิต</p>
                </div>

                {view === 'user' ? (
                    <>
                        <UserAuth onLogin={login} />
                        <div className="mt-4 text-center">
                            <span className="text-xs text-gray-400">หรือ </span>
                            <button onClick={() => setView('guest')} className="text-xs font-bold text-teal-600 hover:underline">ทดลองใช้งาน (Guest)</button>
                        </div>
                    </>
                ) : (
                    <>
                        <GuestLogin onLogin={login} />
                        <div className="mt-4 text-center">
                            <button onClick={() => setView('user')} className="text-xs font-bold text-teal-600 hover:underline">กลับไปหน้าเข้าสู่ระบบ</button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default Auth;
