import { useState, useEffect, useCallback } from 'react';

function checkStandalone() {
  if (typeof window === 'undefined') return false;
  return Boolean(
    (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || 
    window.navigator.standalone === true
  );
}

function checkIOSDevice() {
  if (typeof window === 'undefined') return false;
  const ua = window.navigator.userAgent || '';
  const isApple = /iPad|iPhone|iPod/.test(ua) && !window.MSStream;
  const isIPadOS = window.navigator.platform === 'MacIntel' && window.navigator.maxTouchPoints > 1;
  return isApple || isIPadOS;
}

export function usePWA() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(() => checkStandalone());
  const [isIOS] = useState(() => checkIOSDevice());
  const [isInstallable, setIsInstallable] = useState(() => checkIOSDevice() && !checkStandalone());
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);

  useEffect(() => {

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setIsInstallable(false);
      setIsInstalled(true);
    };

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const installApp = useCallback(async () => {
    if (!deferredPrompt) return false;
    try {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        setIsInstallable(false);
        setDeferredPrompt(null);
        return true;
      }
      return false;
    } catch (err) {
      console.error('PWA install prompt error:', err);
      return false;
    }
  }, [deferredPrompt]);

  return {
    isInstallable,
    isInstalled,
    isIOS,
    isOnline,
    installApp,
  };
}
