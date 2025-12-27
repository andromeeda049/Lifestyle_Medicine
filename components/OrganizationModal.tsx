
import React, { useState } from 'react';
import { UserGroupIcon } from './icons';
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
                    <p className="text-teal-100 text-sm mt-1">เพื่อให้เราดูแลคุณได้อย่างทั่วถึง</p>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                    <p className="text-gray-600 dark:text-gray-300 text-sm text-center">
                        ข้อมูลสุขภาพของคุณจะถูกรวบรวมเพื่อการดูแลสุขภาพในพื้นที่ <br/>กรุณาเลือกสังกัดหรือหน่วยงานที่คุณอาศัยหรือทำงานอยู่
                    </p>

                    <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                        {ORGANIZATIONS.map((org) => (
                            <label 
                                key={org.id} 
                                className={`flex items-center p-3 rounded-xl border-2 cursor-pointer transition-all ${
                                    selectedOrg === org.id 
                                    ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/20 shadow-md' 
                                    : 'border-gray-200 dark:border-gray-700 hover:border-teal-300 dark:hover:border-teal-700'
                                }`}
                            >
                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mr-3 ${selectedOrg === org.id ? 'border-teal-500' : 'border-gray-400'}`}>
                                    {selectedOrg === org.id && <div className="w-2.5 h-2.5 rounded-full bg-teal-500" />}
                                </div>
                                <input 
                                    type="radio" 
                                    name="organization" 
                                    value={org.id} 
                                    checked={selectedOrg === org.id}
                                    onChange={(e) => setSelectedOrg(e.target.value)}
                                    className="hidden"
                                />
                                <span className={`text-sm font-bold ${selectedOrg === org.id ? 'text-teal-700 dark:text-teal-300' : 'text-gray-700 dark:text-gray-200'}`}>
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
