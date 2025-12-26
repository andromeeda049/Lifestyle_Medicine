
import React, { useState, useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { HEALTH_LITERACY_QUESTIONS, XP_VALUES } from '../constants';
import { BookOpenIcon, StarIcon } from './icons';

const HealthLiteracyQuiz: React.FC = () => {
    const { saveQuizResult, gainXP, setActiveView, currentUser, quizHistory } = useContext(AppContext);
    
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selectedOption, setSelectedOption] = useState<number | null>(null);
    const [score, setScore] = useState(0);
    const [showExplanation, setShowExplanation] = useState(false);
    const [isFinished, setIsFinished] = useState(false);

    if (!currentUser || currentUser.role === 'guest') {
        return (
            <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg text-center">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">กรุณาเข้าสู่ระบบ</h2>
                <p className="text-gray-600 dark:text-gray-300">ฟีเจอร์นี้สำหรับผู้ใช้ที่ลงทะเบียนเพื่อติดตามผลการเรียนรู้</p>
            </div>
        );
    }

    const currentQuestion = HEALTH_LITERACY_QUESTIONS[currentQuestionIndex];
    const isPreTest = quizHistory.length === 0;

    const handleAnswer = (index: number) => {
        setSelectedOption(index);
        setShowExplanation(true);
        if (index === currentQuestion.correctIndex) {
            setScore(prev => prev + 1);
        }
    };

    const handleNext = () => {
        setSelectedOption(null);
        setShowExplanation(false);
        if (currentQuestionIndex < HEALTH_LITERACY_QUESTIONS.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
        } else {
            finishQuiz();
        }
    };

    const finishQuiz = () => {
        const finalScorePercent = (score / HEALTH_LITERACY_QUESTIONS.length) * 100;
        // Adjust final score addition for the last question if correct
        const totalCorrect = selectedOption === currentQuestion.correctIndex ? score + 1 : score;
        const finalPercent = Math.round((totalCorrect / HEALTH_LITERACY_QUESTIONS.length) * 100);
        
        saveQuizResult(finalPercent, HEALTH_LITERACY_QUESTIONS.length, totalCorrect);
        gainXP(XP_VALUES.QUIZ, 'QUIZ');
        setIsFinished(true);
    };

    if (isFinished) {
        const totalCorrect = selectedOption === currentQuestion.correctIndex ? score + 1 : score;
        return (
            <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg text-center animate-fade-in w-full max-w-2xl mx-auto">
                <div className="flex justify-center mb-6">
                    <div className="w-24 h-24 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center border-4 border-yellow-400">
                        <StarIcon className="w-12 h-12 text-yellow-500" />
                    </div>
                </div>
                <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">บันทึกผลเรียบร้อย!</h2>
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                    คุณทำแบบทดสอบ {isPreTest ? '(Pre-test)' : '(Post-test)'} เสร็จสิ้น
                </p>
                
                <div className="bg-gray-100 dark:bg-gray-700 p-6 rounded-xl mb-8">
                    <p className="text-lg font-medium text-gray-700 dark:text-gray-300">คะแนนความรอบรู้ทางสุขภาพ</p>
                    <div className="text-5xl font-bold text-teal-600 dark:text-teal-400 my-2">
                        {Math.round((totalCorrect / HEALTH_LITERACY_QUESTIONS.length) * 100)}%
                    </div>
                    <p className="text-sm text-gray-500">ตอบถูก {totalCorrect} จาก {HEALTH_LITERACY_QUESTIONS.length} ข้อ</p>
                </div>

                <div className="flex flex-col gap-3">
                    <button onClick={() => setActiveView('dashboard')} className="w-full bg-teal-500 text-white font-bold py-3 px-6 rounded-lg hover:bg-teal-600 transition-colors">
                        ดูผลลัพธ์ใน Dashboard
                    </button>
                    <button onClick={() => setActiveView('literacy')} className="w-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-bold py-3 px-6 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
                        อ่านบทความสุขภาพเพิ่มเติม
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full max-w-2xl mx-auto space-y-6 animate-fade-in">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg">
                <div className="flex items-center justify-between mb-6 border-b border-gray-100 dark:border-gray-700 pb-4">
                    <div className="flex items-center gap-3">
                        <BookOpenIcon className="w-8 h-8 text-teal-500" />
                        <div>
                            <h2 className="text-xl font-bold text-gray-800 dark:text-white">แบบทดสอบความรอบรู้ (HL Quiz)</h2>
                            <p className="text-xs text-teal-600 dark:text-teal-400 font-bold">{isPreTest ? 'Pre-test (ก่อนการใช้งาน)' : 'Post-test (ติดตามผล)'}</p>
                        </div>
                    </div>
                    <div className="text-sm font-semibold text-gray-500">
                        ข้อที่ {currentQuestionIndex + 1} / {HEALTH_LITERACY_QUESTIONS.length}
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-gray-200 dark:bg-gray-700 h-2 rounded-full mb-6">
                    <div 
                        className="bg-teal-500 h-2 rounded-full transition-all duration-300" 
                        style={{ width: `${((currentQuestionIndex) / HEALTH_LITERACY_QUESTIONS.length) * 100}%` }}
                    ></div>
                </div>

                {/* Question */}
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-6 leading-relaxed">
                    {currentQuestion.question}
                </h3>

                {/* Options */}
                <div className="space-y-3">
                    {currentQuestion.options.map((option, index) => {
                        let buttonClass = "w-full p-4 rounded-xl border-2 text-left transition-all duration-200 font-medium ";
                        
                        if (showExplanation) {
                            if (index === currentQuestion.correctIndex) {
                                buttonClass += "bg-green-100 border-green-500 text-green-800 dark:bg-green-900/30 dark:text-green-300 ";
                            } else if (index === selectedOption) {
                                buttonClass += "bg-red-100 border-red-500 text-red-800 dark:bg-red-900/30 dark:text-red-300 ";
                            } else {
                                buttonClass += "bg-gray-50 border-gray-200 text-gray-400 dark:bg-gray-800 dark:border-gray-700 ";
                            }
                        } else {
                            buttonClass += "bg-white border-gray-200 hover:border-teal-500 hover:bg-teal-50 text-gray-700 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:hover:border-teal-400 ";
                        }

                        return (
                            <button
                                key={index}
                                onClick={() => !showExplanation && handleAnswer(index)}
                                disabled={showExplanation}
                                className={buttonClass}
                            >
                                {option}
                            </button>
                        );
                    })}
                </div>

                {/* Explanation */}
                {showExplanation && (
                    <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border-l-4 border-blue-500 animate-fade-in-down">
                        <h4 className="font-bold text-blue-700 dark:text-blue-300 mb-1">คำอธิบาย:</h4>
                        <p className="text-gray-700 dark:text-gray-300 text-sm">{currentQuestion.explanation}</p>
                        <div className="mt-4 flex justify-end">
                            <button 
                                onClick={handleNext}
                                className="bg-blue-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                {currentQuestionIndex < HEALTH_LITERACY_QUESTIONS.length - 1 ? 'ข้อถัดไป' : 'ดูผลลัพธ์'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default HealthLiteracyQuiz;
