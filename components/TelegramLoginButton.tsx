
import React, { useRef, useEffect } from 'react';

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

  useEffect(() => {
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

    // Cleanup: In a real SPA, deleting the global function might cause issues if re-mounted,
    // but preventing duplicate script injection handles most cases.
  }, [botName, onAuth, buttonSize, cornerRadius, requestAccess, usePic]);

  return <div ref={containerRef} className="flex justify-center" />;
};

export default TelegramLoginButton;
