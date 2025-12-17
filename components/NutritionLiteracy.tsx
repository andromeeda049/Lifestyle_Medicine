
import React from 'react';
import { BookOpenIcon } from './icons';

const AccordionItem: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => {
  return (
    <details className="group rounded-lg bg-gray-50 dark:bg-gray-800 p-4 transition-colors duration-300 hover:bg-gray-100 dark:hover:bg-gray-700">
      <summary className="flex cursor-pointer list-none items-center justify-between font-medium">
        <span className="text-lg text-gray-800 dark:text-white">{title}</span>
        <span className="transition group-open:rotate-180">
          <svg fill="none" height="24" shapeRendering="geometricPrecision" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="24" className="text-gray-600 dark:text-gray-300"><path d="M6 9l6 6 6-6"></path></svg>
        </span>
      </summary>
      <div className="mt-4 text-gray-600 dark:text-gray-300 prose prose-sm max-w-none leading-relaxed">
        {children}
      </div>
    </details>
  );
};

const NutritionLiteracy: React.FC = () => {
  return (
    <div className="bg-white dark:bg-gray-800 p-6 md:p-8 rounded-2xl shadow-lg w-full transform transition-all duration-300">
      <div className="text-center mb-8">
        <BookOpenIcon className="w-16 h-16 mx-auto text-transparent bg-clip-text bg-gradient-to-r from-teal-500 to-emerald-500" />
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mt-4">เวชศาสตร์วิถีชีวิต (Lifestyle Medicine)</h2>
        <p className="text-gray-600 dark:text-gray-300 mt-2">
          ศาสตร์แห่งการดูแลสุขภาพเพื่อป้องกันและรักษาโรค NCDs ด้วยการปรับพฤติกรรม
        </p>
      </div>
      
      <div className="space-y-4">
        <AccordionItem title="เวชศาสตร์วิถีชีวิต คืออะไร?">
          <p>
            <strong>Lifestyle Medicine</strong> คือการใช้รูปแบบการดำเนินชีวิตเป็นยาหลักในการป้องกัน จัดการ และรักษาโรคเรื้อรัง (NCDs) เช่น โรคเบาหวาน ความดันโลหิตสูง โรคหัวใจ และโรคอ้วน
            โดยเน้นการแก้ที่ต้นเหตุมากกว่าการรักษาที่ปลายเหตุ ด้วยการปรับเปลี่ยนพฤติกรรมใน 6 ด้านหลัก
          </p>
        </AccordionItem>

        <AccordionItem title="เสาหลักที่ 1: โภชนาการ (Nutrition)">
          <p>เน้นการรับประทานอาหารแบบ <strong>Plant-Based Whole Foods</strong> หรืออาหารจากพืชที่ไม่ผ่านการขัดสี:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>เน้นพืชเป็นหลัก:</strong> ผัก ผลไม้ ธัญพืชไม่ขัดสี ถั่ว และเมล็ดพืช</li>
            <li><strong>ลดอาหารแปรรูป:</strong> หลีกเลี่ยงอาหารที่มีน้ำตาลสูง โซเดียมสูง และไขมันทรานส์</li>
            <li><strong>จำกัดเนื้อแดง:</strong> และเนื้อสัตว์แปรรูป เพื่อลดความเสี่ยงมะเร็งและโรคหัวใจ</li>
            <li><strong>จานสุขภาพ (Healthy Plate):</strong> แบ่งจานเป็น 4 ส่วน: ผัก 2 ส่วน, แป้งไม่ขัดสี 1 ส่วน, โปรตีน 1 ส่วน</li>
          </ul>
        </AccordionItem>

        <AccordionItem title="เสาหลักที่ 2: การเคลื่อนไหวร่างกาย (Physical Activity)">
          <p>การมีกิจกรรมทางกายสม่ำเสมอช่วยลดความเสี่ยงโรค NCDs ได้อย่างมหาศาล:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>แอโรบิก:</strong> เดินเร็ว วิ่ง ปั่นจักรยาน อย่างน้อย 150 นาที/สัปดาห์ (ระดับปานกลาง)</li>
            <li><strong>เวทเทรนนิ่ง:</strong> เสริมสร้างกล้ามเนื้อ อย่างน้อย 2 วัน/สัปดาห์</li>
            <li><strong>ขยับระหว่างวัน:</strong> ลุกเดินทุกๆ 1 ชั่วโมง ลดพฤติกรรมเนือยนิ่ง (Sedentary Lifestyle)</li>
          </ul>
        </AccordionItem>
        
        <AccordionItem title="เสาหลักที่ 3: การนอนหลับ (Restorative Sleep)">
          <p>การนอนที่ดีคือรากฐานของสุขภาพภูมิคุ้มกันและสมดุลฮอร์โมน:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>นอนให้ได้ <strong>7-9 ชั่วโมง</strong> ต่อคืน</li>
            <li>เข้านอนและตื่นนอนให้เป็นเวลาเดียวกันทุกวัน</li>
            <li>หลีกเลี่ยงแสงสีฟ้าจากหน้าจอก่อนนอนอย่างน้อย 1 ชั่วโมง</li>
            <li>งดคาเฟอีนหลังเที่ยงวัน</li>
          </ul>
        </AccordionItem>

        <AccordionItem title="เสาหลักที่ 4: การจัดการความเครียด (Stress Management)">
          <p>ความเครียดเรื้อรังส่งผลร้ายต่อระบบภูมิคุ้มกันและหัวใจ:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>ฝึกการหายใจลึกๆ (Deep Breathing) หรือทำสมาธิ</li>
            <li>หางานอดิเรกที่ชอบทำเพื่อผ่อนคลาย</li>
            <li>รู้จักปฏิเสธงานที่เกินกำลัง และจัดสรรเวลาพักผ่อน</li>
          </ul>
        </AccordionItem>

        <AccordionItem title="เสาหลักที่ 5: การหลีกเลี่ยงสารเสพติดและพฤติกรรมเสี่ยง (Avoidance of Addictive Substances)">
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>งดสูบบุหรี่:</strong> การเลิกบุหรี่เป็นสิ่งที่ดีที่สุดที่คุณทำได้เพื่อปอดและหัวใจ</li>
            <li><strong>จำกัดแอลกอฮอล์:</strong> หากดื่ม ควรดื่มในปริมาณที่จำกัด (ไม่เกิน 1 แก้วสำหรับหญิง, 2 แก้วสำหรับชาย ต่อวัน)</li>
          </ul>
        </AccordionItem>

        <AccordionItem title="เสาหลักที่ 6: ความสัมพันธ์ทางสังคม (Social Connection)">
          <p>ความโดดเดี่ยวส่งผลเสียต่อสุขภาพเทียบเท่าการสูบบุหรี่:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>รักษาความสัมพันธ์ที่ดีกับครอบครัวและเพื่อนฝูง</li>
            <li>เข้าร่วมกิจกรรมกลุ่มหรือชมรมที่มีความสนใจเดียวกัน</li>
            <li>หาที่ปรึกษาหรือระบายความรู้สึกเมื่อมีปัญหา</li>
          </ul>
        </AccordionItem>
        
        <AccordionItem title="แนวทางเฉพาะโรค: เบาหวาน & ความดัน">
          <div className="space-y-4">
            <div>
                <h4 className="font-bold text-teal-600 dark:text-teal-400">สำหรับโรคเบาหวาน (Diabetes)</h4>
                <ul className="list-disc pl-5 text-sm">
                    <li>ควบคุมปริมาณคาร์โบไฮเดรต เลือกทานคาร์บเชิงซ้อน (ข้าวกล้อง, ธัญพืช)</li>
                    <li>หลีกเลี่ยงน้ำตาล เครื่องดื่มหวาน และผลไม้รสหวานจัด</li>
                    <li>ทานอาหารที่มีใยอาหารสูง เพื่อชะลอการดูดซึมน้ำตาล</li>
                </ul>
            </div>
            <div>
                <h4 className="font-bold text-red-500 dark:text-red-400">สำหรับโรคความดันโลหิตสูง (Hypertension)</h4>
                <ul className="list-disc pl-5 text-sm">
                    <li>ใช้หลักการ <strong>DASH Diet</strong> (Dietary Approaches to Stop Hypertension)</li>
                    <li>ลดโซเดียม (เกลือ) ไม่เกิน 1 ช้อนชา หรือ 2,000 มก. ต่อวัน</li>
                    <li>เลี่ยงอาหารหมักดอง อาหารกระป๋อง และบะหมี่กึ่งสำเร็จรูป</li>
                    <li>เพิ่มโพแทสเซียมจากผักและผลไม้ (เช่น กล้วย, ผักโขม)</li>
                </ul>
            </div>
          </div>
        </AccordionItem>

      </div>
    </div>
  );
};

export default NutritionLiteracy;
