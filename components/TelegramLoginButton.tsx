
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
  buttonSize = 'large',
  cornerRadius = 20,
  requestAccess = 'write',
  usePic = true,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLocalhost, setIsLocalhost] = useState(false);

  useEffect(() => {
    // Telegram Widget does NOT work on localhost. It throws "Bot domain invalid".
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
        setIsLocalhost(true);
        return; 
    }

    if (!containerRef.current) return;
    // Prevent duplicate scripts
    if (containerRef.current.innerHTML !== '') return;

    const script = document.createElement('script');
    script.src = 'https://telegram.org/js/telegram-widget.js';
    script.setAttribute('data-telegram-login', botName);
    script.setAttribute('data-size', buttonSize);
    script.setAttribute('data-radius', cornerRadius.toString());
    script.setAttribute('data-request-access', requestAccess);
    script.setAttribute('data-userpic', usePic.toString());
    script.setAttribute('data-onauth', 'onTelegramAuth(user)');
    script.async = true;

    containerRef.current.appendChild(script);

    // Set global callback
    (window as any).onTelegramAuth = (user: TelegramUser) => {
      onAuth(user);
    };

  }, [botName, onAuth, buttonSize, cornerRadius, requestAccess, usePic]);

  if (isLocalhost) {
      return (
          <div className="text-[10px] text-center text-amber-600 bg-amber-50 p-2 rounded-lg border border-amber-200 w-full max-w-[240px]">
              ⚠️ <b>Telegram Login</b>
              <br/>
              ไม่รองรับ Localhost
              <br/>
              ต้องใช้ Domain จริง (HTTPS)
          </div>
      );
  }

  return <div ref={containerRef} className="flex justify-center" />;
};

export default TelegramLoginButton;
