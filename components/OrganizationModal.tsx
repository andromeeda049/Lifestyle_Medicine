
import React, { useState } from 'react';
import { UserGroupIcon,  } from './icons';
import { ORGANIZATIONS } from '../constants';

interface OrganizationModalProps {
    onSelect: (orgId: string) => void;
}

const OrganizationModal: React.FC<OrganizationModalProps> = ({ onSelect }) => {
    const [selectedOrg, setSelectedOrg] = useState<string>('');

    const handleSubmit = () => {
        if (selectedOrg) {
            onSelect(selectedOrg);
        }
    };

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
            <div className="bg-white dark:bg-gray-800 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col relative animate-bounce-in">
                
                {/* Header */}
                <div className="bg-gradient-to-r from-teal-600 to-emerald-600 p-6 text-white text-center">
                    <div className="flex justify-center mb-3">
                        <div className="bg-white/20 p-3 rounded-full">
                            <UserGroupIcon className="w-8 h-8" />
                        </div>
                    </div>
                    <h2 className="text-xl font-bold">กรุณาระบุหน่วยงานของคุณ</h2>
                    <p className="text-teal-100 text-sm mt-1">Please select your organization</p>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                    <p className="text-gray-600 dark:text-gray-300 text-sm text-center">
                        เพื่อให้ข้อมูลสุขภาพของคุณถูกส่งไปยังเจ้าหน้าที่ที่ดูแลพื้นที่ได้อย่างถูกต้อง กรุณาเลือกสังกัดหรือหน่วยงานของคุณ
                    </p>

                    <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                        {ORGANIZATIONS.map((org) => (
                            <label 
                                key={org.id} 
                                className={`flex items-center p-3 rounded-xl border-2 cursor-pointer transition-all ${
                                    selectedOrg === org.id 
                                    ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/20' 
                                    : 'border-gray-200 dark:border-gray-700 hover:border-teal-300'
                                }`}
                            >
                                <input 
                                    type="radio" 
                                    name="organization" 
                                    value={org.id} 
                                    checked={selectedOrg === org.id}
                                    onChange={(e) => setSelectedOrg(e.target.value)}
                                    className="w-5 h-5 text-teal-600 focus:ring-teal-500 border-gray-300"
                                />
                                <span className="ml-3 text-sm font-bold text-gray-700 dark:text-gray-200">
                                    {org.name}
                                </span>
                            </label>
                        ))}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                    <button
                        onClick={handleSubmit}
                        disabled={!selectedOrg}
                        className="w-full py-3 bg-teal-600 text-white font-bold rounded-xl shadow-lg hover:bg-teal-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all transform active:scale-95"
                    >
                        บันทึกและเริ่มต้นใช้งาน
                    </button>
                </div>
            </div>
        </div>
    );
};

export default OrganizationModal;
