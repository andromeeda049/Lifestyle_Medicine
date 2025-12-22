
import React, { useState, useContext, useEffect } from 'react';
import { AppContext } from '../context/AppContext';
import { PILLAR_LABELS } from '../constants';
import { PillarScore } from '../types';
import { ClipboardDocumentCheckIcon, StarIcon } from './icons';

// --- Components ---
const ScoreGauge: React.FC<{ score: number }> = ({ score }) => {
    let color = 'text-red-500';
    let label = 'ความเสี่ยงสูง (High Risk)';
    let recommendation = 'ควรปรับพฤติกรรมโดยด่วนและปรึกษาแพทย์';

    if (score >= 80) {
        color = 'text-green-500';
        label = 'สุขภาพดีเยี่ยม (Excellent)';
        recommendation = 'ยอดเยี่ยม! รักษามาตรฐานนี้ไว้เพื่อป้องกันโรค';
    } else if (score >= 60) {
        color = 'text-teal-500';
        label = 'สุขภาพดี (Good)';
        recommendation = 'ทำได้ดี แต่ยังมีบางจุดที่พัฒนาให้ดียิ่งขึ้นได้';
    } else if (score >= 40) {
        color = 'text-yellow-500';
        label = 'ความเสี่ยงปานกลาง (Fair)';
        recommendation = 'ควรเริ่มปรับเปลี่ยนพฤติกรรมในบางด้าน';
    }

    const circumference = 2 * Math.PI * 40;
    const offset = circumference - (score / 100) * circumference;

    return (
        <div className="flex flex-col items-center justify-center relative">
            <div className="relative w-48 h-48">
                <svg className="w-full h-full transform -rotate-90">
                    <circle cx="50%" cy="50%" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-gray-200 dark:text-gray-700" />
                    <circle cx="50%" cy="50%" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" 
                        strokeDasharray={circumference} 
                        strokeDashoffset={offset} 
                        className={`${color} transition-all duration-1000 ease-out`} 
                    />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className={`text-4xl font-bold ${color}`}>{score}</span>
                    <span className="text-xs text-gray-400">/ 100 คะแนน</span>
                </div>
            </div>
            <div className="text-center mt-2">
                <h3 className={`text-lg font-bold ${color}`}>{label}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-xs">{recommendation}</p>
            </div>
        </div>
    );
};

const LifestyleAssessment: React.FC = () => {
    const { userProfile, setUserProfile, currentUser, setActiveView } = useContext(AppContext);
    
    const [pillarScores, setPillarScores] = useState<PillarScore>(userProfile.pillarScores || {
        nutrition: 5, activity: 5, sleep: 5, stress: 5, substance: 5, social: 5
    });
    
    const [saved, setSaved] = useState(false);
    const [totalScore, setTotalScore] = useState(0);

    useEffect(() => {
        if (userProfile.pillarScores) {
            setPillarScores(userProfile.pillarScores);
        }
    }, [userProfile]);

    useEffect(() => {
        // Calculate Total Score (Weighted or Average)
        // Normalize to 0-100 scale. There are 6 pillars, max 10 each. Total max 60.
        // Score = (Sum / 60) * 100
        const sum = (Object.values(pillarScores) as number[]).reduce((a, b) => a + b, 0);
        const normalized = Math.round((sum / 60) * 100);
        setTotalScore(normalized);
    }, [pillarScores]);

    const handlePillarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setPillarScores(prev => ({ ...prev, [name]: parseInt(value) }));
    };

    const handleSave = () => {
        if (!currentUser) return;
        
        // Preserve existing profile data, only update pillar scores
        const updatedProfile = { ...userProfile, pillarScores };
        setUserProfile(updatedProfile, { 
            displayName: currentUser.displayName, 
            profilePicture: currentUser.profilePicture 
        });
        
        setSaved(true);
        setTimeout(() => {
            setSaved(false);
            setActiveView('dashboard');
        }, 2000);
    };

    return (
        <div className="bg-white dark:bg-gray-800 p-6 md:p-8 rounded-2xl shadow-lg w-full transform transition-all duration-300 animate-fade-in">
            <div className="text-center mb-8">
                <div className="flex justify-center mb-2">
                     <div className="p-3 bg-teal-100 dark:bg-teal-900/30 rounded-full">
                        <ClipboardDocumentCheckIcon className="w-10 h-10 text-teal-600 dark:text-teal-400" />
                     </div>
                </div>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">ดัชนีวิถีชีวิต (Lifestyle Index Assessment)</h2>
                <p className="text-gray-600 dark:text-gray-300 mt-2 text-sm">
                    เครื่องมือประเมินความเสี่ยงพฤติกรรมสุขภาพ 6 มิติ เพื่อติดตามผลลัพธ์การปรับเปลี่ยนพฤติกรรม (Behavioral Change)
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                {/* Left: Score Gauge (The "Measurement" Result) */}
                <div className="bg-gray-50 dark:bg-gray-700/30 rounded-2xl p-6 flex justify-center items-center shadow-inner border border-gray-100 dark:border-gray-700">
                    <ScoreGauge score={totalScore} />
                </div>

                {/* Right: Assessment Form (The Intervention Input) */}
                <div className="space-y-5">
                     {Object.keys(PILLAR_LABELS).map((key) => {
                             const score = pillarScores[key as keyof PillarScore];
                             return (
                                <div key={key} className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 p-4 rounded-xl shadow-sm transition-shadow hover:shadow-md">
                                    <div className="flex justify-between items-center mb-3">
                                        <label className="font-bold text-gray-700 dark:text-gray-200 flex items-center gap-2">
                                            {PILLAR_LABELS[key as keyof PillarScore]}
                                        </label>
                                        <div className="bg-gray-100 dark:bg-gray-600 px-3 py-1 rounded-lg text-sm font-mono font-bold text-indigo-600 dark:text-indigo-400">
                                            {score}/10
                                        </div>
                                    </div>
                                    <input 
                                        type="range" 
                                        name={key}
                                        min="1" 
                                        max="10" 
                                        step="1"
                                        value={score} 
                                        onChange={handlePillarChange}
                                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-500 accent-indigo-500"
                                    />
                                    <div className="flex justify-between text-[10px] text-gray-400 mt-2 uppercase tracking-wider">
                                        <span>ความเสี่ยงสูง (1)</span>
                                        <span>เหมาะสม (10)</span>
                                    </div>
                                </div>
                             );
                        })}
                </div>
            </div>
            
            <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                 <div className="flex flex-col items-center">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-4 text-center max-w-lg">
                        * คะแนนนี้ใช้สำหรับติดตามพัฒนาการรายบุคคล (Personal Trend) เพื่อประกอบการประกวดผลงานวิชาการ 
                        และไม่ใช่การวินิจฉัยทางการแพทย์
                    </p>
                    <button
                        onClick={handleSave}
                        className={`w-full md:w-auto px-8 py-3 rounded-full font-bold text-white shadow-lg transition-all duration-300 transform hover:scale-105 flex items-center gap-2 ${saved ? 'bg-green-500' : 'bg-gradient-to-r from-teal-500 to-indigo-500'}`}
                    >
                        {saved ? (
                            <><span>บันทึกผลเรียบร้อย</span><StarIcon className="w-5 h-5"/></>
                        ) : (
                            'ยืนยันผลการประเมิน (Submit)'
                        )}
                    </button>
                 </div>
            </div>
        </div>
    );
};

export default LifestyleAssessment;
