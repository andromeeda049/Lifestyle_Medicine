
import React, { useState } from 'react';
import { InformationCircleIcon, ClipboardListIcon, CameraIcon, SparklesIcon, HeartIcon, ScaleIcon, TrophyIcon, ChartBarIcon, UserGroupIcon, BoltIcon, StarIcon, UserCircleIcon } from './icons';

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
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Satun Smart Life</h2>
                <p className="text-gray-600 dark:text-gray-300 mt-2 text-sm font-medium">
                    "พลิกโฉมการดูแลสุขภาพด้วย AI และ Lifestyle Medicine สู่ความยั่งยืนด้วย Gamification"
                </p>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200 dark:border-gray-700">
                <button
                    onClick={() => setActiveTab('innovation')}
                    className={`flex-1 pb-4 text-sm font-bold text-center transition-colors ${
                        activeTab === 'innovation'
                            ? 'border-b-4 border-teal-500 text-teal-600 dark:text-teal-400'
                            : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                    }`}
                >
                    บทสรุปนวัตกรรม
                </button>
                <button
                    onClick={() => setActiveTab('guide')}
                    className={`flex-1 pb-4 text-sm font-bold text-center transition-colors ${
                        activeTab === 'guide'
                            ? 'border-b-4 border-teal-500 text-teal-600 dark:text-teal-400'
                            : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                    }`}
                >
                    คู่มือการใช้งาน
                </button>
            </div>

            {/* Content: Innovation Summary */}
            {activeTab === 'innovation' && (
                <div className="space-y-10 animate-fade-in text-gray-800 dark:text-gray-200">
                    
                    {/* 1. Objectives */}
                    <div className="bg-blue-50 dark:bg-blue-900/10 p-6 rounded-xl border-l-4 border-blue-500">
                        <h3 className="text-lg font-bold text-blue-800 dark:text-blue-300 mb-3 flex items-center gap-2">
                            <span className="bg-blue-200 dark:bg-blue-800 p-1 rounded">🎯</span> 1. วัตถุประสงค์หลัก
                        </h3>
                        <ul className="space-y-2 text-sm ml-2">
                            <li className="flex items-start gap-2">
                                <span className="text-blue-500 mt-1">•</span>
                                <span><strong>ป้องกัน NCDs:</strong> แก้ปัญหาที่ต้นเหตุ (Root Cause) คือ "พฤติกรรม"</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-blue-500 mt-1">•</span>
                                <span><strong>ลดช่องว่างบริการ:</strong> มี "โค้ชสุขภาพส่วนตัว (AI)" ปรึกษาได้ 24 ชม.</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-blue-500 mt-1">•</span>
                                <span><strong>Health Literacy:</strong> เปลี่ยนความรู้ยากๆ ให้ปฏิบัติได้จริง</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-blue-500 mt-1">•</span>
                                <span><strong>ความยั่งยืน:</strong> สร้างนิสัยสุขภาพผ่านระบบ Gamification</span>
                            </li>
                        </ul>
                    </div>

                    {/* 2. Conceptual Framework */}
                    <div>
                        <h3 className="text-lg font-bold mb-4 border-b pb-2 dark:border-gray-700">2. กรอบแนวคิด (Conceptual Framework)</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="p-4 border rounded-xl bg-teal-50/50 dark:bg-teal-900/10 border-teal-100 dark:border-teal-800">
                                <h4 className="font-bold text-teal-700 dark:text-teal-300 mb-2">🌿 Lifestyle Medicine</h4>
                                <p className="text-xs">ประเมินและดูแลตาม 6 เสาหลัก: โภชนาการ, การเคลื่อนไหว, การนอน, ความเครียด, ละเว้นสิ่งเสพติด, ความสัมพันธ์</p>
                            </div>
                            <div className="p-4 border rounded-xl bg-purple-50/50 dark:bg-purple-900/10 border-purple-100 dark:border-purple-800">
                                <h4 className="font-bold text-purple-700 dark:text-purple-300 mb-2">🤖 Generative AI</h4>
                                <p className="text-xs">ใช้ AI (Gemini) วิเคราะห์อาหารจากภาพ, สร้างแผนรายบุคคล และให้คำปรึกษาแบบ Real-time</p>
                            </div>
                        </div>
                    </div>

                    {/* 3. Key Features */}
                    <div>
                        <h3 className="text-lg font-bold mb-4 border-b pb-2 dark:border-gray-700">3. ฟีเจอร์เด่น (Key Features)</h3>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                            <div className="flex flex-col items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg text-center">
                                <CameraIcon className="w-6 h-6 text-purple-500 mb-2" />
                                <span className="font-bold">AI Food Lens</span>
                                <span className="text-[10px] text-gray-500">สแกนอาหารวิเคราะห์ 6 มิติ</span>
                            </div>
                            <div className="flex flex-col items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg text-center">
                                <ClipboardListIcon className="w-6 h-6 text-emerald-500 mb-2" />
                                <span className="font-bold">Personalized Planner</span>
                                <span className="text-[10px] text-gray-500">แผนสุขภาพตามค่า TDEE</span>
                            </div>
                            <div className="flex flex-col items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg text-center">
                                <SparklesIcon className="w-6 h-6 text-indigo-500 mb-2" />
                                <span className="font-bold">Hybrid AI Coach</span>
                                <span className="text-[10px] text-gray-500">ทีมผู้เชี่ยวชาญ AI 24 ชม.</span>
                            </div>
                            <div className="flex flex-col items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg text-center">
                                <HeartIcon className="w-6 h-6 text-rose-500 mb-2" />
                                <span className="font-bold">Wellness Check-in</span>
                                <span className="text-[10px] text-gray-500">บันทึก 4 มิติรายวัน</span>
                            </div>
                        </div>
                    </div>

                    {/* 4. Gamification Strategy */}
                    <div className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/10 dark:to-orange-900/10 p-6 rounded-xl border border-yellow-200 dark:border-yellow-800">
                        <h3 className="text-lg font-bold text-yellow-800 dark:text-yellow-400 mb-3 flex items-center gap-2">
                            <TrophyIcon className="w-6 h-6" /> 4. กลยุทธ์จูงใจ (Gamification)
                        </h3>
                        <p className="text-sm font-semibold mb-3 text-center bg-white dark:bg-gray-800 py-1 rounded-full shadow-sm opacity-80">
                            "เน้นความสม่ำเสมอ & พฤติกรรมคุณภาพ"
                        </p>
                        <div className="space-y-3 text-sm">
                            <div>
                                <h5 className="font-bold text-orange-700 dark:text-orange-300">Consistency (ความสม่ำเสมอ):</h5>
                                <p className="text-xs">จำกัดการบันทึกต่อวัน (Limit) เพื่อให้โฟกัสการลงมือทำจริง ไม่ใช่แค่ปั๊มแต้ม + มีโบนัสภารกิจรายวัน</p>
                            </div>
                            <div>
                                <h5 className="font-bold text-orange-700 dark:text-orange-300">Quality Rewards (แต้มคุณภาพ):</h5>
                                <p className="text-xs">ให้ XP พิเศษเมื่อผลลัพธ์ดีขึ้น เช่น "Clean Day" (งดเหล้า/บุหรี่), กินอาหาร Low Risk, นอนหลับดี</p>
                            </div>
                            <div>
                                <h5 className="font-bold text-orange-700 dark:text-orange-300">Community (สังคม):</h5>
                                <p className="text-xs">ระบบ Leaderboard และ Badges (เหรียญรางวัล) สร้างแรงจูงใจเชิงบวก</p>
                            </div>
                        </div>
                    </div>

                    {/* 5. Measurement */}
                    <div>
                        <h3 className="text-lg font-bold mb-4 border-b pb-2 dark:border-gray-700">5. การวัดผลลัพธ์ (Outcome)</h3>
                        <div className="space-y-2 text-sm">
                            <div className="flex items-center gap-3">
                                <ChartBarIcon className="w-5 h-5 text-gray-400" />
                                <div>
                                    <strong>Behavioral:</strong> อัตราการใช้งานต่อเนื่อง, ความสม่ำเสมอในการดื่มน้ำ/กินตาม TDEE
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <HeartIcon className="w-5 h-5 text-gray-400" />
                                <div>
                                    <strong>Health:</strong> แนวโน้ม BMI, คะแนนสุขภาพจิต (Stress), คะแนนความรอบรู้ (Quiz Score)
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <StarIcon className="w-5 h-5 text-gray-400" />
                                <div>
                                    <strong>Satisfaction:</strong> ผลประเมินความพึงพอใจและประโยชน์ที่ได้รับ
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 6. Value Proposition */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-green-50 dark:bg-green-900/10 p-4 rounded-xl border border-green-100 dark:border-green-800">
                            <h4 className="font-bold text-green-700 dark:text-green-300 mb-2 flex items-center gap-2">
                                <UserCircleIcon className="w-5 h-5" /> ประชาชน
                            </h4>
                            <ul className="text-xs space-y-1 list-disc pl-4">
                                <li>เข้าถึงง่ายผ่าน Web/LINE ไม่ต้องโหลดแอป</li>
                                <li>คำแนะนำสุขภาพที่ "ทำได้จริง" และ "สนุก"</li>
                                <li>เห็นพัฒนาการของตัวเองชัดเจน</li>
                            </ul>
                        </div>
                        <div className="bg-indigo-50 dark:bg-indigo-900/10 p-4 rounded-xl border border-indigo-100 dark:border-indigo-800">
                            <h4 className="font-bold text-indigo-700 dark:text-indigo-300 mb-2 flex items-center gap-2">
                                <UserGroupIcon className="w-5 h-5" /> เจ้าหน้าที่/องค์กร
                            </h4>
                            <ul className="text-xs space-y-1 list-disc pl-4">
                                <li>ลดภาระงานคัดกรองเบื้องต้นด้วย AI</li>
                                <li>มี Big Data Dashboard ติดตามสุขภาพกลุ่มเป้าหมาย</li>
                                <li>ยกระดับภาพลักษณ์องค์กรดิจิทัล</li>
                            </ul>
                        </div>
                    </div>

                    <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700 text-center">
                        <p className="text-sm font-bold text-gray-700 dark:text-gray-300">"Satun Smart Life เพื่อนคู่คิดทางสุขภาพ"</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                            พัฒนาโดย กลุ่มงานสุขภาพดิจิทัล สำนักงานสาธารณสุขจังหวัดสตูล
                        </p>
                    </div>
                </div>
            )}

            {/* Content: User Guide (Existing) */}
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
