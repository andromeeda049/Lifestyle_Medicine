
import React, { useState, useEffect, useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { generateProactiveInsight } from '../services/geminiService';
import { SparklesIcon, XIcon, BoltIcon, HeartIcon } from './icons';

const ProactiveInsight: React.FC = () => {
    const { bmiHistory, sleepHistory, moodHistory, foodHistory, currentUser, userProfile } = useContext(AppContext);
    const [insight, setInsight] = useState<any>(null);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (!currentUser || currentUser.role === 'guest') return;

        const loadInsight = async () => {
            const today = new Date().toDateString();
            const stored = localStorage.getItem(`proactive_insight_${currentUser.username}`);
            if (stored) {
                const parsed = JSON.parse(stored);
                if (parsed.date === today) { setInsight(parsed); setVisible(true); return; }
            }

            if (bmiHistory.length > 0 || sleepHistory.length > 0 || moodHistory.length > 0) {
                try {
                    const result = await generateProactiveInsight(
                        { bmiHistory, sleepHistory, moodHistory, foodHistory, userName: currentUser.displayName },
                        userProfile.aiSystemInstruction
                    );
                    const newInsight = { ...result, date: today };
                    setInsight(newInsight);
                    localStorage.setItem(`proactive_insight_${currentUser.username}`, JSON.stringify(newInsight));
                    setVisible(true);
                } catch (e) {}
            }
        };
        loadInsight();
    }, [currentUser, bmiHistory, sleepHistory, moodHistory, foodHistory, userProfile]);

    if (!visible || !insight) return null;

    return (
        <div className={`p-4 rounded-xl border-l-4 shadow-sm mb-6 flex items-start gap-4 animate-fade-in-down ${insight.type === 'warning' ? 'bg-orange-50 border-orange-500' : 'bg-blue-50 border-blue-500'}`}>
            <div className="p-1 bg-white rounded-full">{insight.type === 'warning' ? <BoltIcon className="w-6 h-6 text-orange-500" /> : <SparklesIcon className="w-6 h-6 text-blue-500" />}</div>
            <div className="flex-1">
                <h4 className="font-bold text-sm">{insight.title}</h4>
                <p className="text-sm mt-1">{insight.message}</p>
            </div>
            <button onClick={() => setVisible(false)}><XIcon className="w-4 h-4 text-gray-400" /></button>
        </div>
    );
};

export default ProactiveInsight;
