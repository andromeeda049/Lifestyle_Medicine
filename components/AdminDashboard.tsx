import React, { useState, useEffect, useContext, useMemo } from 'react';
import { AppContext } from '../context/AppContext';
import { fetchAllAdminDataFromSheet, AllAdminData } from '../services/googleSheetService';

const ADMIN_KEY = "ADMIN1234!"; // Must match the key in Code.gs

const Spinner: React.FC = () => (
    <div className="flex flex-col items-center justify-center gap-4 py-16">
        <div className="w-12 h-12 border-4 border-t-red-500 border-gray-200 dark:border-gray-600 rounded-full animate-spin"></div>
        <p className="text-red-600 dark:text-red-400 font-medium">กำลังดึงข้อมูลผู้ใช้ทั้งหมด...</p>
    </div>
);

const DataTable: React.FC<{ data: any[], title: string }> = ({ data, title }) => {
    if (!data || data.length === 0) {
        return <p className="text-gray-500 dark:text-gray-400">ไม่มีข้อมูลในส่วน {title}</p>;
    }

    const headers = Object.keys(data[0]);

    const renderCellContent = (header: string, value: any) => {
        if (header === 'profilePicture') {
            if (String(value).startsWith('data:image/')) {
                return <img src={String(value)} alt="Profile" className="w-10 h-10 rounded-full object-cover" />;
            }
            return <span className="text-2xl">{String(value)}</span>;
        }

        if (header === 'timestamp' || header === 'lastSeen') {
            const date = new Date(value);
             if (!isNaN(date.getTime())) {
                return date.toLocaleString('th-TH', {
                    year: 'numeric', month: 'short', day: 'numeric', 
                    hour: '2-digit', minute: '2-digit'
                });
            }
        }
        
        if (typeof value === 'object' && value !== null) {
             return JSON.stringify(value).substring(0, 30) + '...';
        }

        const stringValue = String(value);
        return stringValue.length > 50 ? stringValue.substring(0, 50) + '...' : stringValue;
    };


    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-300">
                    <tr>
                        {headers.map(header => (
                            <th key={header} scope="col" className="px-6 py-3">{header}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {data.map((row, index) => (
                        <tr key={index} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                            {headers.map(header => (
                                <td key={`${header}-${index}`} className="px-6 py-4 align-middle">
                                    {renderCellContent(header, row[header])}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

const AdminDashboard: React.FC = () => {
    const { scriptUrl } = useContext(AppContext);
    const [allData, setAllData] = useState<AllAdminData | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'allUsers' | 'profiles' | 'bmi' | 'tdee' | 'food' | 'planner' | 'loginLogs'>('allUsers');

    useEffect(() => {
        const fetchData = async () => {
            if (!scriptUrl) {
                setError("กรุณาตั้งค่า Web App URL ในหน้า Settings ก่อน");
                setLoading(false);
                return;
            }
            setLoading(true);
            setError(null);
            try {
                const data = await fetchAllAdminDataFromSheet(scriptUrl, ADMIN_KEY);
                if (data) {
                    setAllData(data);
                } else {
                    setError("ไม่สามารถดึงข้อมูลได้ อาจเป็นเพราะ Admin Key หรือ URL ไม่ถูกต้อง หรือยังไม่มีข้อมูลในชีต");
                }
            } catch (err: any) {
                setError(err.message || "เกิดข้อผิดพลาดที่ไม่คาดคิด");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [scriptUrl]);
    
    const userSummary = useMemo(() => (allData?.profiles || []).map(p => ({
        username: p.username,
        displayName: p.displayName,
        profilePicture: p.profilePicture,
        role: p.role || 'user',
        gender: p.gender,
        age: p.age,
        weight: p.weight,
        height: p.height
    })), [allData]);

    const allUsersSummary = useMemo(() => {
        if (!allData?.loginLogs) return [];
        
        const userMap = new Map();
        
        const sortedLogs = [...allData.loginLogs].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

        for (const log of sortedLogs) {
            if (!userMap.has(log.username)) {
                userMap.set(log.username, {
                    username: log.username,
                    displayName: log.displayName,
                    role: log.role,
                    lastSeen: log.timestamp,
                });
            }
        }
        
        return Array.from(userMap.values());
    }, [allData]);

    const tabs = [
        { id: 'allUsers', label: 'ผู้ใช้งานทั้งหมด', data: allUsersSummary },
        { id: 'profiles', label: 'Profiles', data: userSummary },
        { id: 'bmi', label: 'BMI History', data: allData?.bmiHistory },
        { id: 'tdee', label: 'TDEE History', data: allData?.tdeeHistory },
        { id: 'food', label: 'Food History', data: allData?.foodHistory },
        { id: 'planner', label: 'Planner History', data: allData?.plannerHistory },
        { id: 'loginLogs', label: 'Login Logs', data: allData?.loginLogs },
    ];

    const renderContent = () => {
        if (loading) return <Spinner />;
        if (error) return <p className="text-center text-red-500 bg-red-100 dark:bg-red-900/50 dark:text-red-400 p-4 rounded-lg">{error}</p>;
        if (!allData) return <p className="text-center text-gray-500">ไม่มีข้อมูล</p>;

        const activeTabData = tabs.find(t => t.id === activeTab);

        return <DataTable data={activeTabData?.data || []} title={activeTabData?.label || ''} />;
    };

    return (
        <div className="bg-white dark:bg-gray-800 p-6 md:p-8 rounded-2xl shadow-lg w-full transform transition-all duration-300">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6 text-center">Admin Dashboard - จัดการผู้ใช้</h2>
            
            <div className="border-b border-gray-200 dark:border-gray-700 mb-4">
                <nav className="-mb-px flex space-x-6 overflow-x-auto" aria-label="Tabs">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`${
                                activeTab === tab.id
                                    ? 'border-red-500 text-red-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:border-gray-600'
                            } whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors`}
                        >
                            {tab.label} ({tab.data?.length || 0})
                        </button>
                    ))}
                </nav>
            </div>

            <div className="mt-4">
                {renderContent()}
            </div>
        </div>
    );
};

export default AdminDashboard;