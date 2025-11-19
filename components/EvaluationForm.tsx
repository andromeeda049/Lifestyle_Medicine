
import React, { useState, useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { SATISFACTION_QUESTIONS, OUTCOME_QUESTIONS, OUTCOME_OPTIONS, XP_VALUES } from '../constants';
import { ClipboardCheckIcon, StarIcon } from './icons';
import { SatisfactionData, OutcomeData } from '../types';

const EvaluationForm: React.FC = () => {
    const { saveEvaluation, gainXP, setActiveView, currentUser } = useContext(AppContext);
    const [step, setStep] = useState(1);
    const [satisfaction, setSatisfaction] = useState<SatisfactionData>({
        usability: 0, features: 0, benefit: 0, overall: 0, recommend: 0
    });
    const [outcomes, setOutcomes] = useState<OutcomeData>({
        nutrition: '', activity: '', sleep: '', stress: '', risk: '', overall: ''
    });
    const [submitted, setSubmitted] = useState(false);

    if (!currentUser || currentUser.role === 'guest') {
        return (
            <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg text-center">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">กรุณาเข้าสู่ระบบ</h2>
                <p className="text-gray-600 dark:text-gray-300">ฟีเจอร์นี้สำหรับผู้ใช้ที่ลงทะเบียนเท่านั้น</p>
            </div>
        );
    }

    const handleSatisfactionChange = (id: string, value: number) => {
        setSatisfaction(prev => ({ ...prev, [id]: value }));
    };

    const handleOutcomeChange = (id: string, value: string) => {
        setOutcomes(prev => ({ ...prev, [id]: value }));
    };

    const handleSubmit = () => {
        // Validate
        const satValues = Object.values(satisfaction);
        const outValues = Object.values(outcomes);
        if (satValues.some(v => v === 0) || outValues.some(v => v === '')) {
            alert('กรุณาตอบคำถามให้ครบทุกข้อ');
            return;
        }

        saveEvaluation(satisfaction, outcomes);
        gainXP(50); // Bonus XP for evaluation
        setSubmitted(true);
        setTimeout(() => setActiveView('home'), 3000);
    };

    if (submitted) {
        return (
            <div className="bg-white dark:bg-gray-800 p-12 rounded-2xl shadow-lg text-center animate-fade-in">
                <div className="flex justify-center mb-6">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                        <span className="text-4xl">🙏</span>
                    </div>
                </div>
                <h2 className="text-2xl font-bold text-green-600 dark:text-green-400 mb-2">ขอบคุณสำหรับการประเมิน!</h2>
                <p className="text-gray-600 dark:text-gray-300">ข้อมูลของคุณมีค่าอย่างยิ่งต่อการพัฒนานวัตกรรมนี้</p>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-gray-800 p-6 md:p-8 rounded-2xl shadow-lg w-full animate-fade-in">
            <div className="text-center mb-8">
                 <div className="flex justify-center mb-4">
                    <div className="bg-indigo-100 dark:bg-indigo-900/30 p-4 rounded-full">
                        <ClipboardCheckIcon className="w-12 h-12 text-indigo-600 dark:text-indigo-400" />
                    </div>
                </div>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">แบบประเมินผลการใช้งาน</h2>
                <p className="text-gray-600 dark:text-gray-300 mt-2">
                    ส่วนที่ {step}/2: {step === 1 ? 'ความพึงพอใจ (Satisfaction)' : 'ผลลัพธ์สุขภาพ (Health Outcomes)'}
                </p>
                 {/* Progress Bar */}
                <div className="w-full bg-gray-200 dark:bg-gray-700 h-2 rounded-full mt-4">
                    <div className={`h-2 bg-indigo-500 rounded-full transition-all duration-500`} style={{ width: step === 1 ? '50%' : '100%' }}></div>
                </div>
            </div>

            {step === 1 && (
                <div className="space-y-6 animate-fade-in">
                    {SATISFACTION_QUESTIONS.map((q) => (
                        <div key={q.id} className="border-b border-gray-100 dark:border-gray-700 pb-4 last:border-0">
                            <p className="text-gray-800 dark:text-gray-200 font-medium mb-3">{q.label}</p>
                            <div className="flex justify-between items-center max-w-md mx-auto">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        key={star}
                                        onClick={() => handleSatisfactionChange(q.id, star)}
                                        className={`text-3xl transition-transform hover:scale-110 focus:outline-none ${
                                            star <= (satisfaction as any)[q.id] ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'
                                        }`}
                                    >
                                        <StarIcon className="w-8 h-8" />
                                    </button>
                                ))}
                            </div>
                            <div className="flex justify-between text-xs text-gray-400 mt-1 max-w-md mx-auto px-1">
                                <span>ไม่พอใจเลย</span>
                                <span>พึงพอใจมาก</span>
                            </div>
                        </div>
                    ))}
                    <div className="flex justify-end pt-4">
                        <button
                            onClick={() => setStep(2)}
                            disabled={Object.values(satisfaction).some(v => v === 0)}
                            className="px-6 py-3 bg-indigo-500 text-white font-bold rounded-lg hover:bg-indigo-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                        >
                            ถัดไป
                        </button>
                    </div>
                </div>
            )}

            {step === 2 && (
                <div className="space-y-6 animate-fade-in">
                    <p className="text-sm text-gray-500 dark:text-gray-400 italic bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
                        โปรดเปรียบเทียบพฤติกรรมสุขภาพของคุณ <strong>หลังจากใช้งานแอปพลิเคชัน</strong> เทียบกับก่อนใช้งาน
                    </p>
                    {OUTCOME_QUESTIONS.map((q) => (
                        <div key={q.id} className="border-b border-gray-100 dark:border-gray-700 pb-4 last:border-0">
                             <p className="text-gray-800 dark:text-gray-200 font-medium mb-3">{q.label}</p>
                             <div className="grid grid-cols-2 gap-2">
                                {OUTCOME_OPTIONS.map(opt => (
                                    <button
                                        key={opt.value}
                                        onClick={() => handleOutcomeChange(q.id, opt.value)}
                                        className={`py-2 px-3 rounded-lg text-sm font-medium border transition-colors ${
                                            (outcomes as any)[q.id] === opt.value 
                                            ? 'bg-teal-500 text-white border-teal-500' 
                                            : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-teal-400'
                                        }`}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                             </div>
                        </div>
                    ))}
                     <div className="flex justify-between pt-4">
                         <button
                            onClick={() => setStep(1)}
                            className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-bold rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                        >
                            ย้อนกลับ
                        </button>
                        <button
                            onClick={handleSubmit}
                             disabled={Object.values(outcomes).some(v => v === '')}
                            className="px-8 py-3 bg-green-500 text-white font-bold rounded-lg hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors shadow-lg"
                        >
                            ส่งแบบประเมิน
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EvaluationForm;