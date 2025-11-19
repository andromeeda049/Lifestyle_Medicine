
import React, { useState, useMemo, useContext } from 'react';
import { ACTIVITY_LEVELS } from '../constants';
import { AppContext } from '../context/AppContext';
import { TDEEHistoryEntry } from '../types';
import { TrashIcon, ShareIcon } from './icons';

// --- TDEE History Chart Component ---
interface TooltipData {
  x: number;
  y: number;
  value: number;
  date: string;
}

const TDEEHistoryChart: React.FC<{ data: TDEEHistoryEntry[] }> = ({ data }) => {
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);

  const chartParams = useMemo(() => {
    if (data.length < 2) return null;

    const chartData = [...data].reverse();
    const width = 500;
    const height = 200;
    const margin = { top: 20, right: 20, bottom: 40, left: 50 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const tdeeValues = chartData.map(d => d.value);
    const minTdee = Math.min(...tdeeValues);
    const maxTdee = Math.max(...tdeeValues);
    
    const yDomain = [Math.floor(minTdee * 0.98), Math.ceil(maxTdee * 1.02)];
    
    const xScale = (index: number) => (index / (chartData.length - 1)) * innerWidth;
    const yScale = (tdee: number) => innerHeight - ((tdee - yDomain[0]) / (yDomain[1] - yDomain[0])) * innerHeight;

    const linePath = chartData
      .map((d, i) => `${i === 0 ? 'M' : 'L'}${xScale(i)},${yScale(d.value)}`)
      .join(' ');
      
    const points = chartData.map((d, i) => ({
      x: xScale(i),
      y: yScale(d.value),
      value: d.value,
      date: new Date(d.date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' }),
    }));

    const yAxisLabels = [];
    const numTicks = 5;
    const tickStep = (yDomain[1] - yDomain[0]) / (numTicks - 1);
    for (let i = 0; i < numTicks; i++) {
        const value = yDomain[0] + (i * tickStep);
        yAxisLabels.push({
            y: yScale(value),
            label: Math.round(value).toLocaleString(),
        });
    }

    const xAxisLabels = [
        { x: xScale(0), label: points[0].date },
        { x: xScale(chartData.length - 1), label: points[points.length - 1].date }
    ];
     if (points.length > 2) {
      const midIndex = Math.floor(points.length / 2);
      xAxisLabels.splice(1, 0, { x: xScale(midIndex), label: points[midIndex].date });
    }

    return { width, height, margin, innerWidth, innerHeight, linePath, points, yAxisLabels, xAxisLabels };
  }, [data]);

  if (!chartParams) return null;

  const { width, height, margin, innerHeight, linePath, points, yAxisLabels, xAxisLabels } = chartParams;
  
  return (
    <div className="relative -mx-4 -my-2 sm:-mx-6 sm:-my-4">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto" aria-labelledby="chart-title-tdee" role="img">
        <title id="chart-title-tdee">กราฟแสดงแนวโน้มค่า TDEE</title>
        <g transform={`translate(${margin.left}, ${margin.top})`}>
          {yAxisLabels.map((tick, i) => (
            <g key={i} transform={`translate(0, ${tick.y})`} className="text-xs text-gray-500 dark:text-gray-400">
              <line x2={chartParams.innerWidth} className="stroke-gray-200 dark:stroke-gray-700" strokeDasharray="2,2" />
              <text x="-10" dy="0.32em" textAnchor="end" className="fill-current">
                {tick.label}
              </text>
            </g>
          ))}

          {xAxisLabels.map((tick, i) => (
              <text key={i} x={tick.x} y={innerHeight + 25} textAnchor="middle" className="text-xs fill-gray-500 dark:fill-gray-400">
                  {tick.label}
              </text>
          ))}

          <path d={linePath} fill="none" className="stroke-sky-500 dark:stroke-sky-400" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

          {points.map((point, i) => (
            <circle
              key={i}
              cx={point.x}
              cy={point.y}
              r="4"
              className="fill-sky-500 dark:fill-sky-400 stroke-white dark:stroke-gray-800 cursor-pointer transition-transform duration-200 hover:scale-150"
              strokeWidth="2"
              onMouseEnter={() => setTooltip(point)}
              onMouseLeave={() => setTooltip(null)}
            />
          ))}

          {tooltip && (
            <g transform={`translate(${tooltip.x}, ${tooltip.y})`} className="pointer-events-none transition-opacity duration-200" style={{ opacity: 1 }}>
              <g transform="translate(0, -12)">
                <rect x="-40" y="-28" width="80" height="24" rx="4" className="fill-gray-800 dark:fill-gray-900 opacity-80" />
                <text x="0" y="-16" textAnchor="middle" className="fill-white font-semibold text-xs">
                  {`${tooltip.value.toFixed(0)} kcal`}
                </text>
              </g>
            </g>
          )}
        </g>
      </svg>
    </div>
  );
};
// --- End of Chart Component ---


const MAX_HISTORY_ITEMS = 10;

const calculateBmr = (weight: number, height: number, age: number, gender: 'male' | 'female'): number => {
    if (gender === 'male') {
        return 10 * weight + 6.25 * height - 5 * age + 5;
    } else {
        return 10 * weight + 6.25 * height - 5 * age - 161;
    }
};

const TDEECalculator: React.FC = () => {
  const { tdeeHistory: history, setTdeeHistory: setHistory, userProfile, clearTdeeHistory } = useContext(AppContext);
  
  const [age, setAge] = useState<string>(userProfile.age || '');
  const [gender, setGender] = useState<'male' | 'female'>(userProfile.gender || 'male');
  const [height, setHeight] = useState<string>(userProfile.height || '');
  const [weight, setWeight] = useState<string>(userProfile.weight || '');
  const [activityLevel, setActivityLevel] = useState<number>(userProfile.activityLevel || ACTIVITY_LEVELS[2].value);
  const [tdee, setTdee] = useState<number | null>(null);
  const [bmr, setBmr] = useState<number | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState<boolean>(false);
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied'>('idle');

  const calculateTdee = () => {
    const ageNum = parseInt(age, 10);
    const heightNum = parseFloat(height);
    const weightNum = parseFloat(weight);

    if (ageNum > 0 && heightNum > 0 && weightNum > 0) {
      const bmrValue = calculateBmr(weightNum, heightNum, ageNum, gender);
      const tdeeValue = bmrValue * activityLevel;
      setBmr(bmrValue);
      setTdee(tdeeValue);

      const newEntry: TDEEHistoryEntry = {
          value: tdeeValue,
          bmr: bmrValue,
          date: new Date().toISOString(),
      };
      setHistory(prevHistory => [newEntry, ...prevHistory].slice(0, MAX_HISTORY_ITEMS));
    }
  };
  
  const handleShare = async () => {
    if (tdee === null || bmr === null) return;

    const shareText = `ผลการคำนวณพลังงานของฉัน:\n\n- พลังงานพื้นฐาน (BMR): ${Math.round(bmr)} kcal\n- พลังงานที่ต้องการต่อวัน (TDEE): ${Math.round(tdee)} kcal/วัน\n\nคำนวณโดย "Smart Lifestyle Wellness"`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'ผลการคำนวณ TDEE ของฉัน',
          text: shareText,
        });
      } catch (error) {
        if (!(error instanceof DOMException && error.name === 'AbortError')) {
          console.error('Error sharing:', error);
        }
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareText);
        setCopyStatus('copied');
        setTimeout(() => setCopyStatus('idle'), 2500);
      } catch (error) {
        console.error('Failed to copy:', error);
        alert('ไม่สามารถคัดลอกผลลัพธ์ได้');
      }
    }
  };

  const handleClearHistory = () => {
    setShowConfirmDialog(true);
  };

  const confirmClearHistory = () => {
    clearTdeeHistory();
    setShowConfirmDialog(false);
  };

  const cancelClearHistory = () => {
    setShowConfirmDialog(false);
  };

  return (
    <>
    <div className="bg-white dark:bg-gray-800 p-6 md:p-8 rounded-2xl shadow-lg w-full transform transition-all duration-300">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6 text-center">คำนวณการเผาผลาญพลังงาน (TDEE)</h2>
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="age" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">อายุ (ปี)</label>
            <input type="number" id="age" value={age} onChange={(e) => setAge(e.target.value)} placeholder="เช่น 30" className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"/>
          </div>
          <div>
            <label htmlFor="gender" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">เพศ</label>
            <select id="gender" value={gender} onChange={(e) => setGender(e.target.value as 'male' | 'female')} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500">
              <option value="male">ชาย</option>
              <option value="female">หญิง</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="tdee-height" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">ส่วนสูง (ซม.)</label>
            <input type="number" id="tdee-height" value={height} onChange={(e) => setHeight(e.target.value)} placeholder="เช่น 175" className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"/>
          </div>
          <div>
            <label htmlFor="tdee-weight" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">น้ำหนัก (กก.)</label>
            <input type="number" id="tdee-weight" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="เช่น 68" className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"/>
          </div>
        </div>
        <div>
          <label htmlFor="activity" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">ระดับกิจกรรม</label>
          <select id="activity" value={activityLevel} onChange={(e) => setActivityLevel(parseFloat(e.target.value))} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500">
            {ACTIVITY_LEVELS.map(level => (
              <option key={level.value} value={level.value}>{level.label}</option>
            ))}
          </select>
        </div>
        <button onClick={calculateTdee} className="w-full bg-sky-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-sky-600 focus:outline-none focus:ring-4 focus:ring-sky-300 dark:focus:ring-sky-800 transition-all duration-300 transform hover:scale-105">
          คำนวณ
        </button>
      </div>

      {tdee !== null && bmr !== null && (
        <div className="mt-8 bg-gray-100 dark:bg-gray-700 p-6 rounded-lg animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-center">
            <div>
              <p className="text-lg text-gray-600 dark:text-gray-300">พลังงานพื้นฐาน (BMR)</p>
              <p className="text-4xl font-bold my-2 text-gray-800 dark:text-white">{Math.round(bmr).toLocaleString()}</p>
              <p className="text-md font-semibold text-gray-600 dark:text-gray-300">kcal</p>
            </div>
            <div className="md:border-l md:border-gray-200 dark:md:border-gray-600">
              <p className="text-lg text-gray-600 dark:text-gray-300">พลังงานที่ต้องการต่อวัน (TDEE)</p>
              <p className="text-4xl font-bold my-2 text-sky-600 dark:text-sky-400">{Math.round(tdee).toLocaleString()}</p>
              <p className="text-md font-semibold text-sky-600 dark:text-sky-400">kcal/วัน</p>
            </div>
          </div>
          <div className="text-center mt-6">
            <button
              onClick={handleShare}
              className="inline-flex items-center justify-center gap-2 bg-green-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-600 focus:outline-none focus:ring-4 focus:ring-green-300 dark:focus:ring-green-800 transition-all duration-300"
              aria-label="แชร์ผลการคำนวณ TDEE"
            >
              <ShareIcon className="w-5 h-5" />
              {copyStatus === 'copied' ? 'คัดลอกแล้ว!' : 'แชร์ผลลัพธ์'}
            </button>
          </div>
        </div>
      )}
    </div>
    
    {history.length > 1 && (
        <div className="bg-white dark:bg-gray-800 p-6 md:p-8 rounded-2xl shadow-lg w-full mt-8 animate-fade-in">
            <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4">แนวโน้ม TDEE</h3>
            <TDEEHistoryChart data={history} />
        </div>
    )}

     {history.length > 0 && (
        <div className="bg-white dark:bg-gray-800 p-6 md:p-8 rounded-2xl shadow-lg w-full mt-8 animate-fade-in">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-800 dark:text-white">ประวัติการคำนวณ</h3>
                <button 
                    onClick={handleClearHistory} 
                    className="text-sm text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 flex items-center gap-1 transition-colors"
                    aria-label="ล้างประวัติการคำนวณ TDEE"
                >
                    <TrashIcon className="w-4 h-4" />
                    ล้างประวัติ
                </button>
            </div>
            <ul className="space-y-3 max-h-60 overflow-y-auto pr-2">
                {history.map((entry, index) => (
                    <li key={index} className="flex justify-between items-center bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                        <p className="font-bold text-lg text-sky-600 dark:text-sky-400">{Math.round(entry.value).toLocaleString()} kcal</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{new Date(entry.date).toLocaleDateString('th-TH')}</p>
                    </li>
                ))}
            </ul>
        </div>
      )}
      {showConfirmDialog && (
        <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 transition-opacity duration-300 animate-fade-in"
            onClick={cancelClearHistory}
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-dialog-title-tdee"
        >
            <div 
                className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xl max-w-sm w-full mx-4 transform transition-all duration-300 scale-95 animate-scale-in"
                onClick={(e) => e.stopPropagation()}
            >
                <h3 id="confirm-dialog-title-tdee" className="text-xl font-bold text-gray-800 dark:text-white">ยืนยันการล้างประวัติ</h3>
                <p className="mt-2 text-gray-600 dark:text-gray-300">
                    คุณแน่ใจหรือไม่ว่าต้องการล้างประวัติการคำนวณทั้งหมด?
                </p>
                <div className="mt-6 flex justify-end gap-3">
                    <button
                        onClick={cancelClearHistory}
                        className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-semibold rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 transition-colors"
                    >
                        ยกเลิก
                    </button>
                    <button
                        onClick={confirmClearHistory}
                        className="px-4 py-2 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                    >
                        ยืนยัน
                    </button>
                </div>
            </div>
        </div>
      )}
    </>
  );
};

export default TDEECalculator;
