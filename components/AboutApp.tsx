
import React, { useState } from 'react';
import { InformationCircleIcon, BookOpenIcon, ClipboardListIcon, CameraIcon, SparklesIcon, HeartIcon, ScaleIcon, FireIcon, BeakerIcon, BoltIcon } from './icons';

const AboutApp: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'innovation' | 'guide'>('innovation');

    return (
        <div className="bg-white dark:bg-gray-800 p-6 md:p-8 rounded-2xl shadow-lg w-full space-y-8 animate-fade-in">
            <div className="text-center mb-6">
                <div className="flex justify-center mb-4">
                    <div className="bg-teal-100 dark:bg-teal-900/30 p-4 rounded-full">
                        <InformationCircleIcon className="w-12 h-12 text-teal-600 dark:text-teal-400" />
                    </div>
                </div>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">เกี่ยวกับนวัตกรรม & คู่มือการใช้งาน</h2>
                <p className="text-gray-600 dark:text-gray-300 mt-2">
                    Smart Lifestyle Wellness: นวัตกรรมสุขภาพวิถีชีวิตเพื่อป้องกันโรค NCDs
                </p>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200 dark:border-gray-700">
                <button
                    onClick={() => setActiveTab('innovation')}
                    className={`flex-1 pb-4 text-sm font-medium text-center transition-colors ${
                        activeTab === 'innovation'
                            ? 'border-b-2 border-teal-500 text-teal-600 dark:text-teal-400'
                            : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                    }`}
                >
                    นวัตกรรม & แนวคิด
                </button>
                <button
                    onClick={() => setActiveTab('guide')}
                    className={`flex-1 pb-4 text-sm font-medium text-center transition-colors ${
                        activeTab === 'guide'
                            ? 'border-b-2 border-teal-500 text-teal-600 dark:text-teal-400'
                            : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                    }`}
                >
                    คู่มือการใช้งาน
                </button>
            </div>

            {/* Content: Innovation */}
            {activeTab === 'innovation' && (
                <div className="space-y-8 animate-fade-in">
                    {/* 1. Concept */}
                    <div className="bg-teal-50 dark:bg-teal-900/20 p-6 rounded-xl border-l-4 border-teal-500">
                        <h3 className="text-lg font-bold text-teal-800 dark:text-teal-300 mb-2">กรอบแนวคิด: Lifestyle Medicine & Smart Wellness</h3>
                        <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                            Smart Lifestyle Wellness ถูกออกแบบโดยยึดหลัก <strong>"เวชศาสตร์วิถีชีวิต (Lifestyle Medicine)"</strong> 
                            ซึ่งเชื่อว่าการปรับเปลี่ยนพฤติกรรมสุขภาพเป็นยาที่ทรงพลังที่สุดในการป้องกันและรักษาโรคเรื้อรัง (NCDs) 
                            โดยเราผสานเทคโนโลยีดิจิทัล (AI) เข้ากับศาสตร์การดูแลสุขภาพองค์รวม
                        </p>
                    </div>

                    {/* 2. 6 Pillars */}
                    <div>
                        <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4 text-center">6 เสาหลักสุขภาพองค์รวม</h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {[
                                { icon: '🥗', title: 'โภชนาการ', desc: 'Whole Food, Plant-based' },
                                { icon: '💪', title: 'การเคลื่อนไหว', desc: 'Active Living' },
                                { icon: '😴', title: 'การนอนหลับ', desc: 'Restorative Sleep' },
                                { icon: '🧠', title: 'ความเครียด', desc: 'Stress Management' },
                                { icon: '🚫', title: 'การหลีกเลี่ยงสารเสพติดและพฤติกรรมเสี่ยง', desc: 'No Smoking/Alcohol' },
                                { icon: '🤝', title: 'สังคม', desc: 'Positive Connection' }
                            ].map((item, idx) => (
                                <div key={idx} className="flex flex-col items-center p-4 bg-white dark:bg-gray-700 rounded-xl shadow-sm text-center border border-gray-100 dark:border-gray-600">
                                    <span className="text-3xl mb-2">{item.icon}</span>
                                    <h4 className="font-bold text-gray-800 dark:text-white text-sm">{item.title}</h4>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">{item.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* 3. Conceptual Framework Diagram */}
                    <div className="bg-white dark:bg-gray-700 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-600">
                        <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-6 text-center">Conceptual Framework</h3>
                        
                        <div className="flex flex-col items-center gap-2 max-w-md mx-auto text-sm">
                            {/* Step 1 */}
                            <div className="w-full p-4 bg-teal-600 text-white rounded-lg text-center shadow-md">
                                <p className="font-bold">Lifestyle Medicine Model</p>
                                <p className="text-xs opacity-90">6 Dimensions of Health</p>
                            </div>
                            
                            <div className="h-8 w-0.5 bg-gray-300 dark:bg-gray-500"></div>
                            <div className="text-gray-400">▼</div>

                            {/* Step 2 */}
                            <div className="w-full p-4 bg-purple-600 text-white rounded-lg text-center shadow-md relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-2 opacity-20"><SparklesIcon className="w-10 h-10"/></div>
                                <p className="font-bold">Digital Health Innovation</p>
                                <p className="text-xs opacity-90">Smart App • AI Analysis • Behavior Tracking</p>
                            </div>

                            <div className="h-8 w-0.5 bg-gray-300 dark:bg-gray-500"></div>
                            <div className="text-gray-400">▼</div>

                            {/* Step 3 */}
                            <div className="w-full p-4 bg-indigo-600 text-white rounded-lg text-center shadow-md">
                                <p className="font-bold">Behavior Change</p>
                                <p className="text-xs opacity-90">Sustainable Habits → Health Outcomes</p>
                            </div>

                            <div className="h-8 w-0.5 bg-gray-300 dark:bg-gray-500"></div>
                            <div className="text-gray-400">▼</div>

                            {/* Step 4 */}
                            <div className="w-full p-4 bg-gray-600 text-white rounded-lg text-center shadow-md">
                                <p className="font-bold">Evaluation & Impact</p>
                                <p className="text-xs opacity-90">Satisfaction • Efficacy • Effectiveness</p>
                            </div>
                        </div>
                        
                        <p className="text-center text-xs text-gray-500 dark:text-gray-400 mt-6 px-4">
                            ผลลัพธ์จากการใช้งานแอป จะถูกนำไปวิเคราะห์และเผยแพร่ในงานวิชาการ/งานนวัตกรรม 
                            เพื่อยืนยัน Impact จริงต่อสุขภาพของประชาชน
                        </p>
                    </div>

                    {/* Developer Credit - NEW SECTION */}
                    <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700 text-center">
                        <p className="text-sm font-bold text-gray-700 dark:text-gray-300">คณะผู้จัดทำ / ผู้พัฒนา</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                            พัฒนาโดย นายธงชัย ทำเผือก<br/>
                            กลุ่มงานสุขภาพดิจิทัล สำนักงานสาธารณสุขจังหวัดสตูล
                        </p>
                    </div>
                </div>
            )}

            {/* Content: User Guide */}
            {activeTab === 'guide' && (
                <div className="space-y-6 animate-fade-in">
                    {[
                        {
                            title: 'วิเคราะห์อาหาร (AI)',
                            icon: <CameraIcon className="w-6 h-6 text-purple-500" />,
                            steps: [
                                'ไปที่เมนู "วิเคราะห์อาหาร"',
                                'เลือก "ถ่ายภาพ" อาหารมื้อปัจจุบัน หรือ "พิมพ์ข้อความ" ระบุชื่อเมนู',
                                'กดปุ่มวิเคราะห์ AI จะประมวลผลสารอาหาร (แคลอรี่, น้ำตาล, ไขมัน) และผลกระทบต่อสุขภาพ',
                                'ระบบจะให้คะแนนความเสี่ยง NCDs และคำแนะนำในการปรับปรุง'
                            ]
                        },
                        {
                            title: 'แผนไลฟ์สไตล์ (Lifestyle Planner)',
                            icon: <ClipboardListIcon className="w-6 h-6 text-teal-500" />,
                            steps: [
                                'ไปที่เมนู "แผนไลฟ์สไตล์"',
                                'กรอกข้อมูลส่วนตัว เป้าหมายสุขภาพ และโรคประจำตัว',
                                'เลือกสไตล์อาหารที่ชอบ (เช่น อาหารใต้, อาหารคลีน)',
                                'AI จะออกแบบตารางอาหารและกิจกรรม 7 วันที่เหมาะสมกับคุณโดยเฉพาะ'
                            ]
                        },
                        {
                            title: 'เช็คอินสุขภาพ (Wellness Check-in)',
                            icon: <HeartIcon className="w-6 h-6 text-rose-500" />,
                            steps: [
                                'เข้ามาทำ "เช็คอินสุขภาพประจำวัน" ทุกวัน',
                                'บันทึกเวลาเข้านอน, อารมณ์, และพฤติกรรมเสี่ยง (เหล้า/บุหรี่)',
                                'กดปุ่ม "วิเคราะห์ภาพรวม" เพื่อให้ AI สรุปคำแนะนำรายวัน'
                            ]
                        },
                        {
                            title: 'โค้ชสุขภาพ AI',
                            icon: <SparklesIcon className="w-6 h-6 text-indigo-500" />,
                            steps: [
                                'ต้องการคำปรึกษาเฉพาะด้าน? ไปที่เมนู "โค้ชสุขภาพ"',
                                'เลือกผู้เชี่ยวชาญ AI ที่ต้องการ (เช่น นักโภชนาการ, เทรนเนอร์, แพทย์ NCDs)',
                                'ระบบจะนำข้อมูลสุขภาพของคุณไปวิเคราะห์และให้คำแนะนำที่ตรงจุด'
                            ]
                        },
                        {
                            title: 'เครื่องมือคำนวณพื้นฐาน',
                            icon: <ScaleIcon className="w-6 h-6 text-red-500" />,
                            steps: [
                                'ใช้ "เครื่องคำนวณ BMI" เพื่อดูเกณฑ์น้ำหนักมาตรฐาน',
                                'ใช้ "เครื่องคำนวณ TDEE" เพื่อหาค่าพลังงานที่ควรได้รับต่อวัน',
                                'บันทึกผลลัพธ์เพื่อดูแนวโน้มสุขภาพย้อนหลังในหน้า Dashboard'
                            ]
                        }
                    ].map((guide, index) => (
                        <div key={index} className="bg-gray-50 dark:bg-gray-700/50 p-5 rounded-xl border border-gray-100 dark:border-gray-700">
                            <div className="flex items-center gap-3 mb-3">
                                {guide.icon}
                                <h4 className="font-bold text-gray-800 dark:text-white">{guide.title}</h4>
                            </div>
                            <ul className="space-y-2 ml-2">
                                {guide.steps.map((step, i) => (
                                    <li key={i} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300">
                                        <span className="mt-1.5 w-1.5 h-1.5 bg-teal-500 rounded-full flex-shrink-0"></span>
                                        <span>{step}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default AboutApp;
