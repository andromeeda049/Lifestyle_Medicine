
import React, { useEffect } from 'react';
import { Achievement } from '../types';
import { TrophyIcon, MedalIcon, StarIcon } from './icons';

interface LevelUpModalProps {
    type: 'level' | 'badge';
    data: any; // number for level, Achievement object for badge
    onClose: () => void;
}

const Confetti = () => {
  const colors = ['#EF476F', '#FFD166', '#06D6A0', '#118AB2', '#073B4C'];
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {[...Array(50)].map((_, i) => (
        <div
          key={i}
          className="absolute rounded-sm"
          style={{
            left: `${Math.random() * 100}%`,
            top: `-5%`,
            backgroundColor: colors[Math.floor(Math.random() * colors.length)],
            width: `${Math.random() * 8 + 4}px`,
            height: `${Math.random() * 10 + 5}px`,
            animation: `fall ${Math.random() * 2 + 2}s linear infinite`,
            animationDelay: `${Math.random() * 2}s`,
            opacity: Math.random() * 0.5 + 0.5,
            transform: `rotate(${Math.random() * 360}deg)`
          }}
        />
      ))}
      <style>{`
        @keyframes fall {
          to {
            transform: translateY(100vh) rotate(720deg);
          }
        }
      `}</style>
    </div>
  );
};

const LevelUpModal: React.FC<LevelUpModalProps> = ({ type, data, onClose }) => {
    // Auto close after a few seconds
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, 5000);
        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <div className="fixed inset-0 flex items-center justify-center z-[150] pointer-events-none">
            <div className="absolute inset-0 bg-black/70 pointer-events-auto transition-opacity duration-500 animate-fade-in" onClick={onClose}></div>
            <Confetti />
            
            <div className="relative bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-2xl transform scale-100 animate-bounce-in text-center max-w-sm w-full pointer-events-auto border-4 border-yellow-400 overflow-hidden">
                {/* Glow Effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-yellow-300/20 to-transparent pointer-events-none"></div>
                
                <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 z-10">
                     {type === 'level' ? (
                         <div className="w-24 h-24 bg-gradient-to-b from-yellow-300 to-yellow-500 rounded-full flex items-center justify-center shadow-lg border-4 border-white dark:border-gray-800 relative">
                             <TrophyIcon className="w-12 h-12 text-white drop-shadow-md" />
                             <div className="absolute inset-0 rounded-full bg-white opacity-20 animate-pulse-fast"></div>
                         </div>
                     ) : (
                         <div className="w-24 h-24 bg-gradient-to-b from-purple-400 to-indigo-600 rounded-full flex items-center justify-center shadow-lg border-4 border-white dark:border-gray-800 relative">
                             <span className="text-5xl drop-shadow-md filter grayscale-0">{(data as Achievement).icon || '🎉'}</span>
                             <div className="absolute inset-0 rounded-full bg-white opacity-20 animate-pulse-fast"></div>
                         </div>
                     )}
                </div>
                
                <div className="mt-12 relative z-10">
                    {type === 'level' ? (
                        <>
                            <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-500 to-orange-500 mb-2 uppercase tracking-wider drop-shadow-sm">Level Up!</h2>
                            <p className="text-gray-600 dark:text-gray-300 text-lg font-medium">ยินดีด้วย! คุณเลื่อนระดับเป็น</p>
                            <div className="text-6xl font-black text-gray-800 dark:text-white my-4 drop-shadow-lg">
                                {data}
                            </div>
                        </>
                    ) : (
                        <>
                            <h2 className="text-2xl font-black text-purple-600 dark:text-purple-400 mb-2 uppercase tracking-wide">New Achievement!</h2>
                            <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">{(data as Achievement).name || 'ภารกิจสำเร็จ'}</h3>
                            <p className="text-gray-500 dark:text-gray-400 text-sm px-4">{(data as Achievement).description}</p>
                        </>
                    )}
                </div>

                <button 
                    onClick={onClose}
                    className="mt-8 w-full bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-bold py-3 px-6 rounded-xl hover:scale-105 transition-transform shadow-lg active:scale-95 relative z-10"
                >
                    เยี่ยมมาก! (Close)
                </button>
            </div>
        </div>
    );
};

export default LevelUpModal;
