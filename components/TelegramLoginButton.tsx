
import React, { useRef, useEffect, useState } from 'react';

interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
}

interface TelegramLoginButtonProps {
  botName: string;
  onAuth: (user: TelegramUser) => void;
  buttonSize?: 'large' | 'medium' | 'small';
  cornerRadius?: number;
  requestAccess?: string;
  usePic?: boolean;
}

const TelegramLoginButton: React.FC<TelegramLoginButtonProps> = ({
  botName,
  onAuth,
  buttonSize = 'large', // ตั้งค่าตามสคริปต์ที่ระบุ
  cornerRadius = 20,
  requestAccess = 'write',
  usePic = false, // ตั้งค่าเป็น false ตามสคริปต์ที่ระบุ
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLocalhost, setIsLocalhost] = useState(false);

  useEffect(() => {
    const hostname = window.location.hostname;

    // Telegram Widget จะไม่ทำงานบน localhost หรือไอพีเครื่อง
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
        setIsLocalhost(true);
        return; 
    }

    if (!containerRef.current) return;
    
    // ล้างข้อมูลเดิมในคอนเทนเนอร์
    containerRef.current.innerHTML = '';

    const script = document.createElement('script');
    // ใช้เวอร์ชัน ?22 ตามความต้องการ
    script.src = 'https://telegram.org/js/telegram-widget.js?22';
    script.async = true;
    
    // ตั้งค่า Attributes ให้ตรงตาม snippet เป๊ะๆ
    script.setAttribute('data-telegram-login', botName);
    script.setAttribute('data-size', buttonSize);
    if (cornerRadius !== undefined) {
        script.setAttribute('data-radius', cornerRadius.toString());
    }
    script.setAttribute('data-request-access', requestAccess);
    script.setAttribute('data-userpic', usePic.toString());
    script.setAttribute('data-onauth', 'onTelegramAuth(user)');

    containerRef.current.appendChild(script);

    // กำหนด Global Callback ชื่อเดียวกับที่ระบุใน data-onauth
    (window as any).onTelegramAuth = (user: TelegramUser) => {
      // เรียกใช้ฟังก์ชัน onAuth ที่ส่งมาจาก Props เพื่อประมวลผลการล็อกอินในแอป
      onAuth(user);
    };

    return () => {
        if (containerRef.current) containerRef.current.innerHTML = '';
        // ลบ callback ออกเมื่อเลิกใช้งานคอมโพเนนต์
        delete (window as any).onTelegramAuth;
    };
  }, [botName, onAuth, buttonSize, cornerRadius, requestAccess, usePic]);

  if (isLocalhost) {
      return (
          <div className="text-[10px] text-center text-amber-600 bg-amber-50 p-2 rounded-lg border border-amber-200 w-full max-w-[240px]">
              ⚠️ <b>Telegram Login</b>
              <br/>
              ใช้ได้บน Domain จริงเท่านั้น (เช่น Vercel)
          </div>
      );
  }

  return (
    <div className="flex flex-col items-center gap-2 w-full">
        <div ref={containerRef} className="flex justify-center min-h-[40px]" />
        <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium animate-pulse text-center px-4">
            โปรดเปิดแอปแล้วกด Confirm เพื่อเข้าใช้งาน
        </p>
    </div>
  );
};

export default TelegramLoginButton;
