import React, { useState, useContext, useEffect } from 'react';
import { AppContext } from '../context/AppContext';
import { PILLAR_LABELS } from '../constants';
import { PillarScore } from '../types';
import { ClipboardDocumentCheckIcon } from './icons';

// --- Radar Chart Component (Local for Real-time Feedback) ---
const AssessmentRadarChart: React.FC<{ scores: { [key: string]: number } }> = ({ scores }) => {
    const size = 300;
    const center = size / 2;
    const radius = 100;
    const keys = Object.keys(PILLAR_LABELS);
    const totalAxes = keys.length;
    
    // Convert value to coordinates
    const getCoordinates = (value: number, index: number) => {
        const angle = (Math.PI * 2 * index) / totalAxes - Math.PI / 2; // -PI/2 to start at top
        const x = center + (radius * (value / 10)) * Math.cos(angle);
        const y = center + (radius * (value / 10)) * Math.sin(angle);
        return { x, y };
    };

    // Generate path for data
    const pathData = keys.map((key, i) => {
        const val = scores[key] || 5; // default 5
        const { x, y } = getCoordinates(val, i);
        return `${i === 0 ? 'M' : 'L'}${x},${y}`;
    }).join(' ') + 'Z';

    return (
        <div className="flex flex-col items-center justify-center">
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="max-w-full h-auto">
                {/* Grid Circles */}
                {[2, 4, 6, 8, 10].map(r => (
                     <circle 
                        key={r} 
                        cx={center} 
                        cy={center} 
                        r={radius * (r / 10)} 
                        fill="none" 
                        stroke="#e5e7eb" // gray-200
                        strokeWidth="1" 
                        className="dark:stroke-gray-700"
                     />
                ))}
                
                {/* Axes & Labels */}
                {keys.map((key, i) => {
                    const { x, y } = getCoordinates(10, i); // End of axis
                    const labelCoord = getCoordinates(12, i); // Label position
                    return (
                        <g key={key}>
                            <line x1={center} y1={center} x2={x} y2={y} stroke="#e5e7eb" strokeWidth="1" className="dark:stroke-gray-700"/>
                            <text 
                                x={labelCoord.x} 
                                y={labelCoord.y} 
                                textAnchor="middle" 
                                dominantBaseline="middle" 
                                className="text-[10px] fill-gray-500 dark:fill-gray-400 font-medium"
                            >
                                {PILLAR_LABELS[key as keyof typeof PILLAR_LABELS]}
                            </text>
                        </g>
                    );
                })}

                {/* Data Shape */}
                <path d={pathData} fill="rgba(20, 184, 166, 0.2)" stroke="#14b8a6" strokeWidth="2" className="transition-all duration-300 ease-out" />
                
                {/* Data Points */}
                {keys.map((key, i) => {
                    const val = scores[key] || 5;
                    const { x, y } = getCoordinates(val, i);
                    return <circle key={i} cx={x} cy={y} r="4" fill="#14b8a6" className="transition-all duration-300 ease-out" />;
                })}
            </svg>
        </div>
    );
};

const LifestyleAssessment: React.FC = () => {
    const { userProfile, setUserProfile, currentUser, setActiveView } = useContext(AppContext);
    
    const [pillarScores, setPillarScores] = useState<PillarScore>(userProfile.pillarScores || {
        nutrition: 5, activity: 5, sleep: 5, stress: 5, substance: 5, social: 5
    });
    
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        if (userProfile.pillarScores) {
            setPillarScores(userProfile.pillarScores);
        }
    }, [userProfile]);

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
        }, 1500);
    };

    return (
        <div className="bg-white dark:bg-gray-800 p-6 md:p-8 rounded-2xl shadow-lg w-full transform transition-all duration-300 animate-fade-in">
            <div className="text-center mb-6">
                <div className="flex justify-center mb-2">
                     <ClipboardDocumentCheckIcon className="w-12 h-12 text-teal-500" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">ประเมิน 6 เสาหลัก (Lifestyle Balance)</h2>
                <p className="text-gray-600 dark:text-gray-300 mt-2">
                    ให้คะแนนความพึงพอใจในแต่ละด้าน (1 = ต้องปรับปรุง, 10 = ดีเยี่ยม) เพื่อสร้างแผนภูมิสุขภาพของคุณ
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                {/* Left: Radar Chart */}
                <div className="bg-gray-50 dark:bg-gray-700/30 rounded-xl p-4 flex justify-center">
                    <AssessmentRadarChart scores={pillarScores as any} />
                </div>

                {/* Right: Sliders */}
                <div className="space-y-6">
                     {Object.keys(PILLAR_LABELS).map((key) => {
                             const score = pillarScores[key as keyof PillarScore];
                             return (
                                <div key={key} className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                                    <div className="flex justify-between items-center mb-2">
                                        <label className="font-medium text-gray-700 dark:text-gray-200 flex items-center gap-2">
                                            {PILLAR_LABELS[key as keyof PillarScore]}
                                        </label>
                                        <span className={`text-lg font-bold ${score >= 8 ? 'text-green-500' : score <= 4 ? 'text-red-500' : 'text-yellow-500'}`}>
                                            {score}/10
                                        </span>
                                    </div>
                                    <input 
                                        type="range" 
                                        name={key}
                                        min="1" 
                                        max="10" 
                                        step="1"
                                        value={score} 
                                        onChange={handlePillarChange}
                                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-600 accent-teal-500"
                                    />
                                    <div className="flex justify-between text-xs text-gray-400 mt-1 px-1">
                                        <span>ปรับปรุง</span>
                                        <span>ดีเยี่ยม</span>
                                    </div>
                                </div>
                             );
                        })}
                </div>
            </div>
            
            <div className="mt-8 flex justify-center">
                 <button
                    onClick={handleSave}
                    className={`w-full md:w-auto px-8 py-3 rounded-lg font-bold text-white transition-all duration-300 transform hover:scale-105 ${saved ? 'bg-green-500' : 'bg-teal-500 hover:bg-teal-600'}`}
                >
                    {saved ? 'บันทึกเรียบร้อย!' : 'บันทึกการประเมิน'}
                </button>
            </div>
        </div>
    );
};

export default LifestyleAssessment;