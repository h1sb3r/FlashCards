import React, { useState, useEffect, useMemo, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Flashcard } from '../types';
import { PencilIcon, TrashIcon, SaveIcon, SpinnerIcon, ImageIcon, XCircleIcon, PlusIcon, ChevronDownIcon, ChevronUpIcon } from './icons';
import SortableTable from './SortableTable';
import Highlight from './Highlight';

interface FlashcardViewProps {
  card: Flashcard;
  onUpdate: (id: string, title: string, content: string, images: string[], tags: string[]) => void;
  onDelete: (id: string) => void;
  isProcessing: boolean;
  searchTerm: string;
  onImageClick: (src: string) => void;
}

const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });

const FlashcardView: React.FC<FlashcardViewProps> = ({ card, onUpdate, onDelete, isProcessing, searchTerm, onImageClick }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const [editedContent, setEditedContent] = useState('');
  const [editedImages, setEditedImages] = useState<string[]>([]);
  const [editedTags, setEditedTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [showQuickTagInput, setShowQuickTagInput] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [showMetadata, setShowMetadata] = useState(false);

  const imageInputRef = useRef<HTMLInputElement>(null);
  const quickTagInputRef = useRef<HTMLInputElement>(null);


  useEffect(() => {
    if (card) {
      setEditedTitle(card.title);
      setEditedContent(card.content);
      setEditedImages(card.images || []);
      setEditedTags(card.tags || []);
      
      if(!isProcessing) {
        setIsEditing(false);
        setShowQuickTagInput(false);
        setNewTag('');
      }
    }
  }, [card, isProcessing]);
  
  useEffect(() => {
    if (showQuickTagInput) {
        quickTagInputRef.current?.focus();
    }
  }, [showQuickTagInput]);

  const markdownComponents = useMemo(() => {
    if (!searchTerm.trim()) {
        return { table: SortableTable };
    }

    const createHighlightedRenderer = (Component: keyof React.JSX.IntrinsicElements) => {
        const Renderer = ({ node, ...props }: any) => {
            const children = React.Children.map(props.children, child => 
                typeof child === 'string' ? <Highlight text={child} highlight={searchTerm} /> : child
            );
            return React.createElement(Component, props, children);
        };
        return Renderer;
    };

    return {
        table: SortableTable,
        code: ({ node, ...props }: any) => <code {...props} />,
        p: createHighlightedRenderer('p'),
        li: createHighlightedRenderer('li'),
        th: createHighlightedRenderer('th'),
        td: createHighlightedRenderer('td'),
        em: createHighlightedRenderer('em'),
        strong: createHighlightedRenderer('strong'),
        blockquote: createHighlightedRenderer('blockquote'),
    };
  }, [searchTerm]);

  const handleSave = () => {
    if (card && editedTitle.trim() && editedContent.trim()) {
      onUpdate(card.id, editedTitle, editedContent, editedImages, editedTags);
    }
  };

  const handleDelete = () => {
    if (card) {
      onDelete(card.id);
    }
  };

  const handleCancel = () => {
    if (card) {
        setEditedTitle(card.title);
        setEditedContent(card.content);
        setEditedImages(card.images || []);
        setEditedTags(card.tags || []);
        setIsEditing(false);
    }
  }
  
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      if (files.length === 0) return;
      
      try {
        const base64Promises = files.map(fileToBase64);
        const base64Images = await Promise.all(base64Promises);
        setEditedImages(prevImages => [...prevImages, ...base64Images]);
      } catch (err) {
        console.error("Error converting images to base64", err);
      } finally {
        if(e.target) e.target.value = '';
      }
    }
  };

  const handleRemoveImage = (index: number) => {
    setEditedImages(prevImages => prevImages.filter((_, i) => i !== index));
  };

  const handleAddEditedTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      const newTag = tagInput.trim();
      if (!editedTags.includes(newTag)) {
        setEditedTags([...editedTags, newTag]);
      }
      setTagInput('');
    }
  };

  const handleRemoveEditedTag = (tagToRemove: string) => {
    setEditedTags(editedTags.filter(tag => tag !== tagToRemove));
  };
  
  const handleQuickAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && newTag.trim()) {
        e.preventDefault();
        const tagToAdd = newTag.trim();
        if (card && !card.tags.includes(tagToAdd)) {
            onUpdate(card.id, card.title, card.content, card.images || [], [...card.tags, tagToAdd]);
        } else {
             setShowQuickTagInput(false);
             setNewTag('');
        }
    }
    if (e.key === 'Escape') {
        e.preventDefault();
        setShowQuickTagInput(false);
        setNewTag('');
    }
  };


  if (isEditing) {
    return (
      <div className="glass-panel p-6 md:p-8 h-full flex flex-col animate-fade-in">
        <h2 className="text-lg font-semibold text-[var(--text-main)] mb-6 flex items-center gap-2 tracking-tight">
            <PencilIcon className="w-5 h-5 text-[var(--accent-primary)]" /> 
            Mode Édition
        </h2>
        <div className="space-y-6 flex-grow flex flex-col overflow-y-auto pr-2 custom-scrollbar">
            <div>
              <label className="block text-[11px] font-bold text-[var(--text-muted)] mb-2 uppercase tracking-wider">Titre</label>
              <input
                type="text"
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                className="w-full px-4 py-3 glass-input font-bold text-lg"
                disabled={isProcessing}
              />
            </div>
            <div className="flex-grow flex flex-col">
                <label className="block text-[11px] font-bold text-[var(--text-muted)] mb-2 uppercase tracking-wider">Contenu</label>
                <textarea
                    value={editedContent}
                    onChange={(e) => setEditedContent(e.target.value)}
                    className="w-full flex-grow px-4 py-3 glass-input leading-relaxed font-mono text-sm resize-none"
                    disabled={isProcessing}
                ></textarea>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-[var(--text-muted)] mb-2 uppercase tracking-wider">Tags</label>
              <div className="flex flex-wrap items-center gap-2 p-3 glass-input min-h-[50px]">
                {editedTags.map(tag => (
                    <span key={tag} className="glass-tag active flex items-center gap-2 pl-3 pr-2 py-1 bg-[var(--accent-bg)] text-[var(--accent-primary)] border-transparent">
                        {tag}
                        <button
                            type="button"
                            onClick={() => handleRemoveEditedTag(tag)}
                            className="text-[var(--accent-primary)] hover:text-red-500 transition-colors"
                            disabled={isProcessing}
                        >
                            <XCircleIcon className="w-4 h-4" />
                        </button>
                    </span>
                ))}
                <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleAddEditedTag}
                    placeholder="Ajouter..."
                    className="flex-grow bg-transparent text-sm p-1 min-w-[80px] text-[var(--text-main)] placeholder-[var(--text-muted)] outline-none"
                    disabled={isProcessing}
                />
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-[var(--text-muted)] mb-2 uppercase tracking-wider">Images</label>
              <div className="glass-input p-4 border-dashed border-[var(--border-glass)]">
                {editedImages.length > 0 && (
                  <div className="grid grid-cols-4 gap-3 mb-4">
                    {editedImages.map((imgSrc, index) => (
                      <div key={index} className="relative group aspect-square">
                         <img src={imgSrc} alt="" className="w-full h-full object-cover rounded-lg border border-[var(--border-glass)] shadow-sm"/>
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(index)}
                           className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-lg opacity-0 group-hover:opacity-100 transition-all"
                           disabled={isProcessing}
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
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors"
                >
                  <ImageIcon className="w-4 h-4"/>
                  Gérer les images
                </button>
              </div>
            </div>
        </div>
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-[var(--border-glass)]">
            <button
                onClick={handleCancel}
                disabled={isProcessing}
                className="glass-btn px-5 py-2 text-[var(--text-muted)] hover:text-[var(--text-main)] text-sm"
            >
                Annuler
            </button>
            <button
                onClick={handleSave}
                disabled={isProcessing}
                className="glass-btn glass-btn-primary px-5 py-2 text-sm flex items-center gap-2"
            >
              {isProcessing ? <SpinnerIcon className="w-4 h-4" /> : <SaveIcon className="w-4 h-4" />}
              Enregistrer
            </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full overflow-hidden gap-4 animate-scale-in">
        
        {/* HEADER ZONE - SEPARATED PANEL */}
        <div className="glass-panel p-6 md:p-8 shrink-0 relative z-30">
             
             {/* Actions buttons - Absolute position Top-Right */}
            <div className="absolute top-6 right-6 flex gap-2 z-30">
                <button 
                    onClick={() => setShowMetadata(!showMetadata)} 
                    className={`glass-btn-icon w-10 h-10 hover:bg-black/5 ${showMetadata ? 'text-[var(--accent-primary)] bg-[var(--accent-bg)]' : ''}`}
                    title={showMetadata ? "Masquer les détails" : "Afficher les détails"}
                >
                    {showMetadata ? <ChevronUpIcon className="w-4 h-4" /> : <ChevronDownIcon className="w-4 h-4" />}
                </button>
                <button 
                    onClick={() => setIsEditing(true)} 
                    className="glass-btn-icon w-10 h-10 hover:bg-[var(--accent-bg)] hover:text-[var(--accent-primary)]"
                    title="Modifier"
                >
                    <PencilIcon className="w-4 h-4" />
                </button>
                <button 
                    onClick={handleDelete}
                    className="glass-btn-icon w-10 h-10 hover:bg-red-500/10 hover:text-red-500"
                    title="Supprimer"
                >
                    <TrashIcon className="w-4 h-4" />
                </button>
            </div>

            {/* Main Header Content */}
            <div className="flex flex-col md:flex-row justify-between items-start gap-6 pt-2">
                 {/* LEFT: Title Area */}
                 <div className="w-full pr-32">
                     {/* Fond #2C2C2C pour le titre (couleur sombre de la palette) */}
                     <h1 className="text-3xl md:text-4xl font-extrabold text-white bg-[#2C2C2C] px-6 py-3 rounded-2xl shadow-lg leading-tight tracking-tight inline-block backdrop-blur-sm">
                        <Highlight text={card.title} highlight={searchTerm} />
                    </h1>
                 </div>

                {/* RIGHT: Metadata Zone (Date & Tags) - ABSOLUTE POSITION OVERLAY to prevent shifts */}
                {showMetadata && (
                    <div className="absolute top-[80px] right-6 z-50 animate-fade-in w-auto max-w-[320px]">
                        <div className="bg-white/80 backdrop-blur-xl p-5 shadow-2xl border border-[var(--border-glass)] rounded-2xl flex flex-col gap-4 items-end">
                            {/* Date Badge */}
                            <div className="flex items-center gap-2 bg-[var(--bg-app)] px-3 py-1.5 rounded-lg border border-[var(--border-glass)]">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Modifié le</span>
                                <time dateTime={card.updatedAt} className="font-medium text-[var(--text-main)] text-xs">
                                    {new Date(card.updatedAt).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}
                                </time>
                            </div>

                            {/* Tags List */}
                            <div className="flex flex-wrap justify-end items-center gap-2">
                                {card.tags.map(tag => (
                                    <span key={tag} className="glass-tag text-xs bg-white text-[var(--text-main)] border-[var(--border-glass)]">
                                        {tag}
                                    </span>
                                ))}
                                
                                {showQuickTagInput ? (
                                    <input
                                        ref={quickTagInputRef}
                                        type="text"
                                        value={newTag}
                                        onChange={e => setNewTag(e.target.value)}
                                        onKeyDown={handleQuickAddTag}
                                        onBlur={() => {
                                            setNewTag('');
                                            setShowQuickTagInput(false);
                                        }}
                                        className="glass-input px-3 py-1.5 text-xs w-28 border-[var(--accent-primary)]"
                                        placeholder="Tag..."
                                        disabled={isProcessing}
                                    />
                                ) : (
                                    <button
                                        type="button"
                                        onClick={() => setShowQuickTagInput(true)}
                                        className="glass-btn-icon w-8 h-8 border-dashed border-[var(--text-muted)] hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)]"
                                        disabled={isProcessing}
                                        title="Ajouter un tag"
                                    >
                                        <PlusIcon className="w-3.5 h-3.5" />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>

        {/* CONTENT ZONE - SEPARATED PANEL */}
        <div className="glass-panel p-8 md:p-10 flex-1 overflow-y-auto custom-scrollbar">
            <div className="prose max-w-none mb-12">
                <ReactMarkdown 
                    remarkPlugins={[remarkGfm]}
                    components={markdownComponents}
                >
                    {card.content}
                </ReactMarkdown>
            </div>

            {card.images && card.images.length > 0 && (
                <div className="mt-12 pt-8 border-t border-[var(--border-glass)]">
                <h3 className="text-xs font-bold text-[var(--text-muted)] mb-6 uppercase tracking-widest flex items-center gap-2">
                    <ImageIcon className="w-4 h-4" /> Galerie
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {card.images.map((imgSrc, index) => (
                    <button
                        type="button"
                        onClick={() => onImageClick(imgSrc)}
                        key={index}
                        className="block group aspect-[4/3] overflow-hidden rounded-2xl border border-[var(--border-glass)] hover:border-[var(--accent-primary)] transition-all duration-300 bg-white shadow-sm"
                    >
                        <img 
                        src={imgSrc} 
                        alt=""
                        className="object-cover w-full h-full opacity-95 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
                        />
                    </button>
                    ))}
                </div>
                </div>
            )}
        </div>
    </div>
  );
};

export default FlashcardView;