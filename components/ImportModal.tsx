
import React from 'react';
import { LoadIcon, WarningIcon } from './icons';

interface ImportModalProps {
  isOpen: boolean;
  cardCount: number;
  onClose: () => void;
  onMerge: () => void;
  onReplace: () => void;
}

const ImportModal: React.FC<ImportModalProps> = ({ 
  isOpen, 
  cardCount, 
  onClose, 
  onMerge, 
  onReplace 
}) => {
  if (!isOpen) return null;

  return (
    <div 
        className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in"
        onClick={onClose}
        aria-modal="true"
        role="dialog"
    >
      <div 
        className="bg-[var(--neu-base)] rounded-2xl shadow-xl p-8 m-4 max-w-md w-full transform transition-all animate-scale-in border border-white/20"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col items-center text-center">
            <div className="neu-flat p-4 rounded-full mb-6 text-indigo-600">
                <LoadIcon className="w-8 h-8" />
            </div>
            
            <h3 className="text-xl font-bold text-slate-700 mb-2">
                Importer des cartes
            </h3>
            
            <p className="text-slate-600 mb-6 text-sm leading-relaxed">
                Vous êtes sur le point d'importer <strong className="text-indigo-600">{cardCount} cartes</strong>. 
                Comment souhaitez-vous procéder ?
            </p>
            
            <div className="flex flex-col gap-4 w-full">
                <button
                    onClick={onMerge}
                    className="neu-btn px-6 py-4 text-indigo-600 font-bold w-full flex flex-col items-center justify-center gap-1"
                >
                    <span>Fusionner</span>
                    <span className="text-[10px] font-normal opacity-70 uppercase tracking-wide">Conserver l'existant + Ajouter</span>
                </button>
                
                <button
                    onClick={onReplace}
                    className="neu-btn px-6 py-4 text-red-500 font-bold w-full flex flex-col items-center justify-center gap-1 hover:text-red-600"
                >
                    <span>Remplacer tout</span>
                    <span className="text-[10px] font-normal opacity-70 uppercase tracking-wide">Effacer ma liste actuelle</span>
                </button>

                <button
                    onClick={onClose}
                    className="mt-2 text-slate-400 hover:text-slate-600 text-sm font-medium py-2 transition-colors"
                >
                    Annuler
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default ImportModal;
