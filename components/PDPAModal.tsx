
import React, { useState } from 'react';
import { ClipboardDocumentCheckIcon, XIcon } from './icons';

interface PDPAModalProps {
    onAccept: () => void;
    onRevoke?: () => void;
    isSettingsMode?: boolean;
    onClose?: () => void;
}

const PDPAModal: React.FC<PDPAModalProps> = ({ onAccept, onRevoke, isSettingsMode = false, onClose }) => {
    const [checkedTerms, setCheckedTerms] = useState(isSettingsMode);
    const [checkedResearch, setCheckedResearch] = useState(isSettingsMode);

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
            <div className="bg-white dark:bg-gray-800 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] relative">
                
                {/* Close Button for Settings Mode */}
                {isSettingsMode && onClose && (
                    <button 
                        onClick={onClose} 
                        className="absolute top-4 right-4 text-white hover:text-gray-200 z-10 bg-black/20 rounded-full p-1 transition-colors"
                    >
                        <XIcon className="w-5 h-5" />
                    </button>
                )}

                {/* Header */}
                <div className="bg-teal-600 p-6 text-white text-center">
                    <div className="flex justify-center mb-3">
                        <div className="bg-white/20 p-3 rounded-full">
                            <ClipboardDocumentCheckIcon className="w-8 h-8" />
                        </div>
                    </div>
                    <h2 className="text-xl font-bold">ข้อตกลงการใช้งานและการคุ้มครองข้อมูลส่วนบุคคล (PDPA)</h2>
                </div>

                {/* Content - Scrollable */}
                <div className="p-6 overflow-y-auto text-gray-700 dark:text-gray-300 text-sm leading-relaxed space-y-4">
                    <p>
                        ยินดีต้อนรับสู่ <strong>Satun Smart Life (ชีวิตดี ที่สตูล)</strong> เพื่อให้การใช้งานเป็นไปตามพระราชบัญญัติคุ้มครองข้อมูลส่วนบุคคล (PDPA) และหลักจริยธรรมการวิจัย กรุณาอ่านและทำความเข้าใจข้อตกลงดังนี้:
                    </p>

                    <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                        <h3 className="font-bold text-gray-900 dark:text-white mb-2">1. การเก็บรวบรวมข้อมูล</h3>
                        <ul className="list-disc pl-5 space-y-1">
                            <li><strong>ข้อมูลทั่วไป:</strong> เพศ, อายุ, น้ำหนัก, ส่วนสูง (เพื่อคำนวณค่าทางสุขภาพ)</li>
                            <li><strong>ข้อมูลพฤติกรรม:</strong> การกิน, การนอน, อารมณ์, กิจกรรมทางกาย</li>
                            <li><strong>ข้อมูลอ่อนไหว (Sensitive Data):</strong> ข้อมูลสุขภาพและโรคประจำตัว (เพื่อประเมินความเสี่ยง NCDs)</li>
                        </ul>
                    </div>

                    <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                        <h3 className="font-bold text-gray-900 dark:text-white mb-2">2. วัตถุประสงค์การใช้ข้อมูล (Research Purpose)</h3>
                        <ul className="list-disc pl-5 space-y-1">
                            <li>เพื่อประมวลผลและให้คำแนะนำสุขภาพเฉพาะบุคคล (Personalized Recommendation)</li>
                            <li>เพื่อใช้ในการศึกษาวิจัยและพัฒนาด้านสาธารณสุข โดยข้อมูลจะถูกนำเสนอในภาพรวม (Aggregate Data) ไม่ระบุตัวตน</li>
                            <li>เพื่อติดตามผลลัพธ์ทางสุขภาพ (Health Outcome) ของกลุ่มตัวอย่าง</li>
                        </ul>
                    </div>

                    <p className="text-xs text-gray-500">
                        *ท่านสามารถยกเลิกความยินยอมได้ภายหลัง โดยติดต่อผู้ดูแลระบบหรือลบการติดตั้งแอปพลิเคชัน หรือกดปุ่ม "ยกเลิกความยินยอม" ด้านล่าง
                    </p>
                </div>

                {/* Footer - Actions */}
                <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                    <div className="space-y-3 mb-6">
                        <label className="flex items-start gap-3 cursor-pointer">
                            <input 
                                type="checkbox" 
                                className="mt-1 w-5 h-5 text-teal-600 rounded focus:ring-teal-500 border-gray-300"
                                checked={checkedTerms}
                                onChange={(e) => setCheckedTerms(e.target.checked)}
                                disabled={isSettingsMode}
                            />
                            <span className="text-sm">ข้าพเจ้าได้อ่านและเข้าใจเงื่อนไขการใช้งาน และยอมรับให้เก็บรวบรวมข้อมูลตามวัตถุประสงค์ข้างต้น</span>
                        </label>
                        
                        <label className="flex items-start gap-3 cursor-pointer">
                            <input 
                                type="checkbox" 
                                className="mt-1 w-5 h-5 text-teal-600 rounded focus:ring-teal-500 border-gray-300"
                                checked={checkedResearch}
                                onChange={(e) => setCheckedResearch(e.target.checked)}
                                disabled={isSettingsMode}
                            />
                            <span className="text-sm">ข้าพเจ้ายินยอมให้ใช้ข้อมูลสุขภาพเพื่อการศึกษาวิจัยและพัฒนา (Research Consent)</span>
                        </label>
                    </div>

                    <button
                        onClick={onAccept}
                        disabled={!checkedTerms || !checkedResearch}
                        className="w-full py-3 bg-teal-600 text-white font-bold rounded-xl shadow-lg hover:bg-teal-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all transform active:scale-95"
                    >
                        {isSettingsMode ? 'ปิดหน้าต่าง' : 'ยอมรับและเริ่มต้นใช้งาน'}
                    </button>

                    {isSettingsMode && onRevoke && (
                        <button
                            onClick={onRevoke}
                            className="w-full mt-3 py-3 bg-transparent border border-red-500 text-red-500 font-bold rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-all active:scale-95"
                        >
                            ยกเลิกความยินยอม (Revoke Consent)
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PDPAModal;
