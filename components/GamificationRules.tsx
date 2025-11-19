import React from 'react';
import { TrophyIcon, StarIcon } from './icons';
import { XP_VALUES, LEVEL_THRESHOLDS, ACHIEVEMENTS } from '../constants';

const GamificationRules: React.FC = () => {
    return (
        <div className="bg-white dark:bg-gray-800 p-6 md:p-8 rounded-2xl shadow-lg w-full space-y-8 animate-fade-in">
            <div className="text-center">
                <div className="flex justify-center mb-4">
                    <div className="bg-yellow-100 dark:bg-yellow-900/30 p-4 rounded-full">
                        <TrophyIcon className="w-12 h-12 text-yellow-500" />
                    </div>
                </div>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">กติกาการสะสมแต้มและเลเวล</h2>
                <p className="text-gray-600 dark:text-gray-300 mt-2">
                    สนุกกับการดูแลสุขภาพ สะสม XP และปลดล็อกเหรียญรางวัลแห่งความสำเร็จ!
                </p>
            </div>

            {/* Section 1: XP Values */}
            <div className="bg-gray-50 dark:bg-gray-700/50 p-6 rounded-xl">
                <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                    <StarIcon className="w-6 h-6 text-yellow-500" />
                    ตารางคะแนน (XP)
                </h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b dark:border-gray-600 text-gray-500 dark:text-gray-400 text-sm">
                                <th className="p-2">กิจกรรม</th>
                                <th className="p-2 text-right">XP ที่ได้รับ</th>
                            </tr>
                        </thead>
                        <tbody className="text-gray-700 dark:text-gray-200">
                            <tr className="border-b dark:border-gray-600">
                                <td className="p-3">บันทึกน้ำดื่ม</td>
                                <td className="p-3 text-right font-bold text-teal-600">+{XP_VALUES.WATER}</td>
                            </tr>
                            <tr className="border-b dark:border-gray-600">
                                <td className="p-3">บันทึกแคลอรี่ / อาหาร</td>
                                <td className="p-3 text-right font-bold text-teal-600">+{XP_VALUES.CALORIE}</td>
                            </tr>
                            <tr className="border-b dark:border-gray-600">
                                <td className="p-3">บันทึกอารมณ์ / ความเครียด</td>
                                <td className="p-3 text-right font-bold text-teal-600">+{XP_VALUES.MOOD}</td>
                            </tr>
                            <tr className="border-b dark:border-gray-600">
                                <td className="p-3">บันทึกการนอน</td>
                                <td className="p-3 text-right font-bold text-teal-600">+{XP_VALUES.SLEEP}</td>
                            </tr>
                            <tr className="border-b dark:border-gray-600">
                                <td className="p-3">วิเคราะห์อาหาร AI</td>
                                <td className="p-3 text-right font-bold text-teal-600">+{XP_VALUES.FOOD}</td>
                            </tr>
                            <tr className="border-b dark:border-gray-600">
                                <td className="p-3">บันทึกกิจกรรม / ออกกำลังกาย</td>
                                <td className="p-3 text-right font-bold text-teal-600">+{XP_VALUES.EXERCISE}</td>
                            </tr>
                            <tr className="border-b dark:border-gray-600">
                                <td className="p-3">เช็คอินสุขภาพประจำวัน (ครบชุด)</td>
                                <td className="p-3 text-right font-bold text-teal-600">+{XP_VALUES.WELLNESS}</td>
                            </tr>
                            <tr>
                                <td className="p-3">สร้างแผนไลฟ์สไตล์</td>
                                <td className="p-3 text-right font-bold text-teal-600">+{XP_VALUES.PLANNER}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Section 2: Levels */}
            <div>
                <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">ระดับเลเวล (Levels)</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {LEVEL_THRESHOLDS.map((threshold, index) => (
                         <div key={index} className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-3 text-center shadow-sm">
                             <p className="text-sm text-gray-500 dark:text-gray-400">Level {index + 1}</p>
                             <p className="text-lg font-bold text-indigo-600 dark:text-indigo-400">{threshold.toLocaleString()} XP</p>
                         </div>
                    ))}
                </div>
            </div>

            {/* Section 3: Badges */}
            <div>
                <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">เหรียญรางวัล (Badges)</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {ACHIEVEMENTS.map((badge) => (
                        <div key={badge.id} className="flex items-center p-4 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-gray-700 dark:to-gray-600 rounded-xl">
                            <div className="w-12 h-12 bg-white dark:bg-gray-500 rounded-full flex items-center justify-center text-2xl shadow-sm flex-shrink-0 mr-4">
                                {badge.icon}
                            </div>
                            <div>
                                <h4 className="font-bold text-gray-800 dark:text-white">{badge.name}</h4>
                                <p className="text-sm text-gray-600 dark:text-gray-300">{badge.description}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default GamificationRules;