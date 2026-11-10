import { useState } from 'react';
import { Download, X, Smartphone, Sparkles, Share2, PlusSquare } from 'lucide-react';
import { usePWA } from '../../hooks/usePWA';

export default function PWAInstallBanner() {
  const { isInstallable, isInstalled, isIOS, installApp } = usePWA();
  const [dismissed, setDismissed] = useState(() => {
    try {
      return sessionStorage.getItem('petrol_pwa_dismissed') === 'true';
    } catch {
      return false;
    }
  });
  const [installing, setInstalling] = useState(false);

  if (!isInstallable || isInstalled || dismissed) {
    return null;
  }

  const handleInstall = async () => {
    setInstalling(true);
    const success = await installApp();
    setInstalling(false);
    if (success) {
      setDismissed(true);
    }
  };

  const handleDismiss = () => {
    sessionStorage.setItem('petrol_pwa_dismissed', 'true');
    setDismissed(true);
  };

  return (
    <aside
      aria-label="PWA Installation Prompt"
      className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-[99990] max-w-sm w-[calc(100vw-2rem)] bg-white/95 backdrop-blur-md rounded-2xl border border-neutral-border shadow-2xl p-4 animate-in slide-in-from-bottom-5 duration-300 transition-all font-sans"
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center shrink-0 shadow-md shadow-primary/20">
          <Smartphone size={20} strokeWidth={2.2} />
        </div>

        <div className="flex-1 min-w-0 pr-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-neutral-text tracking-tight uppercase">
                {isIOS ? 'Install on iPhone / iPad' : 'Install PetrolDesk App'}
              </span>
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                <Sparkles size={9} /> Fast
              </span>
            </div>
            <button
              type="button"
              onClick={handleDismiss}
              className="text-neutral-muted hover:text-neutral-text p-1 rounded-full transition-colors"
              title="Close"
            >
              <X size={15} />
            </button>
          </div>

          {isIOS ? (
            <div className="mt-2.5 space-y-2 text-[11px] text-neutral-text font-medium">
              <p className="text-[10px] text-neutral-muted font-bold uppercase tracking-wider">
                Install in Safari:
              </p>
              <div className="flex items-center gap-2 bg-neutral-bg p-2 rounded-lg border border-neutral-border">
                <span className="w-4 h-4 rounded-full bg-primary text-white text-[9px] font-bold flex items-center justify-center shrink-0">1</span>
                <span className="flex-1">
                  Tap Safari&apos;s <strong className="text-primary inline-flex items-center gap-1">Share <Share2 size={11} className="inline text-primary" /></strong> button
                </span>
              </div>
              <div className="flex items-center gap-2 bg-neutral-bg p-2 rounded-lg border border-neutral-border">
                <span className="w-4 h-4 rounded-full bg-primary text-white text-[9px] font-bold flex items-center justify-center shrink-0">2</span>
                <span className="flex-1">
                  Scroll down & tap <strong className="text-neutral-text inline-flex items-center gap-1">Add to Home Screen <PlusSquare size={11} className="inline text-neutral-text" /></strong>
                </span>
              </div>
              <div className="flex items-center gap-2 bg-neutral-bg p-2 rounded-lg border border-neutral-border">
                <span className="w-4 h-4 rounded-full bg-primary text-white text-[9px] font-bold flex items-center justify-center shrink-0">3</span>
                <span className="flex-1">
                  Tap <strong className="text-primary">Add</strong> in top-right corner
                </span>
              </div>
              <button
                type="button"
                onClick={handleDismiss}
                className="w-full mt-2 py-1.5 rounded-xl bg-primary hover:bg-primary-dark text-white text-xs font-bold transition-all shadow-sm text-center cursor-pointer"
              >
                Got It
              </button>
            </div>
          ) : (
            <>
              <p className="text-[11px] text-neutral-muted font-medium leading-relaxed mt-1">
                Install on your device for full-screen view, faster startup, and offline resilience.
              </p>

              <div className="flex items-center gap-2 mt-3">
                <button
                  type="button"
                  onClick={handleInstall}
                  disabled={installing}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary hover:bg-primary-dark text-white text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer disabled:opacity-60"
                >
                  <Download size={13} strokeWidth={2.5} />
                  <span>{installing ? 'Installing...' : 'Install Now'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleDismiss}
                  className="px-2.5 py-1.5 rounded-xl text-xs font-semibold text-neutral-muted hover:text-neutral-text hover:bg-neutral-bg transition-all cursor-pointer"
                >
                  Later
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </aside>
  );
}
