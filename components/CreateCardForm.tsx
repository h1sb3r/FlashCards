import React, { useState, useRef } from 'react';
import { PlusIcon, SpinnerIcon, ImageIcon, XCircleIcon } from './icons';

interface CreateCardFormProps {
  onCreate: (title: string, content: string, images: string[]) => void;
  isProcessing: boolean;
  onImageClick: (src: string) => void;
}

const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });

const CreateCardForm: React.FC<CreateCardFormProps> = ({ onCreate, isProcessing, onImageClick }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [error, setError] = useState('');
  const imageInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      setError('Le titre et le contenu sont requis.');
      return;
    }
    onCreate(title, content, images);
    setTitle('');
    setContent('');
    setImages([]);
    setError('');
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      if (files.length === 0) return;
      
      try {
        const base64Promises = files.map(fileToBase64);
        const base64Images = await Promise.all(base64Promises);
        setImages(prevImages => [...prevImages, ...base64Images]);
      } catch (err) {
        console.error("Error converting images to base64", err);
        setError("Erreur image.");
      } finally {
        if(e.target) e.target.value = '';
      }
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages(prevImages => prevImages.filter((_, i) => i !== index));
  };

  return (
    <div className="glass-panel p-8 md:p-12 animate-scale-in max-w-3xl mx-auto h-full overflow-y-auto custom-scrollbar flex flex-col justify-center">
      <h2 className="text-xl font-bold text-[var(--text-main)] mb-10 text-center tracking-tight">Nouvelle Fiche</h2>
      <form onSubmit={handleSubmit} className="space-y-6 w-full">
        <div className="space-y-2">
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-5 py-4 glass-input text-lg font-bold placeholder-[var(--text-muted)] focus:text-[var(--text-main)]"
            placeholder="Sujet..."
            disabled={isProcessing}
          />
        </div>
        <div className="space-y-2">
          <textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={10}
            className="w-full px-5 py-4 glass-input font-mono text-sm text-[var(--text-main)] placeholder-[var(--text-muted)] resize-none"
            placeholder="Contenu brut à formater par l'IA..."
            disabled={isProcessing}
          ></textarea>
        </div>

        <div>
          <div className="glass-input p-4 min-h-[100px] flex flex-col justify-center border-dashed border-[var(--border-glass)] bg-white/30 transition-colors hover:bg-white/50">
             {images.length > 0 && (
              <div className="grid grid-cols-4 md:grid-cols-5 gap-3 mb-4">
                {images.map((imgSrc, index) => (
                  <div key={index} className="relative group aspect-square">
                    <button
                        type="button"
                        onClick={() => onImageClick(imgSrc)}
                        className="w-full h-full block rounded-lg overflow-hidden border border-[var(--border-glass)]"
                    >
                        <img src={imgSrc} alt="" className="w-full h-full object-cover"/>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(index)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <XCircleIcon className="w-3 h-3"/>
                    </button>
                  </div>
                ))}
              </div>
            )}
            <input
              type="file"
              multiple
              accept="image/*"
              ref={imageInputRef}
              onChange={handleImageUpload}
              className="hidden"
              disabled={isProcessing}
            />
            <button
              type="button"
              onClick={() => imageInputRef.current?.click()}
              disabled={isProcessing}
              className="self-center flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors"
            >
              <ImageIcon className="w-4 h-4"/>
              {images.length > 0 ? 'Ajouter' : 'Images'}
            </button>
          </div>
        </div>

        {error && <p className="text-sm text-red-500 text-center font-medium">{error}</p>}
        
        <div className="flex justify-center pt-4">
          <button
            type="submit"
            disabled={isProcessing}
            className="glass-btn glass-btn-primary px-12 py-3 text-base w-full md:w-auto flex items-center justify-center gap-3 rounded-xl shadow-lg"
          >
            {isProcessing ? (
              <>
                <SpinnerIcon className="w-5 h-5" />
                Traitement...
              </>
            ) : (
              <>
                <PlusIcon className="w-5 h-5" />
                Générer
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateCardForm;