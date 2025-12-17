
import React, { useState, useEffect, useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { generateProactiveInsight } from '../services/geminiService';
import { SparklesIcon, XIcon, BoltIcon, HeartIcon } from './icons';

interface InsightData {
    title: string;
    message: string;
    type: 'warning' | 'info' | 'success';
    date: string;
}

const ProactiveInsight: React.FC = () => {
    const { 
        bmiHistory, sleepHistory, moodHistory, foodHistory, 
        apiKey, currentUser 
    } = useContext(AppContext);
    
    const [insight, setInsight] = useState<InsightData | null>(null);
    const [visible, setVisible] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!currentUser || currentUser.role === 'guest' || !apiKey) return;

        const loadInsight = async () => {
            const today = new Date().toDateString();
            const storedInsightStr = localStorage.getItem(`proactive_insight_${currentUser.username}`);
            
            if (storedInsightStr) {
                const storedInsight: InsightData = JSON.parse(storedInsightStr);
                if (storedInsight.date === today) {
                    setInsight(storedInsight);
                    setVisible(true);
                    return;
                }
            }

            // Generate new insight if none for today
            if (bmiHistory.length > 0 || sleepHistory.length > 0 || moodHistory.length > 0) {
                setLoading(true);
                try {
                    const result = await generateProactiveInsight({
                        bmiHistory, sleepHistory, moodHistory, foodHistory,
                        userName: currentUser.displayName || 'User'
                    }, apiKey);
                    
                    const newInsight: InsightData = { ...result, date: today };
                    setInsight(newInsight);
                    localStorage.setItem(`proactive_insight_${currentUser.username}`, JSON.stringify(newInsight));
                    setVisible(true);
                } catch (e) {
                    console.error("Failed to gen insight");
                } finally {
                    setLoading(false);
                }
            }
        };

        loadInsight();
    }, [currentUser, apiKey, bmiHistory, sleepHistory, moodHistory, foodHistory]);

    if (!visible || !insight) return null;

    const bgColors = {
        warning: 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800',
        info: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
        success: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
    };

    const iconColors = {
        warning: 'text-orange-500',
        info: 'text-blue-500',
        success: 'text-green-500'
    };

    const icons = {
        warning: <BoltIcon className={`w-6 h-6 ${iconColors.warning}`} />,
        info: <SparklesIcon className={`w-6 h-6 ${iconColors.info}`} />,
        success: <HeartIcon className={`w-6 h-6 ${iconColors.success}`} />
    };

    return (
        <div className={`relative w-full p-4 rounded-xl border-l-4 shadow-sm mb-6 flex items-start gap-4 animate-fade-in-down ${bgColors[insight.type]}`}>
            <div className="flex-shrink-0 mt-1 p-1 bg-white dark:bg-gray-800 rounded-full shadow-sm">
                {icons[insight.type]}
            </div>
            <div className="flex-1">
                <h4 className={`font-bold text-sm ${iconColors[insight.type]}`}>
                    {insight.title} <span className="text-xs text-gray-400 font-normal ml-2">• AI Health Guardian</span>
                </h4>
                <p className="text-gray-700 dark:text-gray-300 text-sm mt-1 leading-relaxed">
                    {insight.message}
                </p>
            </div>
            <button 
                onClick={() => setVisible(false)} 
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
                <XIcon className="w-4 h-4" />
            </button>
        </div>
    );
};

export default ProactiveInsight;
