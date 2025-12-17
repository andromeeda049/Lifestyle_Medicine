
import React from 'react';
import { HeartIcon, PhoneIcon, SparklesIcon, XIcon } from './icons';

interface CrisisModalProps {
    onClose: () => void;
    onOpenSOS: () => void;
    onBreathing: () => void;
    score: number;
}

const CrisisModal: React.FC<CrisisModalProps> = ({ onClose, onOpenSOS, onBreathing, score }) => {
    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-gray-900/90 backdrop-blur-sm animate-fade-in">
            <div className="bg-white dark:bg-gray-800 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden relative border-t-8 border-rose-500 animate-bounce-in">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:text-gray-500">
                    <XIcon className="w-6 h-6" />
                </button>

                <div className="p-8 text-center">
                    <div className="w-20 h-20 bg-rose-100 dark:bg-rose-900/50 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                        <HeartIcon className="w-10 h-10 text-rose-500" />
                    </div>
                    
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
                        เราเป็นห่วงคุณนะ
                    </h2>
                    <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
                        ระบบตรวจพบระดับความเครียดของคุณอยู่ที่ <span className="font-bold text-rose-500">{score}/10</span> <br/>
                        คุณไม่ได้อยู่ตัวคนเดียว เรามีทางเลือกให้คุณพักใจ
                    </p>

                    <div className="space-y-3">
                        <button 
                            onClick={() => { onClose(); onBreathing(); }}
                            className="w-full flex items-center justify-center gap-3 p-4 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-all font-semibold"
                        >
                            <SparklesIcon className="w-6 h-6" />
                            ฝึกหายใจผ่อนคลาย (4-7-8)
                        </button>

                        <button 
                            onClick={() => { onClose(); onOpenSOS(); }}
                            className="w-full flex items-center justify-center gap-3 p-4 rounded-xl bg-rose-600 text-white hover:bg-rose-700 shadow-lg shadow-rose-200 dark:shadow-none transition-all font-bold"
                        >
                            <PhoneIcon className="w-6 h-6" />
                            ต้องการความช่วยเหลือด่วน (SOS)
                        </button>
                        
                        <button 
                            onClick={onClose}
                            className="w-full p-3 text-gray-500 hover:text-gray-700 dark:text-gray-400 text-sm underline"
                        >
                            ไม่เป็นไร ฉันจัดการได้
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CrisisModal;
