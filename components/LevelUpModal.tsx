import React, { useEffect } from 'react';
import { Achievement } from '../types';
import { TrophyIcon, MedalIcon } from './icons';

interface LevelUpModalProps {
    type: 'level' | 'badge';
    data: any; // number for level, Achievement object for badge
    onClose: () => void;
}

const LevelUpModal: React.FC<LevelUpModalProps> = ({ type, data, onClose }) => {
    // Auto close after a few seconds
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, 5000);
        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <div className="fixed inset-0 flex items-center justify-center z-[100] pointer-events-none">
            <div className="absolute inset-0 bg-black/60 pointer-events-auto transition-opacity duration-500 animate-fade-in" onClick={onClose}></div>
            <div className="relative bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-2xl transform scale-100 animate-bounce-in text-center max-w-sm w-full pointer-events-auto border-4 border-yellow-400">
                <div className="absolute -top-10 left-1/2 transform -translate-x-1/2">
                     {type === 'level' ? (
                         <div className="w-20 h-20 bg-yellow-400 rounded-full flex items-center justify-center shadow-lg border-4 border-white dark:border-gray-800">
                             <TrophyIcon className="w-10 h-10 text-white" />
                         </div>
                     ) : (
                         <div className="w-20 h-20 bg-purple-500 rounded-full flex items-center justify-center shadow-lg border-4 border-white dark:border-gray-800">
                             <span className="text-4xl">{(data as Achievement).icon}</span>
                         </div>
                     )}
                </div>
                
                <div className="mt-8">
                    {type === 'level' ? (
                        <>
                            <h2 className="text-3xl font-black text-yellow-500 mb-2 uppercase tracking-wider">Level Up!</h2>
                            <p className="text-gray-600 dark:text-gray-300 text-lg">ยินดีด้วย! คุณเลื่อนระดับเป็น</p>
                            <div className="text-5xl font-bold text-gray-800 dark:text-white my-4">Level {data}</div>
                        </>
                    ) : (
                        <>
                            <h2 className="text-2xl font-bold text-purple-500 mb-2">ปลดล็อกเหรียญรางวัล!</h2>
                            <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">{(data as Achievement).name}</h3>
                            <p className="text-gray-600 dark:text-gray-400">{(data as Achievement).description}</p>
                        </>
                    )}
                </div>

                <button 
                    onClick={onClose}
                    className="mt-6 bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-bold py-2 px-6 rounded-full hover:scale-105 transition-transform shadow-md"
                >
                    ยอดเยี่ยม!
                </button>
            </div>
            {/* Confetti Effect CSS could be added here or external */}
        </div>
    );
};

export default LevelUpModal;