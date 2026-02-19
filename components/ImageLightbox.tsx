import React from 'react';
import { XCircleIcon } from './icons';

interface ImageLightboxProps {
  src: string;
  onClose: () => void;
}

const ImageLightbox: React.FC<ImageLightboxProps> = ({ src, onClose }) => {
  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-80 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white hover:text-slate-300 transition-colors z-20"
        aria-label="Fermer l'aperçu"
      >
        <XCircleIcon className="w-10 h-10" />
      </button>
      <div className="relative max-w-4xl max-h-[90vh] p-4 animate-scale-in" onClick={(e) => e.stopPropagation()}>
        <img src={src} alt="Aperçu en plein écran" className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl" />
      </div>
    </div>
  );
};

export default ImageLightbox;
