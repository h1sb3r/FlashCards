import React from 'react';
import { CardIcon, DownloadIcon } from './icons';

interface WelcomeViewProps {
  onImport: () => void;
}

const WelcomeView: React.FC<WelcomeViewProps> = ({ onImport }) => {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-8 animate-scale-in glass-panel">
      <div className="relative mb-10 group">
        <div className="absolute inset-0 bg-gradient-to-r from-[var(--accent-primary)] to-cyan-200 blur-[80px] opacity-30 group-hover:opacity-50 transition-opacity duration-1000 rounded-full"></div>
        <div className="glass-panel w-24 h-24 rounded-2xl flex items-center justify-center relative z-10 border border-white bg-white/80 shadow-xl">
           <CardIcon className="w-10 h-10 text-[var(--accent-primary)]" />
        </div>
      </div>
      
      <h2 className="text-4xl font-bold text-[var(--text-main)] mb-6 tracking-tight">FlashCards<span className="text-[var(--accent-primary)]">.AI</span></h2>
      <p className="mt-2 max-w-md text-[var(--text-muted)] text-base leading-relaxed mb-12 font-normal">
        Générez, organisez et maîtrisez vos connaissances dans un espace clair, épuré et intelligent.
      </p>
      
      <button
        onClick={onImport}
        className="glass-btn px-8 py-4 text-[var(--text-muted)] flex items-center gap-3 hover:text-[var(--text-main)] hover:bg-white transition-all duration-300 text-sm font-medium bg-white/40"
      >
        <DownloadIcon className="w-4 h-4" />
        <span>Importer une sauvegarde</span>
      </button>
    </div>
  );
};

export default WelcomeView;