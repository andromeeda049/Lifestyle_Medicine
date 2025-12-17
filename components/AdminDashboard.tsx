
import React, { useState, useEffect, useContext, useMemo } from 'react';
import { AppContext } from '../context/AppContext';
import { fetchAllAdminDataFromSheet, AllAdminData } from '../services/googleSheetService';
import { OUTCOME_QUESTIONS, SATISFACTION_QUESTIONS, ORGANIZATIONS, PILLAR_LABELS } from '../constants';
import { ChartBarIcon, UserGroupIcon, FireIcon, ClipboardCheckIcon, UserCircleIcon, PrinterIcon, BeakerIcon, WaterDropIcon, BoltIcon, HeartIcon } from './icons';

const ADMIN_KEY = "ADMIN1234!"; 

const Spinner: React.FC = () => (
    <div className="flex flex-col items-center justify-center gap-4 py-16">
        <div className="w-12 h-12 border-4 border-t-red-500 border-gray-200 dark:border-gray-600 rounded-full animate-spin"></div>
        <p className="text-red-600 dark:text-red-400 font-medium">กำลังดึงข้อมูลวิจัยเชิงลึก...</p>
    </div>
);

const StatCard: React.FC<{ title: string; value: number | string; label: string; icon: React.ReactNode; color: string }> = ({ title, value, label, icon, color }) => (
    <div className={`bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border-l-4 ${color} flex items-center justify-between transition-transform hover:scale-105`}>
        <div>
            <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">{title}</p>
            <h3 className="text-3xl font-bold text-gray-800 dark:text-white my-1">{value}</h3>
            <p className="text-xs text-gray-400">{label}</p>
        </div>
        <div className={`p-3 rounded-full bg-opacity-20 ${color.replace('border-', 'bg-').replace('-500', '-100')} text-opacity-100 ${color.replace('border-', 'text-')}`}>
            {icon}
        </div>
    </div>
);

const AdherenceCard: React.FC<{ title: string; percent: number; count: number; total: number; icon: React.ReactNode; color: string; desc: string }> = ({ title, percent, count, total, icon, color, desc }) => (
    <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex justify-between items-start mb-2">
            <div className="flex items-center gap-2">
                <div className={`p-2 rounded-lg ${color.replace('text-', 'bg-').replace('-600', '-100')} ${color}`}>
                    {icon}
                </div>
                <h4 className="font-bold text-gray-700 dark:text-gray-200">{title}</h4>
            </div>
            <span className={`text-2xl font-bold ${color}`}>{percent.toFixed(1)}%</span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mb-2">
            <div className={`h-2.5 rounded-full ${color.replace('text-', 'bg-')}`} style={{ width: `${percent}%` }}></div>
        </div>
        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>{desc}</span>
            <span>{count} / {total} วัน (ที่มีการบันทึก)</span>
        </div>
    </div>
);

// Function to convert array of objects to CSV string
const convertToCSV = (objArray: any[]) => {
    const array = typeof objArray !== 'object' ? JSON.parse(objArray) : objArray;
    let str = '';
    
    // Header
    let headers = Object.keys(array[0]).join(',') + '\r\n';
    str += headers;

    // Rows
    for (let i = 0; i < array.length; i++) {
        let line = '';
        for (let index in array[i]) {
            if (line !== '') line += ',';
            let val = array[i][index];
            if (typeof val === 'string') {
                val = val.replace(/"/g, '""'); 
                line += `"${val}"`;
            } else if (typeof val === 'object') {
                 line += `"${JSON.stringify(val).replace(/"/g, '""')}"`;
            } else {
                line += val;
            }
        }
        str += line + '\r\n';
    }
    return str;
};

const DataTable: React.FC<{ data: any[], title: string, allowExport?: boolean }> = ({ data, title, allowExport }) => {
    if (!data || data.length === 0) {
        return <p className="text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg text-center">ไม่มีข้อมูลในส่วน {title}</p>;
    }

    const headers = Object.keys(data[0]);

    const handleExport = () => {
        const csv = convertToCSV(data);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `${title}_export_${new Date().toISOString().slice(0,10)}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const renderCellContent = (header: string, value: any) => {
        if (header === 'profilePicture') {
            if (String(value).startsWith('data:image/')) {
                return <img src={String(value)} alt="Profile" className="w-10 h-10 rounded-full object-cover border border-gray-200" />;
            }
            return <span className="text-2xl">{String(value)}</span>;
        }

        if (header === 'timestamp' || header === 'lastSeen' || header === 'date') {
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
        <div>
            {allowExport && (
                <div className="flex justify-end mb-2">
                    <button 
                        onClick={handleExport}
                        className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-teal-700 bg-teal-100 hover:bg-teal-200 rounded-md transition-colors"
                    >
                        <PrinterIcon className="w-4 h-4" />
                        Export CSV (สำหรับงานวิจัย)
                    </button>
                </div>
            )}
            <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-100 dark:bg-gray-700 dark:text-gray-300">
                        <tr>
                            {headers.map(header => (
                                <th key={header} scope="col" className="px-6 py-3 whitespace-nowrap">{header}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((row, index) => (
                            <tr key={index} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors">
                                {headers.map(header => (
                                    <td key={`${header}-${index}`} className="px-6 py-4 align-middle whitespace-nowrap">
                                        {renderCellContent(header, row[header])}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const EvaluationStats: React.FC<{ data: any[] }> = ({ data }) => {
    if (!data || data.length === 0) return <p className="text-center text-gray-500 bg-gray-50 dark:bg-gray-700/50 p-6 rounded-lg">ยังไม่มีข้อมูลการประเมินสำหรับหน่วยงานนี้</p>;

    let totalEntries = data.length;
    let satisfactionSums: { [key: string]: number } = {};
    let outcomeCounts: { [key: string]: { improved: number, total: number } } = {};

    SATISFACTION_QUESTIONS.forEach(q => satisfactionSums[q.id] = 0);
    OUTCOME_QUESTIONS.forEach(q => outcomeCounts[q.id] = { improved: 0, total: 0 });

    data.forEach(entry => {
        let sat, out;
        try {
             sat = typeof entry.satisfaction_json === 'string' ? JSON.parse(entry.satisfaction_json) : entry.satisfaction_json;
             out = typeof entry.outcome_json === 'string' ? JSON.parse(entry.outcome_json) : entry.outcome_json;
        } catch(e) { console.error("Parse error", e); return; }
        
        if (sat) {
            Object.keys(sat).forEach(key => {
                if (satisfactionSums[key] !== undefined) satisfactionSums[key] += Number(sat[key]);
            });
        }
        if (out) {
            Object.keys(out).forEach(key => {
                if (outcomeCounts[key] !== undefined) {
                    outcomeCounts[key].total++;
                    if (out[key] === 'better' || out[key] === 'much_better') {
                        outcomeCounts[key].improved++;
                    }
                }
            });
        }
    });

    return (
        <div className="space-y-8 animate-fade-in">
             <div className="bg-white dark:bg-gray-700 p-6 rounded-xl shadow-md">
                <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                    <ChartBarIcon className="w-6 h-6 text-indigo-500" />
                    ความพึงพอใจของผู้ใช้งาน (User Satisfaction)
                </h3>
                <p className="text-sm text-gray-500 mb-4">คะแนนเฉลี่ย (เต็ม 5) จากผู้ใช้งาน {totalEntries} คน</p>
                <div className="space-y-4">
                    {SATISFACTION_QUESTIONS.map(q => {
                        const avg = (satisfactionSums[q.id] / totalEntries) || 0;
                        return (
                            <div key={q.id}>
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="text-gray-700 dark:text-gray-300">{q.label}</span>
                                    <span className="font-bold text-indigo-600 dark:text-indigo-400">{avg.toFixed(2)}/5</span>
                                </div>
                                <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2.5">
                                    <div className="bg-indigo-500 h-2.5 rounded-full" style={{ width: `${(avg/5)*100}%` }}></div>
                                </div>
                            </div>
                        );
                    })}
                </div>
             </div>

             <div className="bg-white dark:bg-gray-700 p-6 rounded-xl shadow-md">
                <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                    <ChartBarIcon className="w-6 h-6 text-green-500" />
                    ผลลัพธ์ทางสุขภาพ (Health Outcome Impact)
                </h3>
                <p className="text-sm text-gray-500 mb-4">สัดส่วนผู้ใช้งานที่รายงานว่า "สุขภาพดีขึ้น" หลังจากใช้งานแอปพลิเคชัน (Effectiveness)</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {OUTCOME_QUESTIONS.map(q => {
                        const stats = outcomeCounts[q.id];
                        const percent = stats.total > 0 ? (stats.improved / stats.total) * 100 : 0;
                        return (
                             <div key={q.id} className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border-l-4 border-green-500">
                                 <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">{q.label}</h4>
                                 <div className="flex items-end gap-2">
                                     <span className="text-3xl font-bold text-green-600 dark:text-green-400">{percent.toFixed(0)}%</span>
                                     <span className="text-sm text-gray-500 mb-1">ดีขึ้น</span>
                                 </div>
                             </div>
                        );
                    })}
                </div>
             </div>
        </div>
    );
};

const AdminDashboard: React.FC = () => {
    const { scriptUrl, currentUser } = useContext(AppContext);
    const [allData, setAllData] = useState<AllAdminData | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'overview' | 'allUsers' | 'profiles' | 'bmi' | 'tdee' | 'food' | 'planner' | 'loginLogs' | 'evaluation'>('overview');
    const [selectedOrgFilter, setSelectedOrgFilter] = useState<string>('all'); 

    const isSuperAdmin = currentUser?.organization === 'all';
    const assignedOrg = currentUser?.organization || 'general';

    useEffect(() => {
        if (!isSuperAdmin) {
            setSelectedOrgFilter(assignedOrg);
        }
    }, [isSuperAdmin, assignedOrg]);

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
                    setError("ไม่สามารถดึงข้อมูลได้");
                }
            } catch (err: any) {
                setError(err.message || "เกิดข้อผิดพลาด");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [scriptUrl]);
    
    const userProfilesWithOrg = useMemo(() => {
        if (!allData?.profiles) return [];
        return allData.profiles.map(p => ({
            ...p,
            organization: p.organization || 'general' 
        }));
    }, [allData]);

    const filteredUsers = useMemo(() => {
        if (selectedOrgFilter === 'all') return userProfilesWithOrg;
        return userProfilesWithOrg.filter(u => u.organization === selectedOrgFilter);
    }, [userProfilesWithOrg, selectedOrgFilter]);

    const filteredUsernames = useMemo(() => {
        return new Set(filteredUsers.map(u => u.username));
    }, [filteredUsers]);

    const filterDataByOrg = (data: any[]) => {
        if (!data) return [];
        if (selectedOrgFilter === 'all') return data;
        return data.filter(item => filteredUsernames.has(item.username));
    };

    // --- Advanced Stats Calculations ---
    const stats = useMemo(() => {
        const totalUsers = filteredUsers.length;
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        
        // Active Users
        const activeUsernames = new Set(
            (allData?.loginLogs || [])
                .filter(log => new Date(log.timestamp) > oneWeekAgo)
                .map(log => log.username)
        );
        const activeCount = filteredUsers.filter(u => activeUsernames.has(u.username)).length;

        // Risk Group
        let highRiskCount = 0;
        const bmiMap = new Map(); 
        if (allData?.bmiHistory) {
            const sortedBmi = [...allData.bmiHistory].sort((a,b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
            sortedBmi.forEach(entry => {
                if (filteredUsernames.has(entry.username)) {
                    bmiMap.set(entry.username, entry.bmi);
                }
            });
        }
        bmiMap.forEach((bmi) => { if (bmi > 25) highRiskCount++; });

        const evalCount = filterDataByOrg(allData?.evaluationHistory || []).length;

        // --- Behavioral Adherence Logic ---
        
        // 1. Calorie Adherence
        // Group food logs by user & date, sum calories, compare to TDEE
        let totalFoodDays = 0;
        let successfulFoodDays = 0;
        const foodLogs = filterDataByOrg(allData?.calorieHistory || []);
        
        // Get TDEE map
        const userTDEE = new Map();
        filterDataByOrg(allData?.tdeeHistory || []).forEach(t => {
             // Simplification: Use latest TDEE for calc
             userTDEE.set(t.username, t.tdee || 2000);
        });

        const dailyCalories = new Map<string, number>(); // Key: "username_YYYY-MM-DD"
        foodLogs.forEach(log => {
            const dateKey = `${log.username}_${new Date(log.timestamp).toLocaleDateString()}`;
            const current = dailyCalories.get(dateKey) || 0;
            dailyCalories.set(dateKey, current + Number(log.calories));
        });

        dailyCalories.forEach((cal, key) => {
            const username = key.split('_')[0];
            const goal = userTDEE.get(username) || 2000;
            totalFoodDays++;
            // Allow +/- 10% variance as success
            if (cal >= goal * 0.8 && cal <= goal * 1.1) successfulFoodDays++;
        });

        // 2. Water Adherence (>= 2000ml or > 0 entries if strictly tracking habits)
        // For strict goal tracking, we need sum per day.
        let totalWaterDays = 0;
        let successfulWaterDays = 0;
        const waterLogs = filterDataByOrg(allData?.waterHistory || []);
        const dailyWater = new Map<string, number>();
        waterLogs.forEach(log => {
            const dateKey = `${log.username}_${new Date(log.timestamp).toLocaleDateString()}`;
            const current = dailyWater.get(dateKey) || 0;
            dailyWater.set(dateKey, current + Number(log.amount));
        });
        dailyWater.forEach((amount) => {
            totalWaterDays++;
            if (amount >= 2000) successfulWaterDays++;
        });

        // 3. Activity Adherence
        const activityLogs = filterDataByOrg(allData?.activityHistory || []);
        const dailyActivity = new Set<string>();
        activityLogs.forEach(log => {
             dailyActivity.add(`${log.username}_${new Date(log.timestamp).toLocaleDateString()}`);
        });
        const activeDaysCount = dailyActivity.size;

        return { 
            totalUsers, activeCount, highRiskCount, evalCount,
            adherence: {
                nutrition: totalFoodDays > 0 ? (successfulFoodDays / totalFoodDays) * 100 : 0,
                nutritionCount: successfulFoodDays,
                nutritionTotal: totalFoodDays,
                water: totalWaterDays > 0 ? (successfulWaterDays / totalWaterDays) * 100 : 0,
                waterCount: successfulWaterDays,
                waterTotal: totalWaterDays,
                activityCount: activeDaysCount
            }
        };
    }, [filteredUsers, allData, filteredUsernames]);

    // --- Pillar Aggregation ---
    const pillarStats = useMemo(() => {
        const scores: any = { nutrition: 0, activity: 0, sleep: 0, stress: 0, substance: 0, social: 0 };
        let count = 0;

        filteredUsers.forEach(user => {
            let userScores = user.pillarScores;
            // Parse if string (legacy data protection)
            if (typeof userScores === 'string') {
                try { userScores = JSON.parse(userScores); } catch(e) {}
            }
            
            if (userScores) {
                count++;
                Object.keys(scores).forEach(key => {
                    scores[key] += (userScores[key] || 0);
                });
            }
        });

        const averages = Object.keys(scores).map(key => ({
            key,
            label: PILLAR_LABELS[key as keyof typeof PILLAR_LABELS],
            value: count > 0 ? (scores[key] / count) : 0
        }));

        return { averages, count };
    }, [filteredUsers]);


    const allUsersSummary = useMemo(() => {
        if (!allData?.loginLogs) return [];
        const userMap = new Map();
        const sortedLogs = [...allData.loginLogs].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

        for (const log of sortedLogs) {
            const profile = userProfilesWithOrg.find(p => p.username === log.username);
            const userOrg = profile ? profile.organization : 'general';
            if (!userMap.has(log.username)) {
                if (selectedOrgFilter === 'all' || userOrg === selectedOrgFilter) {
                    userMap.set(log.username, {
                        username: log.username,
                        displayName: log.displayName,
                        role: log.role,
                        lastSeen: log.timestamp,
                        organization: userOrg
                    });
                }
            }
        }
        return Array.from(userMap.values());
    }, [allData, userProfilesWithOrg, selectedOrgFilter]);

    const tabs = [
        { id: 'overview', label: 'ภาพรวมวิชาการ (Overview)', data: [] },
        { id: 'allUsers', label: 'สมาชิก', data: allUsersSummary },
        { id: 'evaluation', label: 'แบบประเมิน (Outcome)', data: filterDataByOrg(allData?.evaluationHistory || []) },
        { id: 'profiles', label: 'Profiles Data', data: filteredUsers },
        { id: 'food', label: 'โภชนาการ Log', data: filterDataByOrg(allData?.foodHistory || []) },
        { id: 'bmi', label: 'BMI Log', data: filterDataByOrg(allData?.bmiHistory || []) },
    ];

    const renderContent = () => {
        if (loading) return <Spinner />;
        if (error) return <p className="text-center text-red-500 bg-red-100 dark:bg-red-900/50 dark:text-red-400 p-4 rounded-lg">{error}</p>;
        if (!allData) return <p className="text-center text-gray-500">ไม่มีข้อมูล</p>;

        if (activeTab === 'overview') {
            return (
                <div className="space-y-8 animate-fade-in">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <StatCard title="กลุ่มตัวอย่าง (n)" value={stats.totalUsers} label="ผู้ใช้งานในระบบ" icon={<UserGroupIcon className="w-6 h-6" />} color="border-blue-500" />
                        <StatCard title="กลุ่มเสี่ยง (NCDs Risk)" value={stats.highRiskCount} label="BMI > 25" icon={<FireIcon className="w-6 h-6" />} color="border-red-500" />
                        <StatCard title="Active Users" value={stats.activeCount} label="ใช้งานใน 7 วัน" icon={<UserCircleIcon className="w-6 h-6" />} color="border-green-500" />
                        <StatCard title="จำนวนแบบประเมิน" value={stats.evalCount} label="Responses" icon={<ClipboardCheckIcon className="w-6 h-6" />} color="border-purple-500" />
                    </div>

                    {/* Behavioral Adherence Section */}
                    <div>
                        <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4">ผลการปรับเปลี่ยนพฤติกรรม (Behavioral Adherence)</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <AdherenceCard 
                                title="กินตามเป้าหมาย (TDEE)" 
                                percent={stats.adherence.nutrition} 
                                count={stats.adherence.nutritionCount} 
                                total={stats.adherence.nutritionTotal}
                                icon={<BeakerIcon className="w-6 h-6 text-orange-600" />}
                                color="text-orange-600"
                                desc="พลังงาน ±10% ของเป้าหมาย"
                            />
                            <AdherenceCard 
                                title="ดื่มน้ำตามเป้าหมาย" 
                                percent={stats.adherence.water} 
                                count={stats.adherence.waterCount} 
                                total={stats.adherence.waterTotal}
                                icon={<WaterDropIcon className="w-6 h-6 text-blue-600" />}
                                color="text-blue-600"
                                desc="ดื่มครบ 2,000 มล./วัน"
                            />
                            <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col justify-between">
                                 <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="bg-yellow-100 p-2 rounded-lg"><BoltIcon className="w-6 h-6 text-yellow-600" /></div>
                                        <h4 className="font-bold text-gray-700 dark:text-gray-200">ความถี่กิจกรรมทางกาย</h4>
                                    </div>
                                    <p className="text-gray-500 text-sm">จำนวนวันที่มีการบันทึกการเผาผลาญพลังงานในระบบ</p>
                                 </div>
                                 <div className="mt-4">
                                     <span className="text-3xl font-bold text-yellow-600">{stats.adherence.activityCount}</span>
                                     <span className="text-sm text-gray-400 ml-2">วัน (สะสมรวม)</span>
                                 </div>
                            </div>
                        </div>
                    </div>

                    {/* 6 Pillars Overview */}
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
                        <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
                            <HeartIcon className="w-6 h-6 text-rose-500" />
                            ภาพรวมสุขภาพ 6 มิติ (Lifestyle Pillars Average)
                            <span className="text-sm font-normal text-gray-500">(จากผู้ประเมิน {pillarStats.count} คน)</span>
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                            {pillarStats.averages.map((item) => (
                                <div key={item.key}>
                                    <div className="flex justify-between mb-1">
                                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{item.label}</span>
                                        <span className="text-sm font-bold text-gray-900 dark:text-white">{item.value.toFixed(1)}/10</span>
                                    </div>
                                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                                        <div 
                                            className={`h-2.5 rounded-full ${item.value >= 7 ? 'bg-green-500' : item.value >= 5 ? 'bg-yellow-500' : 'bg-red-500'}`} 
                                            style={{ width: `${(item.value / 10) * 100}%` }}
                                        ></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            );
        }

        if (activeTab === 'evaluation') {
            return <EvaluationStats data={filterDataByOrg(allData.evaluationHistory || [])} />;
        }

        const activeTabData = tabs.find(t => t.id === activeTab);
        return <DataTable data={activeTabData?.data || []} title={activeTabData?.label || ''} allowExport={true} />;
    };

    const currentOrgName = ORGANIZATIONS.find(o => o.id === selectedOrgFilter)?.name || 'ทั้งหมด';

    return (
        <div className="bg-white dark:bg-gray-800 p-6 md:p-8 rounded-2xl shadow-lg w-full transform transition-all duration-300">
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <div className="text-center md:text-left">
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                        {isSuperAdmin ? 'Research Admin Dashboard' : `Dashboard: ${currentOrgName}`}
                    </h2>
                    <p className="text-gray-500 text-sm">ระบบติดตามและประเมินผลสำหรับงานวิชาการสาธารณสุข</p>
                </div>
                
                {isSuperAdmin && (
                    <select 
                        value={selectedOrgFilter} 
                        onChange={(e) => setSelectedOrgFilter(e.target.value)}
                        className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-red-500 text-sm"
                    >
                        <option value="all">-- แสดงข้อมูลทุกพื้นที่ (Research Mode) --</option>
                        {ORGANIZATIONS.map(org => (
                            <option key={org.id} value={org.id}>{org.name}</option>
                        ))}
                    </select>
                )}
            </div>

            <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
                <nav className="-mb-px flex space-x-6 overflow-x-auto pb-2" aria-label="Tabs">
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
                            {tab.label}
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
