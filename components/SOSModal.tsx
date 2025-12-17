
import React from 'react';
import { PhoneIcon, XIcon, ExclamationTriangleIcon } from './icons';

interface SOSModalProps {
    onClose: () => void;
}

const SOSModal: React.FC<SOSModalProps> = ({ onClose }) => {
    const emergencyContacts = [
        { name: 'สถาบันการแพทย์ฉุกเฉิน (เจ็บป่วยฉุกเฉิน)', number: '1669', color: 'bg-red-600 hover:bg-red-700' },
        { name: 'สายด่วนสุขภาพจิต (กรมสุขภาพจิต)', number: '1323', color: 'bg-teal-600 hover:bg-teal-700' },
        { name: 'สายด่วนเลิกเหล้า/เลิกบุหรี่ (1413)', number: '1413', color: 'bg-orange-500 hover:bg-orange-600' },
    ];

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-red-900/80 backdrop-blur-sm animate-fade-in">
            <div className="bg-white dark:bg-gray-900 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border-4 border-red-500 relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 dark:text-gray-400">
                    <XIcon className="w-8 h-8" />
                </button>
                
                <div className="p-8 text-center">
                    <div className="bg-red-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
                        <ExclamationTriangleIcon className="w-12 h-12 text-red-600" />
                    </div>
                    <h2 className="text-2xl font-black text-red-600 dark:text-red-500 mb-2">SOS & Tele-Support</h2>
                    <p className="text-gray-600 dark:text-gray-300 mb-8">
                        หากคุณหรือคนใกล้ชิดกำลังเผชิญภาวะวิกฤตทางสุขภาพกายหรือใจ <br/>กรุณาติดต่อขอความช่วยเหลือทันที
                    </p>

                    <div className="space-y-4">
                        {emergencyContacts.map(contact => (
                            <a 
                                key={contact.number}
                                href={`tel:${contact.number}`}
                                className={`flex items-center justify-between p-4 rounded-xl text-white shadow-lg transition-transform transform active:scale-95 ${contact.color}`}
                            >
                                <span className="font-bold text-lg">{contact.name}</span>
                                <div className="flex items-center gap-2 bg-white/20 px-3 py-1 rounded-lg">
                                    <PhoneIcon className="w-5 h-5" />
                                    <span className="font-mono text-xl">{contact.number}</span>
                                </div>
                            </a>
                        ))}
                    </div>
                    
                    <p className="text-xs text-gray-400 mt-6">
                        *การกดปุ่มจะโทรออกไปยังเบอร์ดังกล่าวทันที (บนมือถือ)
                    </p>
                </div>
            </div>
        </div>
    );
};

export default SOSModal;
