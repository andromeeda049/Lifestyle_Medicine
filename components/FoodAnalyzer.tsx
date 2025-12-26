
import React, { useState, useRef, useContext } from 'react';
import { analyzeFoodFromImage, analyzeFoodFromText, getLocalFoodSuggestions } from '../services/geminiService';
import { NutrientInfo, FoodHistoryEntry, LocalFoodSuggestion } from '../types';
import { ShareIcon, CameraIcon, XCircleIcon, TrashIcon, EyeIcon, ChatBubbleLeftEllipsisIcon, MapPinIcon } from './icons';
import { AppContext } from '../context/AppContext';
import { XP_VALUES, PILLAR_LABELS } from '../constants';

const fileToGenerativePart = async (file: File) => {
  const base64EncodedDataPromise = new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result.split(',')[1]);
      }
    };
    reader.readAsDataURL(file);
  });
  return {
    base64: await base64EncodedDataPromise,
    mimeType: file.type
  };
};

const FoodAnalyzer: React.FC = () => {
  const [mode, setMode] = useState<'image' | 'text' | 'location'>('image');
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [inputText, setInputText] = useState<string>('');
  const [suggestions, setSuggestions] = useState<LocalFoodSuggestion[] | null>(null);
  const [result, setResult] = useState<NutrientInfo | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { setLatestFoodAnalysis, foodHistory, setFoodHistory, clearFoodHistory, currentUser, gainXP, userProfile } = useContext(AppContext);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageAnalyze = async () => {
    if (!image || currentUser?.role === 'guest') return;
    setLoading(true); setError(null); setResult(null);
    try {
      const { base64, mimeType } = await fileToGenerativePart(image);
      const res = await analyzeFoodFromImage(base64, mimeType, userProfile.aiSystemInstruction);
      setResult(res); saveResultToHistory(res);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTextAnalyze = async () => {
    if (!inputText.trim() || currentUser?.role === 'guest') return;
    setLoading(true); setError(null); setResult(null);
    try {
        const res = await analyzeFoodFromText(inputText, userProfile.aiSystemInstruction);
        setResult(res); saveResultToHistory(res);
    } catch (err: any) {
        setError(err.message);
    } finally {
        setLoading(false);
    }
  };

  const handleLocationAnalyze = () => {
    if (currentUser?.role === 'guest') return;
    setLoading(true); setSuggestions(null);
    navigator.geolocation.getCurrentPosition(
        async (pos) => {
            try {
                const res = await getLocalFoodSuggestions(pos.coords.latitude, pos.coords.longitude);
                setSuggestions(res);
            } catch (err: any) { setError(err.message); }
            finally { setLoading(false); }
        },
        () => { setError("ไม่สามารถเข้าถึงตำแหน่งได้"); setLoading(false); }
    );
  };
  
  const saveResultToHistory = (res: NutrientInfo) => {
    setLatestFoodAnalysis(res);
    const newEntry: FoodHistoryEntry = { id: new Date().toISOString(), date: new Date().toISOString(), analysis: res };
    setFoodHistory(prev => [newEntry, ...prev].slice(0, 15));
    // Use 'FOOD' category for AI scan
    gainXP(XP_VALUES.FOOD, 'FOOD');
  };

  const getPillarLabel = (key: string) => {
      if (key === 'physicalActivity') return PILLAR_LABELS.activity;
      if (key === 'substance') return 'สารเสพติด/ความเสี่ยง'; // Short version
      return PILLAR_LABELS[key as keyof typeof PILLAR_LABELS] || key;
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg w-full">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4 text-center">วิเคราะห์อาหาร & 6 เสาหลักสุขภาพ</h2>
        
        <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
            {(['image', 'text', 'location'] as const).map(m => (
                <button key={m} onClick={() => setMode(m)} className={`flex-1 py-3 text-sm font-semibold ${mode === m ? 'border-b-2 border-purple-500 text-purple-600' : 'text-gray-500'}`}>
                    {m === 'image' ? 'จากภาพ' : m === 'text' ? 'จากข้อความ' : 'ท้องถิ่น'}
                </button>
            ))}
        </div>

        {mode === 'image' && (
             <div className="flex flex-col gap-4 animate-fade-in">
                <div className="w-full h-64 border-2 border-dashed rounded-lg flex items-center justify-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50" onClick={() => fileInputRef.current?.click()}>
                    {preview ? <img src={preview} alt="preview" className="h-full w-full object-cover rounded-lg" /> : <p className="text-gray-400">คลิกเพื่ออัปโหลดรูปภาพ</p>}
                </div>
                <input type="file" accept="image/*" ref={fileInputRef} onChange={(e) => { const f = e.target.files?.[0]; if(f){setImage(f); setPreview(URL.createObjectURL(f)); setResult(null); setError(null);} }} className="hidden" />
                <button onClick={handleImageAnalyze} disabled={!image || loading} className="w-full bg-purple-500 text-white font-bold py-3 rounded-lg hover:bg-purple-600 disabled:bg-gray-400">
                    {loading ? 'กำลังวิเคราะห์...' : 'เริ่มวิเคราะห์'}
                </button>
            </div>
        )}

        {mode === 'text' && (
            <div className="flex flex-col gap-4 animate-fade-in">
                <textarea value={inputText} onChange={(e) => setInputText(e.target.value)} placeholder="เช่น กะเพราไก่ไข่ดาว ไม่ใส่น้ำตาล..." className="w-full h-32 p-4 border rounded-lg dark:bg-gray-700 focus:ring-2 focus:ring-purple-500" />
                <button onClick={handleTextAnalyze} disabled={!inputText.trim() || loading} className="w-full bg-purple-500 text-white font-bold py-3 rounded-lg hover:bg-purple-600 disabled:bg-gray-400">
                    {loading ? 'กำลังวิเคราะห์...' : 'เริ่มวิเคราะห์'}
                </button>
            </div>
        )}

        {mode === 'location' && (
            <div className="text-center animate-fade-in">
                <p className="text-gray-600 dark:text-gray-300 mb-4">AI จะแนะนำเมนูท้องถิ่นสุขภาพดีตามพิกัดของคุณ</p>
                <button onClick={handleLocationAnalyze} disabled={loading} className="w-full bg-purple-500 text-white font-bold py-3 rounded-lg hover:bg-purple-600 disabled:bg-gray-400">
                    {loading ? 'กำลังค้นหา...' : 'แนะนำเมนูใกล้ฉัน'}
                </button>
            </div>
        )}
        
        {result && (
            <div className="mt-8 p-4 bg-gray-50 dark:bg-gray-700 rounded-xl animate-fade-in">
                <p className="text-xl font-bold text-center mb-2">{result.description}</p>
                <p className="text-center text-purple-600 font-bold text-2xl mb-4">{result.calories} kcal</p>
                
                {result.healthImpact && (
                    <div className="mb-4 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-100 dark:border-purple-800">
                        <p className="text-sm text-purple-800 dark:text-purple-200">{result.healthImpact}</p>
                    </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                    {result.lifestyleAnalysis && Object.entries(result.lifestyleAnalysis).filter(([k]) => k !== 'overallRisk').map(([key, val]) => (
                        <div key={key} className="p-3 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                            <p className="text-xs text-teal-600 dark:text-teal-400 font-bold uppercase mb-1">
                                {getPillarLabel(key)}
                            </p>
                            <p className="text-sm text-gray-700 dark:text-gray-300 leading-snug">{val as string}</p>
                        </div>
                    ))}
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default FoodAnalyzer;
