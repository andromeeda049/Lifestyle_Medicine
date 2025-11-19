import React, { useContext, useState, useMemo } from 'react';
import { AppContext } from '../context/AppContext';
import { AppView } from '../types';
import { ScaleIcon, FireIcon, CameraIcon, ShareIcon, WaterDropIcon, BeakerIcon, BoltIcon } from './icons';
import { PILLAR_LABELS } from '../constants';

const getBmiCategory = (bmi: number): { category: string; color: string } => {
    if (bmi < 18.5) return { category: 'น้ำหนักน้อยกว่าเกณฑ์', color: 'text-blue-500' };
    if (bmi < 23) return { category: 'สมส่วน', color: 'text-green-500' };
    if (bmi < 25) return { category: 'น้ำหนักเกิน', color: 'text-yellow-500' };
    if (bmi < 30) return { category: 'โรคอ้วนระดับที่ 1', color: 'text-orange-500' };
    return { category: 'โรคอ้วนระดับที่ 2', color: 'text-red-500' };
};

// --- Radar Chart Component ---
const RadarChart: React.FC<{ scores: { [key: string]: number } }> = ({ scores }) => {
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
        <div className="flex flex-col items-center">
            <h4 className="text-lg font-bold text-gray-700 dark:text-gray-300 mb-2">สมดุล 6 เสาหลัก (Lifestyle Balance)</h4>
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
                <path d={pathData} fill="rgba(20, 184, 166, 0.2)" stroke="#14b8a6" strokeWidth="2" />
                
                {/* Data Points */}
                {keys.map((key, i) => {
                    const val = scores[key] || 5;
                    const { x, y } = getCoordinates(val, i);
                    return <circle key={i} cx={x} cy={y} r="3" fill="#14b8a6" />;
                })}
            </svg>
            <p className="text-xs text-gray-400 mt-2">* อ้างอิงจากการประเมินตนเอง</p>
        </div>
    );
};


const Dashboard: React.FC = () => {
  const { setActiveView, bmiHistory, tdeeHistory, latestFoodAnalysis, waterHistory, waterGoal, calorieHistory, activityHistory, userProfile } = useContext(AppContext);
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied'>('idle');

  // Explicitly sort history to ensure [0] is the absolute latest by date
  const sortedBmiHistory = useMemo(() => {
      return [...bmiHistory].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [bmiHistory]);

  const sortedTdeeHistory = useMemo(() => {
      return [...tdeeHistory].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [tdeeHistory]);

  const latestBmi = sortedBmiHistory[0];
  const latestTdee = sortedTdeeHistory[0];
  const tdeeGoal = latestTdee ? Math.round(latestTdee.value) : 2000;

  const bmiInfo = latestBmi ? getBmiCategory(latestBmi.value) : null;
  
  const isToday = (someDate: Date) => {
    const today = new Date();
    return someDate.getDate() === today.getDate() &&
        someDate.getMonth() === today.getMonth() &&
        someDate.getFullYear() === today.getFullYear();
  };

  const waterIntakeToday = useMemo(() => {
    return waterHistory
        .filter(entry => isToday(new Date(entry.date)))
        .reduce((sum, entry) => sum + entry.amount, 0);
  }, [waterHistory]);

  const caloriesToday = useMemo(() => {
    return calorieHistory
        .filter(entry => isToday(new Date(entry.date)))
        .reduce((sum, entry) => sum + entry.calories, 0);
  }, [calorieHistory]);

  const caloriesBurnedToday = useMemo(() => {
    return activityHistory
        .filter(entry => isToday(new Date(entry.date)))
        .reduce((sum, entry) => sum + entry.caloriesBurned, 0);
  }, [activityHistory]);

  const handleShareSummary = async () => {
    let shareText = "ภาพรวมสุขภาพของฉัน:\n\n";

    if (latestBmi && bmiInfo) {
        shareText += `📊 BMI: ${latestBmi.value.toFixed(2)} (${bmiInfo.category})\n`;
    }
    shareText += `🔥 แคลอรี่ที่ต้องการ: ${tdeeGoal.toLocaleString()} kcal/วัน\n`;
    shareText += `🥗 แคลอรี่ที่บริโภค: ${caloriesToday.toLocaleString()} kcal\n`;
    shareText += `💪 แคลอรี่ที่เผาผลาญ: ${caloriesBurnedToday.toLocaleString()} kcal\n`;
    shareText += `💧 น้ำดื่มวันนี้: ${waterIntakeToday} / ${waterGoal} ml\n`;
    
    shareText += `\nสรุปโดย "ศูนย์โภชนาการอัจฉริยะ"`;

    if (navigator.share) {
        try {
            await navigator.share({ title: 'ภาพรวมสุขภาพของฉัน', text: shareText });
        } catch (error) {
            if (!(error instanceof DOMException && error.name === 'AbortError')) {
              console.error('Error sharing summary:', error);
            }
        }
    } else {
        try {
            await navigator.clipboard.writeText(shareText);
            setCopyStatus('copied');
            setTimeout(() => setCopyStatus('idle'), 2500);
        } catch (error) {
            console.error('Failed to copy summary:', error);
            alert('ไม่สามารถคัดลอกสรุปได้');
        }
    }
  };

  const Card: React.FC<{ title: string; icon: React.ReactNode; onClick: () => void; children: React.ReactNode; color: string;}> = ({ title, icon, onClick, children, color }) => (
    <div className={`bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg w-full transform transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border-t-4 ${color}`}>
        <div className="flex justify-between items-start">
            <h3 className="text-xl font-bold text-gray-800 dark:text-white">{title}</h3>
            <div className="text-gray-400 dark:text-gray-500">{icon}</div>
        </div>
        <div className="mt-4">
            {children}
        </div>
        <button 
            onClick={onClick} 
            className={`mt-6 w-full font-semibold py-2 px-4 rounded-lg transition-colors bg-opacity-10 hover:bg-opacity-20 ${color.replace('border', 'bg').replace('-t-4', '')} ${color.replace('border', 'text')} dark:bg-opacity-20 dark:hover:bg-opacity-30`}
        >
            ไปยังเครื่องมือ
        </button>
    </div>
  );

  return (
    <div className="space-y-8 animate-fade-in">
        {/* Personal Health Graph Section */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg">
             {userProfile.pillarScores ? (
                 <div className="flex flex-col md:flex-row items-center gap-8">
                     <div className="flex-1 w-full flex justify-center">
                         <RadarChart scores={userProfile.pillarScores as any} />
                     </div>
                     <div className="flex-1 text-center md:text-left">
                         <h3 className="text-xl font-bold text-teal-600 dark:text-teal-400 mb-2">Personal Health Graph</h3>
                         <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                             กราฟนี้แสดงภาพรวมสุขภาพของคุณใน 6 มิติ หากกราฟเอียงไปด้านใดด้านหนึ่ง แสดงว่าคุณอาจต้องปรับสมดุลในด้านอื่นๆ เพื่อสุขภาพที่ดีแบบองค์รวม
                         </p>
                         <button onClick={() => setActiveView('assessment')} className="mt-4 text-sm text-teal-600 underline">อัปเดตการประเมิน</button>
                     </div>
                 </div>
             ) : (
                 <div className="text-center py-8">
                     <p className="text-gray-600 dark:text-gray-300 mb-4">เริ่มสร้างแผนภูมิสุขภาพของคุณด้วยการประเมิน Lifestyle Balance</p>
                     <button onClick={() => setActiveView('assessment')} className="px-6 py-2 bg-teal-500 text-white rounded-full hover:bg-teal-600">ทำแบบประเมิน 6 เสาหลัก</button>
                 </div>
             )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card title="แคลอรี่วันนี้" icon={<BeakerIcon className="w-8 h-8"/>} onClick={() => setActiveView('calorieTracker')} color="border-orange-500">
                <div className="text-center">
                    <p className={`text-5xl font-bold my-2 ${caloriesToday > tdeeGoal ? 'text-red-500' : 'text-orange-500'}`}>{caloriesToday.toLocaleString()}</p>
                    <p className="text-md font-semibold text-gray-600 dark:text-gray-300">/ {tdeeGoal.toLocaleString()} kcal</p>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mt-3">
                        <div className={`h-2.5 rounded-full transition-all duration-500 ${caloriesToday > tdeeGoal ? 'bg-red-500' : 'bg-orange-500'}`} style={{ width: `${Math.min(100, (caloriesToday/tdeeGoal)*100)}%` }}></div>
                    </div>
                </div>
            </Card>

            <Card title="กิจกรรมวันนี้" icon={<BoltIcon className="w-8 h-8"/>} onClick={() => setActiveView('activityTracker')} color="border-yellow-500">
                <div className="text-center">
                    <p className="text-5xl font-bold my-2 text-yellow-500">{caloriesBurnedToday.toLocaleString()}</p>
                    <p className="text-xl font-semibold text-yellow-600 dark:text-yellow-400">แคลอรี่ที่เผาผลาญ</p>
                </div>
            </Card>
        </div>

        <Card title="บันทึกการดื่มน้ำ" icon={<WaterDropIcon className="w-8 h-8"/>} onClick={() => setActiveView('water')} color="border-blue-500">
            <div className="text-center">
                <p className="text-5xl font-bold my-2 text-blue-500 dark:text-blue-400">{waterIntakeToday}</p>
                <p className="text-md font-semibold text-gray-600 dark:text-gray-300">/ {waterGoal} ml</p>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mt-3">
                    <div className="bg-blue-500 h-2.5 rounded-full transition-all duration-500" style={{ width: `${Math.min(100, (waterIntakeToday/waterGoal)*100)}%` }}></div>
                </div>
            </div>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             <Card title="ดัชนีมวลกาย (BMI)" icon={<ScaleIcon className="w-8 h-8"/>} onClick={() => setActiveView('bmi')} color="border-red-500">
                {latestBmi ? (
                    <div className="text-center">
                        <p className={`text-5xl font-bold my-2 ${bmiInfo?.color}`}>{latestBmi.value.toFixed(2)}</p>
                        <p className={`text-xl font-semibold ${bmiInfo?.color}`}>{bmiInfo?.category}</p>
                    </div>
                ) : (
                    <p className="text-center text-gray-600 dark:text-gray-300 py-8">ยังไม่มีข้อมูล</p>
                )}
            </Card>

            <Card title="การเผาผลาญ (TDEE)" icon={<FireIcon className="w-8 h-8"/>} onClick={() => setActiveView('tdee')} color="border-sky-500">
                {latestTdee ? (
                     <div className="text-center">
                        <p className="text-5xl font-bold my-2 text-sky-600 dark:text-sky-400">{latestTdee.value.toLocaleString('en-US', { maximumFractionDigits: 0 })}</p>
                        <p className="text-xl font-semibold text-sky-600 dark:text-sky-400">kcal/วัน</p>
                    </div>
                ) : (
                    <p className="text-center text-gray-600 dark:text-gray-300 py-8">ยังไม่มีข้อมูล</p>
                )}
            </Card>
        </div>
        
        <div className="flex justify-center pt-4">
            <button
                onClick={handleShareSummary}
                className="inline-flex items-center justify-center gap-2 bg-green-500 text-white font-bold py-3 px-6 rounded-full hover:bg-green-600 focus:outline-none focus:ring-4 focus:ring-green-300 dark:focus:ring-green-800 transition-all duration-300 transform hover:scale-105"
            >
                <ShareIcon className="w-5 h-5" />
                {copyStatus === 'copied' ? 'คัดลอกแล้ว!' : 'แชร์ภาพรวม'}
            </button>
        </div>
    </div>
  );
};

export default Dashboard;