import React, { useState, useContext, useEffect, useRef } from 'react';
import { AppContext } from '../context/AppContext';
import { PLANNER_ACTIVITY_LEVELS, HEALTH_CONDITIONS } from '../constants';
import { UserProfile as UserProfileType } from '../types';

const emojis = ['😊', '😎', '🎉', '🚀', '🌟', '💡', '🌱', '🍎', '💪', '🧠', '👍', '✨'];
const getRandomEmoji = () => emojis[Math.floor(Math.random() * emojis.length)];

const UserProfile: React.FC = () => {
    const { userProfile, setUserProfile, currentUser } = useContext(AppContext);
    
    const [healthData, setHealthData] = useState<UserProfileType>(userProfile);
    const [displayName, setDisplayName] = useState(currentUser?.displayName || '');
    const [profilePicture, setProfilePicture] = useState(currentUser?.profilePicture || '');
    
    const [saved, setSaved] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setHealthData(userProfile);
        if (currentUser) {
            setDisplayName(currentUser.displayName);
            setProfilePicture(currentUser.profilePicture);
        }
    }, [userProfile, currentUser]);

    if (!currentUser) {
        return null; // Should not happen if Auth guard is in place
    }

    const handleHealthChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setHealthData(prev => ({ 
            ...prev, 
            [name]: name === 'activityLevel' ? parseFloat(value) : value 
        }));
    };
    
    const handleRandomizeEmoji = () => {
        setProfilePicture(getRandomEmoji());
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                if (typeof reader.result === 'string') {
                    setProfilePicture(reader.result);
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        // Preserve existing pillar scores when saving profile data
        const updatedProfile = { ...healthData, pillarScores: userProfile.pillarScores };
        setUserProfile(updatedProfile, { displayName, profilePicture });
        setSaved(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setTimeout(() => setSaved(false), 3000);
    };
    
    const isBase64Image = profilePicture.startsWith('data:image/');

    return (
        <div className="bg-white dark:bg-gray-800 p-6 md:p-8 rounded-2xl shadow-lg w-full transform transition-all duration-300">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6 text-center">ข้อมูลส่วนตัวและบัญชี</h2>
            
            {saved && (
                <div className="bg-green-100 dark:bg-green-900/50 border-l-4 border-green-500 text-green-700 dark:text-green-300 p-4 rounded-md mb-6 animate-fade-in" role="alert">
                    <p className="font-bold">บันทึกข้อมูลสำเร็จ!</p>
                </div>
            )}

            <form onSubmit={handleSave} className="space-y-8">
                {/* Account Management Section */}
                <div className="p-4 border dark:border-gray-700 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-4">จัดการบัญชี</h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Username (ID)</label>
                            <p className="w-full p-2 bg-gray-100 dark:bg-gray-700 rounded-md text-gray-500 dark:text-gray-400 font-mono text-sm">
                                @{currentUser.username}
                            </p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">ชื่อที่แสดง</label>
                            <input
                                type="text"
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 focus:ring-2 focus:ring-green-500"
                                placeholder="ชื่อของคุณ"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">รูปโปรไฟล์</label>
                            <div className="flex items-center gap-4">
                                {isBase64Image ? (
                                    <img src={profilePicture} alt="Profile preview" className="w-16 h-16 rounded-full object-cover border-2 border-gray-300 dark:border-gray-600"/>
                                ) : (
                                    <div className="w-16 h-16 rounded-full flex items-center justify-center bg-gray-100 dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600">
                                        <span className="text-3xl">{profilePicture}</span>
                                    </div>
                                )}
                                <div className="flex gap-2">
                                    <button type="button" onClick={handleRandomizeEmoji} className="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-600 rounded-full hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors">สุ่ม Emoji</button>
                                    <button type="button" onClick={() => fileInputRef.current?.click()} className="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-600 rounded-full hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors">อัปโหลด</button>
                                    <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageUpload} className="hidden" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Health Data Section */}
                <div className="p-4 border dark:border-gray-700 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-4">ข้อมูลสุขภาพพื้นฐาน</h3>
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">เพศ</label>
                                <select name="gender" value={healthData.gender} onChange={handleHealthChange} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 focus:ring-2 focus:ring-green-500">
                                    <option value="male">ชาย</option>
                                    <option value="female">หญิง</option>
                                </select>
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">อายุ (ปี)</label>
                                <input type="number" name="age" value={healthData.age} onChange={handleHealthChange} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 focus:ring-2 focus:ring-green-500" placeholder="เช่น 40"/>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">น้ำหนัก (กก.)</label>
                                <input type="number" name="weight" value={healthData.weight} onChange={handleHealthChange} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 focus:ring-2 focus:ring-green-500" placeholder="เช่น 75"/>
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">ส่วนสูง (ซม.)</label>
                                <input type="number" name="height" value={healthData.height} onChange={handleHealthChange} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 focus:ring-2 focus:ring-green-500" placeholder="เช่น 175"/>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">รอบเอว (ซม.)</label>
                                <input type="number" name="waist" value={healthData.waist} onChange={handleHealthChange} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 focus:ring-2 focus:ring-green-500" placeholder="เช่น 90"/>
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">รอบสะโพก (ซม.)</label>
                                <input type="number" name="hip" value={healthData.hip} onChange={handleHealthChange} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 focus:ring-2 focus:ring-green-500" placeholder="เช่น 100"/>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">ระดับกิจกรรม</label>
                            <select name="activityLevel" value={healthData.activityLevel} onChange={handleHealthChange} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 focus:ring-2 focus:ring-green-500">
                                {PLANNER_ACTIVITY_LEVELS.map(level => <option key={level.value} value={level.value}>{level.label}</option>)}
                            </select>
                        </div>
                        <div className="border-t dark:border-gray-600 pt-4 mt-2">
                             <label className="block text-sm font-medium text-teal-600 dark:text-teal-400 mb-1">โรคประจำตัว / ความเสี่ยงสุขภาพ (สำหรับ AI Coach)</label>
                            <select name="healthCondition" value={healthData.healthCondition || HEALTH_CONDITIONS[0]} onChange={handleHealthChange} className="w-full p-2 border border-teal-300 dark:border-teal-700 rounded-md bg-teal-50 dark:bg-teal-900/20 focus:ring-2 focus:ring-teal-500 text-gray-800 dark:text-gray-200">
                                {HEALTH_CONDITIONS.map(condition => <option key={condition} value={condition}>{condition}</option>)}
                            </select>
                            <p className="text-xs text-gray-500 mt-1">AI จะใช้ข้อมูลนี้ในการวิเคราะห์อาหารและแนะนำแผนโภชนาการให้เหมาะสมกับโรคของคุณ</p>
                        </div>
                    </div>
                </div>

                <button
                    type="submit"
                    className="w-full bg-green-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-green-600 focus:outline-none focus:ring-4 focus:ring-green-300 dark:focus:ring-green-700 transition-all duration-300 transform hover:scale-105"
                >
                    บันทึกข้อมูลทั้งหมด
                </button>
            </form>
        </div>
    );
};

export default UserProfile;