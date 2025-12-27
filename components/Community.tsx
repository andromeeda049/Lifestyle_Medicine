
import React, { useEffect, useState, useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { fetchLeaderboard } from '../services/googleSheetService';
import { ExclamationTriangleIcon, ClipboardListIcon } from './icons';

const Community: React.FC = () => {
    const { scriptUrl, currentUser } = useContext(AppContext);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [debugData, setDebugData] = useState<any>(null);

    const checkConnection = async () => {
        setLoading(true);
        setError(null);
        setDebugData(null);
        
        try {
            if (!scriptUrl) throw new Error("ไม่พบ Google Script URL ในการตั้งค่า");

            // Pass the currentUser (if logged in) or it will default to a guest object in the service
            const data = await fetchLeaderboard(scriptUrl, currentUser || undefined);
            setDebugData(data);
        } catch (err: any) {
            setError(err.message || "Unknown Error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        checkConnection();
    }, [scriptUrl]);

    return (
        <div className="bg-white dark:bg-gray-800 p-6 md:p-8 rounded-2xl shadow-lg w-full animate-fade-in">
            <div className="text-center mb-6">
                <div className="flex justify-center mb-4">
                    <div className="bg-red-100 dark:bg-red-900/30 p-4 rounded-full">
                        <ExclamationTriangleIcon className="w-12 h-12 text-red-600 dark:text-red-400" />
                    </div>
                </div>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">System Error Monitor</h2>
                <p className="text-gray-600 dark:text-gray-300 mt-2">
                    หน้าจอแสดงผลข้อผิดพลาดจากการเชื่อมต่อฐานข้อมูล
                </p>
            </div>

            <div className="space-y-6">
                <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl border border-gray-200 dark:border-gray-600">
                    <h3 className="font-bold text-gray-700 dark:text-gray-200 mb-2">สถานะการเชื่อมต่อ:</h3>
                    {loading ? (
                        <div className="flex items-center text-blue-500">
                            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mr-2"></div>
                            กำลังตรวจสอบข้อมูล...
                        </div>
                    ) : error ? (
                        <div className="text-red-500 font-bold flex items-start gap-2">
                            <span className="text-xl">❌</span>
                            <span className="break-all">{error}</span>
                        </div>
                    ) : (
                        <div className="text-green-500 font-bold flex items-center gap-2">
                            <span>✅</span>
                            <span>เชื่อมต่อสำเร็จ (No Error Found)</span>
                        </div>
                    )}
                </div>

                {error && (
                    <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-xl border border-red-200 dark:border-red-800">
                        <h4 className="text-red-700 dark:text-red-300 font-bold mb-2">คำแนะนำในการแก้ไข:</h4>
                        <ul className="list-disc pl-5 text-sm text-red-600 dark:text-red-400 space-y-1">
                            <li>ตรวจสอบชื่อชีต <strong>LeaderboardView</strong> และ <strong>TrendingView</strong> ว่ามีอยู่จริง</li>
                            <li>หาก Error คือ <code>ScriptError</code> ให้ลอง Deploy New Version ใน Apps Script</li>
                            <li>ตรวจสอบว่าคอลัมน์ในชีต <code>Profile</code> ตรงกับสูตร Query หรือไม่</li>
                        </ul>
                    </div>
                )}

                <div className="bg-slate-900 text-slate-200 p-4 rounded-xl font-mono text-xs overflow-x-auto">
                    <div className="flex justify-between items-center mb-2 border-b border-slate-700 pb-2">
                        <span className="font-bold text-yellow-400">Raw Data Response</span>
                        <button onClick={checkConnection} className="bg-slate-700 hover:bg-slate-600 px-2 py-1 rounded text-[10px]">
                            Refresh
                        </button>
                    </div>
                    <pre>
                        {debugData ? JSON.stringify(debugData, null, 2) : (loading ? "Fetching..." : "No Data / Error")}
                    </pre>
                </div>
            </div>
        </div>
    );
};

export default Community;
