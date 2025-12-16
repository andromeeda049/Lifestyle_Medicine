
import React, { useState, useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { User } from '../types';
import { LineIcon } from './icons';
import { registerUser, verifyUser, socialAuth } from '../services/googleSheetService';
import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from "jwt-decode";

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
    const [showEmailForm, setShowEmailForm] = useState(false); // State to toggle email form
    
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Google Login Logic (OIDC Flow)
    const handleGoogleSuccess = async (credentialResponse: any) => {
        if (!scriptUrl) {
            setError('ไม่พบ URL การเชื่อมต่อ Google Sheets กรุณาตั้งค่าในโหมด Admin ก่อน');
            return;
        }
        
        setLoading(true);
        try {
            // Decode JWT ID Token
            const decoded: any = jwtDecode(credentialResponse.credential);
            
            // Send to backend
            const result = await socialAuth(scriptUrl, {
                email: decoded.email,
                name: decoded.name,
                picture: decoded.picture
            });

            if (result.success && result.user) {
                onLogin(result.user);
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
        setError('การเข้าสู่ระบบด้วย Google ล้มเหลว (อาจเกิดจาก Domain ไม่ได้รับอนุญาต)');
    };

    const handleLineLogin = () => {
        alert(`Line Login ต้องใช้ LIFF SDK หรือ Backend Redirect\nยังไม่สามารถใช้งานได้ในเวอร์ชัน Demo นี้`);
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
                authProvider: 'email'
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
                        locale="th"
                    />
                 </div>
                 <button 
                    type="button"
                    onClick={handleLineLogin}
                    className="flex items-center justify-center w-full bg-[#06C755] text-white font-bold py-2 px-4 rounded-full hover:bg-[#05b64d] transition-colors gap-2 text-sm h-[40px] max-w-[240px]"
                >
                    <LineIcon className="w-5 h-5 fill-current text-white" />
                    <span>Log in with LINE</span>
                </button>
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
                    )}

                    {error && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg animate-fade-in">
                            <p className="text-red-500 text-sm text-center">{error}</p>
                            {error.includes('Google') && (
                                <p className="text-xs text-red-400 text-center mt-1">
                                    *หากทดสอบใน AI Studio ให้ใช้ <b>Guest Mode</b> แทน
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

const AdminLogin: React.FC<{ onLogin: (user: User) => void }> = ({ onLogin }) => {
    const [adminKey, setAdminKey] = useState('');
    const [error, setError] = useState('');
    // NOTE: This should match the key in Code.gs
    const SUPER_ADMIN_KEY = "ADMIN1234!";

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (adminKey === SUPER_ADMIN_KEY) {
            setError('');
            onLogin({
                username: `admin_${Date.now()}`,
                displayName: 'ผู้ดูแลระบบ',
                profilePicture: '👑',
                role: 'admin',
            });
        } else {
            setError('Admin Key ไม่ถูกต้อง');
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6 animate-fade-in">
            <div className="w-28 h-28 mx-auto rounded-full flex items-center justify-center bg-red-100 dark:bg-red-900/50 border-4 border-red-200 dark:border-red-800 shadow-md">
                <span className="text-6xl">🔑</span>
            </div>
            <div>
                <label htmlFor="adminKey" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 text-left">
                   Admin Key
                </label>
                <input
                    type="password"
                    id="adminKey"
                    value={adminKey}
                    onChange={(e) => setAdminKey(e.target.value)}
                    placeholder="กรอกรหัสสำหรับผู้ดูแลระบบ"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
                    required
                />
            </div>

            {error && <p className="text-red-500 text-sm">{error}</p>}

            <button
                type="submit"
                className="w-full bg-red-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-red-600 focus:outline-none focus:ring-4 focus:ring-red-300 dark:focus:ring-red-800 transition-all duration-300 transform hover:scale-105"
            >
                เข้าสู่ระบบในฐานะ Admin
            </button>
        </form>
    );
};


const Auth: React.FC = () => {
    const { login } = useContext(AppContext);
    const [mode, setMode] = useState<'guest' | 'user' | 'admin'>('user');
    
    const getWelcomeMessage = () => {
        switch(mode) {
            case 'guest': return 'เข้าสู่ระบบเพื่อทดลองใช้งาน';
            case 'user': return 'ยินดีต้อนรับกลับสู่สุขภาพที่ดี';
            case 'admin': return 'ลงชื่อเข้าใช้สำหรับผู้ดูแลระบบ';
            default: return '';
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 via-sky-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-slate-900 p-4">
            <div className="w-full max-w-md mx-auto bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-2xl animate-fade-in-down">
                <div className="text-center mb-6">
                    {/* Logo or Icon could go here */}
                    <div className="w-20 h-20 mx-auto bg-gradient-to-tr from-teal-400 to-blue-500 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
                        <span className="text-4xl">🥗</span>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Smart Lifestyle Wellness นวัตกรรมสุขภาพวิถีชีวิต</h1>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{getWelcomeMessage()}</p>
                </div>
                
                {mode === 'guest' && <GuestLogin onLogin={login} />}
                {mode === 'user' && <UserAuth onLogin={login} />}
                {mode === 'admin' && <AdminLogin onLogin={login} />}

                {/* Footer Links for switching modes */}
                <div className="mt-8 text-center space-y-2 border-t dark:border-gray-700 pt-4">
                    {mode === 'user' ? (
                        <div className="flex flex-col gap-2">
                            <button 
                                onClick={() => setMode('guest')} 
                                className="text-xs text-gray-500 hover:text-teal-600 dark:text-gray-400 dark:hover:text-teal-400 underline transition-colors"
                            >
                                ทดลองใช้งาน (Guest Mode)
                            </button>
                            <button 
                                onClick={() => setMode('admin')} 
                                className="text-xs text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
                            >
                                สำหรับผู้ดูแลระบบ
                            </button>
                        </div>
                    ) : (
                        <button 
                            onClick={() => setMode('user')} 
                            className="text-sm text-teal-600 hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-300 font-medium"
                        >
                            ← กลับไปหน้าเข้าสู่ระบบหลัก
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Auth;
