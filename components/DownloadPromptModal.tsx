import React, { useEffect, useState } from 'react';
import { DownloadIcon } from './icons';

const DownloadPromptModal: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      
      const hasDeclined = localStorage.getItem('pwa-install-declined');
      if (!hasDeclined) {
        setIsVisible(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();

    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('Utilisateur a accepté l\'installation');
    } else {
      console.log('Utilisateur a refusé l\'installation');
    }

    setDeferredPrompt(null);
    setIsVisible(false);
  };

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem('pwa-install-declined', 'true');
  };

  if (!isVisible) return null;

  return (
    <div 
        className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in"
        role="dialog"
        aria-modal="true"
    >
      <div className="glass-panel p-8 m-4 max-w-sm w-full transform transition-all animate-scale-in">
        <div className="flex flex-col items-center text-center">
            <div className="p-4 rounded-full mb-6 bg-sky-500/10 border border-sky-500/20 text-sky-400 shadow-[0_0_15px_rgba(56,189,248,0.2)]">
                <DownloadIcon className="w-8 h-8" />
            </div>
            
            <h3 className="text-xl font-bold text-white mb-3">
                Installer l'application
            </h3>
            
            <p className="text-slate-400 mb-8 text-sm leading-relaxed">
                Installez cette application sur votre appareil pour un accès plus rapide, une meilleure expérience et une utilisation hors ligne.
            </p>
            
            <div className="flex flex-col gap-3 w-full">
                <button
                    onClick={handleInstallClick}
                    className="glass-btn glass-btn-primary px-6 py-3 font-bold w-full"
                >
                    Installer
                </button>
                <button
                    onClick={handleDismiss}
                    className="text-slate-500 hover:text-slate-300 text-sm font-medium py-2 transition-colors"
                >
                    Plus tard
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default DownloadPromptModal;