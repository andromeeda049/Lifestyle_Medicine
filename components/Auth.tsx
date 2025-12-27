import React, { useState, useContext, useEffect } from 'react';
import { AppContext } from '../context/AppContext';
import { User } from '../types';
import { LineIcon, UserCircleIcon, UserGroupIcon } from './icons';
import { registerUser, verifyUser, socialAuth } from '../services/googleSheetService';
import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from "jwt-decode";
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
    const [mode, setMode] = useState<'login' | 'register'>('login');
    const [loading, setLoading] = useState(false);
    const [statusText, setStatusText] = useState('');
    const [error, setError] = useState('');

    // LINE State
    const [isLineReady, setIsLineReady] = useState(false);

    // Form State
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

                // If User already logged in or Redirected back
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

    // --- 2. GOOGLE LOGIN ---
    const handleGoogleSuccess = async (credentialResponse: any) => {
        if (!scriptUrl) return;
        setLoading(true);
        setStatusText('กำลังยืนยันตัวตนผ่าน Google...');
        try {
            const decoded: any = jwtDecode(credentialResponse.credential);
            const res = await socialAuth(scriptUrl, {
                email: decoded.email,
                name: decoded.name || 'Google User',
                picture: decoded.picture || '',
                provider: 'google',
                userId: decoded.sub
            });

            if (res.success && res.user) {
                onLogin({ ...res.user, authProvider: 'google' });
            } else {
                setError('Google Login Failed');
                setLoading(false);
            }
        } catch (err) {
            setError('Google Error');
            setLoading(false);
        }
    };

    // --- 3. EMAIL/PASSWORD LOGIN (ADMIN/GENERAL) ---
    const handleEmailSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!scriptUrl) return;
        setLoading(true);
        setStatusText('กำลังตรวจสอบข้อมูล...');
        setError('');

        try {
            if (mode === 'register') {
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
            setError('Connection Error');
            setLoading(false);
        }
    };

    // --- LOADING VIEW ---
    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-gray-600 dark:text-gray-300 font-medium animate-pulse">{statusText}</p>
                <button onClick={() => setLoading(false)} className="text-xs text-red-400 hover:underline mt-4">ยกเลิก</button>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Error Banner */}
            {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm text-center border border-red-200 flex items-center justify-center gap-2">
                    <span className="font-bold">!</span> {error}
                </div>
            )}

            {/* --- SOCIAL LOGIN GROUP --- */}
            <div className="space-y-4">
                {/* LINE Button */}
                <button
                    onClick={handleLineLogin}
                    disabled={!isLineReady}
                    className={`w-full py-3 rounded-xl font-bold text-white flex items-center justify-center gap-2 shadow-sm transition-transform active:scale-95 ${isLineReady ? 'bg-[#06C755] hover:bg-[#05b64d]' : 'bg-gray-300 cursor-not-allowed'}`}
                >
                    <LineIcon className="w-6 h-6 fill-current" />
                    <span className="text-sm">เข้าสู่ระบบด้วย LINE</span>
                </button>

                {/* Google Button */}
                <div className="flex justify-center w-full">
                    <GoogleLogin
                        onSuccess={handleGoogleSuccess}
                        onError={() => setError('Google Failed')}
                        theme="filled_blue"
                        shape="pill"
                        text="continue_with"
                        width="100%"
                    />
                </div>
            </div>

            <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-gray-200 dark:border-gray-700"></div>
                <span className="flex-shrink-0 mx-4 text-gray-400 text-xs bg-white dark:bg-gray-800 px-2">สำหรับเจ้าหน้าที่ / Admin</span>
                <div className="flex-grow border-t border-gray-200 dark:border-gray-700"></div>
            </div>

            {/* --- EMAIL FORM (ADMIN/GENERAL) --- */}
            <div className="bg-gray-50 dark:bg-gray-700/30 p-1 rounded-xl flex mb-4 border border-gray-200 dark:border-gray-700">
                <button
                    type="button"
                    onClick={() => { setMode('login'); setError(''); }}
                    className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${mode === 'login' ? 'bg-white dark:bg-gray-600 shadow-sm text-teal-600 dark:text-white' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'}`}
                >
                    เข้าสู่ระบบ
                </button>
                <button
                    type="button"
                    onClick={() => { setMode('register'); setError(''); }}
                    className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${mode === 'register' ? 'bg-white dark:bg-gray-600 shadow-sm text-teal-600 dark:text-white' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'}`}
                >
                    ลงทะเบียน
                </button>
            </div>

            <form onSubmit={handleEmailSubmit} className="space-y-4">
                {mode === 'register' && (
                    <div className="relative">
                        <UserCircleIcon className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="ชื่อที่แสดง (Display Name)"
                            value={displayName}
                            onChange={e => setDisplayName(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none transition-all text-sm"
                            required
                        />
                    </div>
                )}
                
                <div className="relative">
                    <span className="absolute left-3 top-3.5 text-gray-400">✉️</span>
                    <input
                        type="email"
                        placeholder="อีเมล"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none transition-all text-sm"
                        required
                    />
                </div>
                
                <div className="relative">
                    <span className="absolute left-3 top-3.5 text-gray-400">🔒</span>
                    <input
                        type="password"
                        placeholder="รหัสผ่าน"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none transition-all text-sm"
                        required
                    />
                </div>

                {mode === 'register' && (
                    <div className="relative">
                        <UserGroupIcon className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                        <select 
                            value={selectedOrg} 
                            onChange={e => setSelectedOrg(e.target.value)} 
                            className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl outline-none text-sm appearance-none"
                        >
                            {ORGANIZATIONS.map(org => <option key={org.id} value={org.id}>{org.name}</option>)}
                        </select>
                    </div>
                )}

                <button
                    type="submit"
                    className="w-full py-3 bg-gradient-to-r from-teal-500 to-teal-600 text-white font-bold rounded-xl shadow-md hover:from-teal-600 hover:to-teal-700 transition-all transform active:scale-95"
                >
                    {mode === 'login' ? 'เข้าสู่ระบบ' : 'สมัครสมาชิกใหม่'}
                </button>
            </form>
        </div>
    );
};

const Auth: React.FC = () => {
    const { login } = useContext(AppContext);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4 py-12">
            <div className="max-w-sm w-full bg-white dark:bg-gray-800 p-8 rounded-[2rem] shadow-2xl border border-white/50 dark:border-gray-700 relative overflow-hidden">
                {/* Decorative Background Blobs */}
                <div className="absolute top-0 left-0 w-32 h-32 bg-teal-500 opacity-10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
                <div className="absolute bottom-0 right-0 w-32 h-32 bg-purple-500 opacity-10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2 pointer-events-none"></div>

                <div className="text-center mb-8 relative z-10">
                    <img src={APP_LOGO_URL} alt="Logo" className="mx-auto h-20 w-auto mb-4 drop-shadow-md animate-bounce-in" />
                    <h2 className="text-2xl font-black text-gray-800 dark:text-white tracking-tight">Smart Wellness</h2>
                    <p className="text-gray-500 dark:text-gray-400 text-xs font-medium uppercase tracking-widest mt-1">Lifestyle Medicine Innovation</p>
                </div>

                <div className="relative z-10">
                    <UserAuth onLogin={login} />
                </div>
                
                <div className="mt-8 text-center pt-4 relative z-10">
                    <p className="text-[10px] text-gray-400">
                        © 2024 Digital Health Satun
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Auth;