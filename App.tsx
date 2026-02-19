
import React, { useState, useRef, useMemo, useEffect } from 'react';
import type { Flashcard } from './types';
import FlashcardList from './components/FlashcardList';
import FlashcardView from './components/FlashcardView';
import CreateCardForm from './components/CreateCardForm';
import { PlusIcon, SaveIcon, LoadIcon, CardIcon, SearchIcon, SparklesIcon, FunnelIcon, DownloadIcon } from './components/icons';
import { formatAndCategorizeContent, formatContent } from './services/gemini';
import ConfirmationModal from './components/ConfirmationModal';
import MultiCardView from './components/MultiCardView';
import WelcomeView from './components/WelcomeView';
import ImageLightbox from './components/ImageLightbox';
import DownloadPromptModal from './components/DownloadPromptModal';

const STORAGE_KEY = 'flashcards-storage-v1';

const getInitialCards = (): Flashcard[] => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch (error) {
    console.error("Erreur lors de le chargement des cartes:", error);
    return [];
  }
};

type SortCriteria = 'date-desc' | 'date-asc' | 'alpha-asc' | 'alpha-desc';

const normalizeSearch = (str: string): string => 
    str
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();

const isValidFlashcard = (obj: any): obj is Flashcard => {
    return (
        typeof obj === 'object' &&
        obj !== null &&
        !Array.isArray(obj) &&
        typeof obj.id === 'string' &&
        typeof obj.title === 'string' &&
        typeof obj.content === 'string' &&
        typeof obj.createdAt === 'string' &&
        !isNaN(Date.parse(obj.createdAt)) &&
        typeof obj.updatedAt === 'string' &&
        !isNaN(Date.parse(obj.updatedAt)) &&
        Array.isArray(obj.tags) &&
        obj.tags.every((tag: any) => typeof tag === 'string') &&
        (obj.images === undefined || (Array.isArray(obj.images) && obj.images.every((img: any) => typeof img === 'string')))
    );
};

const App: React.FC = () => {
  const [cards, setCards] = useState<Flashcard[]>(getInitialCards);
  const [activeCardId, setActiveCardId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [cardToDelete, setCardToDelete] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortCriteria, setSortCriteria] = useState<SortCriteria>('date-desc');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState<boolean>(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Persistance automatique des cartes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cards));
  }, [cards]);

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 3000);
  };

  const handleSelectCard = (id: string) => {
    setActiveCardId(id);
    setIsCreating(false);
    setIsFilterOpen(false); 
  };

  const handleShowCreateForm = () => {
    setActiveCardId(null);
    setIsCreating(true);
    setIsFilterOpen(false); 
  };

  const handleCreateCard = async (title: string, content: string, images: string[]) => {
    setIsProcessing(true);
    try {
      const { content: formattedContent, tags } = await formatAndCategorizeContent(content);
      const now = new Date().toISOString();
      const newCard: Flashcard = {
        id: crypto.randomUUID(),
        title,
        content: formattedContent,
        createdAt: now,
        updatedAt: now,
        tags,
        images,
      };
      setCards(currentCards => [...currentCards, newCard]);
      setHasUnsavedChanges(true);
      setIsCreating(false);
      setActiveCardId(newCard.id);
      showNotification("Carte créée avec succès !");
    } catch (error) {
      console.error("Erreur lors de la création de la carte :", error);
      showNotification("Erreur lors du formatage du contenu.", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpdateCard = async (id: string, title: string, content: string, images: string[], tags: string[]) => {
    setIsProcessing(true);
    const originalCard = cards.find(c => c.id === id);
    if (!originalCard) {
      showNotification("Carte introuvable.", "error");
      setIsProcessing(false);
      return;
    }

    try {
      let contentToSave = originalCard.content;
      if (content !== originalCard.content) {
        contentToSave = await formatContent(content);
      }
      
      const now = new Date().toISOString();
      setCards(currentCards => currentCards.map(card => 
        card.id === id 
        ? { ...card, title, content: contentToSave, tags, updatedAt: now, images } 
        : card
      ));
      setHasUnsavedChanges(true);
      showNotification("Carte mise à jour !");
    } catch (error) {
       console.error("Erreur lors de la mise à jour de la carte :", error);
       showNotification("Erreur lors de la mise à jour de la carte.", "error");
    } finally {
        setIsProcessing(false);
    }
  };

  const handleDeleteCard = (id: string) => {
    setCardToDelete(id);
  };

  const confirmDelete = () => {
    if (!cardToDelete) return;
    setCards(currentCards => currentCards.filter(card => card.id !== cardToDelete));
    setHasUnsavedChanges(true);
    if (activeCardId === cardToDelete) {
        setActiveCardId(null);
    }
    showNotification("Carte supprimée.");
    setCardToDelete(null);
  };

  const cancelDelete = () => {
      setCardToDelete(null);
  };

  const handleExportCards = () => {
    if (cards.length === 0) {
      showNotification("Aucune carte à exporter.", "error");
      return;
    }
    const dataStr = JSON.stringify(cards, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    const timestamp = new Date().toISOString().slice(0, 10);
    link.download = `cartes-memoires-${timestamp}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setHasUnsavedChanges(false);
    showNotification("Cartes exportées avec succès !");
  };
  
  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result;
        if (typeof text !== 'string') {
          throw new Error('Le contenu du fichier est invalide.');
        }
        const importedData = JSON.parse(text);
        
        if (Array.isArray(importedData) && importedData.every(isValidFlashcard)) {
            setCards(currentCards => {
                const cardMap = new Map<string, Flashcard>(currentCards.map(c => [c.id, c]));
                
                (importedData as Flashcard[]).forEach((importedCard) => {
                    cardMap.set(importedCard.id, importedCard);
                });

                const mergedCards = Array.from(cardMap.values()).sort((a, b) => 
                    new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
                );
                
                // Ouvrir automatiquement la première carte de la liste fusionnée/importée
                if (mergedCards.length > 0) {
                  setActiveCardId(mergedCards[0].id);
                  setIsCreating(false);
                  setIsFilterOpen(false);
                }

                return mergedCards;
            });
            // Ne pas marquer comme "non sauvegardé" juste après un import
            setHasUnsavedChanges(false);
            showNotification(`${importedData.length} cartes importées.`);
        } else {
          throw new Error('Le format du fichier JSON est incorrect.');
        }
      } catch (error) {
        console.error("Erreur lors de l'importation du fichier", error);
        showNotification((error as Error).message || "Erreur : Le fichier est invalide.", "error");
      } finally {
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    };
    reader.readAsText(file);
  };

  const handleTagSelect = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag) 
        : [...prev, tag] 
    );
  };

  const handleSortChange = (type: 'date' | 'alpha') => {
    if (type === 'date') {
      if (sortCriteria.startsWith('date')) {
        setSortCriteria(sortCriteria === 'date-desc' ? 'date-asc' : 'date-desc');
      } else {
        setSortCriteria('date-desc');
      }
    } else if (type === 'alpha') {
      if (sortCriteria.startsWith('alpha')) {
        setSortCriteria(sortCriteria === 'alpha-asc' ? 'alpha-desc' : 'alpha-asc');
      } else {
        setSortCriteria('alpha-asc');
      }
    }
  };

  const handleSelectRandomCard = () => {
    if (cards.length === 0) {
      showNotification("Aucune carte à afficher.", "error");
      return;
    }
    let potentialCards = cards;
    if (cards.length > 1 && activeCardId) {
        potentialCards = cards.filter(c => c.id !== activeCardId);
    }
    
    const randomIndex = Math.floor(Math.random() * potentialCards.length);
    const randomCard = potentialCards[randomIndex];
    handleSelectCard(randomCard.id);
  };

  const handleToggleFilter = () => {
      setIsFilterOpen(!isFilterOpen);
      if (!isFilterOpen) {
          setActiveCardId(null);
          setIsCreating(false);
      }
  };

  const allTags = useMemo(() => {
    const tagsSet = new Set<string>();
    cards.forEach(card => card.tags.forEach(tag => tagsSet.add(tag)));
    return Array.from(tagsSet).sort((a, b) => a.localeCompare(b, 'fr'));
  }, [cards]);

  const filteredCards = useMemo(() => {
    const normalizedSearchTerm = normalizeSearch(searchTerm);

    return cards.filter(card => {
        const matchesSearch = !searchTerm.trim() || 
            normalizeSearch(card.title).includes(normalizedSearchTerm) ||
            normalizeSearch(card.content).includes(normalizedSearchTerm) ||
            card.tags.some(tag => normalizeSearch(tag).includes(normalizedSearchTerm));
        
        if (!matchesSearch) return false;

        const matchesTags = selectedTags.length === 0 || 
            selectedTags.every(tag => card.tags.includes(tag));
        
        return matchesTags;
    });
  }, [cards, searchTerm, selectedTags]);
  
  const sortedAndFilteredCards = useMemo(() => {
    const sorted = [...filteredCards];
    switch (sortCriteria) {
      case 'date-asc':
        sorted.sort((a, b) => new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime());
        break;
      case 'date-desc':
        sorted.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
        break;
      case 'alpha-asc':
        sorted.sort((a, b) => a.title.localeCompare(b.title, 'fr', { sensitivity: 'base' }));
        break;
      case 'alpha-desc':
        sorted.sort((a, b) => b.title.localeCompare(a.title, 'fr', { sensitivity: 'base' }));
        break;
    }
    return sorted;
  }, [filteredCards, sortCriteria]);

  const activeCard = cards.find(card => card.id === activeCardId) || null;
  const cardForDeletion = cardToDelete ? cards.find(c => c.id === cardToDelete) : null;

  const hasCards = cards.length > 0;
  const hasSearchResults = sortedAndFilteredCards.length > 0;
  const isSearching = searchTerm.length > 0;
  const isFilteringByTag = selectedTags.length > 0;

  const renderMainContent = () => {
    if (isFilterOpen) {
        return (
            <div className="h-full flex flex-col animate-fade-in p-1">
                <div className="glass-panel p-8 h-full overflow-y-auto border-white/50">
                    <div className="flex justify-between items-center mb-8 pb-4 border-b border-[var(--border-glass)]">
                        <div>
                            <h2 className="text-2xl font-bold text-[var(--text-main)] tracking-tight">Filtres</h2>
                            <p className="text-[var(--text-secondary)] mt-1 text-sm">Sélectionnez des tags pour filtrer votre liste de cartes.</p>
                        </div>
                        {selectedTags.length > 0 && (
                            <button
                                onClick={() => setSelectedTags([])}
                                className="glass-btn px-4 py-2 text-xs font-semibold text-red-500 hover:text-red-600 flex items-center gap-2 border-red-500/20"
                            >
                                <span className="text-sm">&times;</span> Tout effacer
                            </button>
                        )}
                    </div>

                    {allTags.length > 0 ? (
                         <div className="flex flex-wrap gap-2 content-start">
                            {allTags.map(tag => {
                            const isSelected = selectedTags.includes(tag);
                            return (
                                <button
                                    key={tag}
                                    onClick={() => handleTagSelect(tag)}
                                    className={`glass-tag px-4 py-2 transition-all duration-300 ${
                                        isSelected
                                        ? 'active'
                                        : ''
                                    }`}
                                >
                                    #{tag}
                                </button>
                            );
                            })}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-64 text-[var(--text-muted)] italic">
                             <p>Aucun tag disponible.</p>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    if (isCreating) {
      return <CreateCardForm onCreate={handleCreateCard} isProcessing={isProcessing} onImageClick={setLightboxImage} />;
    }
    if (activeCard) {
      return <FlashcardView card={activeCard} onUpdate={handleUpdateCard} onDelete={handleDeleteCard} isProcessing={isProcessing} searchTerm={searchTerm} onImageClick={setLightboxImage} />;
    }
    if (isFilteringByTag && hasSearchResults) {
      return <MultiCardView cards={sortedAndFilteredCards} searchTerm={searchTerm} onImageClick={setLightboxImage} />;
    }
    return <WelcomeView onImport={handleImportClick} />;
  };

  return (
    <div className="h-screen flex flex-col p-3 md:p-5 gap-4 relative font-sans text-[var(--text-main)] overflow-hidden">
       
       {notification && (
        <div className={`absolute top-20 left-1/2 transform -translate-x-1/2 px-5 py-3 rounded-2xl shadow-2xl border animate-fade-in z-50 text-sm font-medium backdrop-blur-xl ${notification.type === 'error' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-white text-[var(--accent-primary)] border-gray-200'}`}>
          {notification.message}
        </div>
      )}
      <ConfirmationModal
        isOpen={!!cardForDeletion}
        onClose={cancelDelete}
        onConfirm={confirmDelete}
        title="Supprimer la carte"
        message={
            <>
                Supprimer <strong className="text-[var(--text-main)]">"{cardForDeletion?.title}"</strong> ?
                <br />
                Cette action est définitive.
            </>
        }
      />
      <DownloadPromptModal />
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileImport}
        accept=".json"
        className="hidden"
      />
      {lightboxImage && <ImageLightbox src={lightboxImage} onClose={() => setLightboxImage(null)} />}

      {/* TOP BAR / HEADER */}
      <header className="glass-panel px-6 py-4 flex items-center justify-between shrink-0 z-20 relative !rounded-2xl">
        <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-white/70 shadow-sm border border-white">
                <CardIcon className="w-5 h-5 text-[var(--accent-primary)]"/>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-[var(--text-main)]">FlashCards<span className="text-[var(--accent-primary)]">.AI</span></h1>
        </div>

        <div className="flex items-center gap-2 md:gap-3">
            <button
              onClick={handleToggleFilter}
              className={`glass-btn px-4 py-2 text-sm flex items-center gap-2 ${isFilterOpen ? 'border-[var(--accent-primary)] text-[var(--accent-primary)] bg-[var(--accent-bg)]' : (selectedTags.length > 0 ? 'text-[var(--accent-primary)]' : '')}`}
            >
              <FunnelIcon className="w-4 h-4" />
              <span className="hidden sm:inline">Filtres {selectedTags.length > 0 && `(${selectedTags.length})`}</span>
            </button>

             <button
              onClick={handleSelectRandomCard}
              disabled={cards.length === 0}
              className="glass-btn px-4 py-2 text-sm flex items-center gap-2"
            >
              <SparklesIcon className="w-4 h-4" />
              <span className="hidden sm:inline">Aléatoire</span>
            </button>
            
            <button
                onClick={handleShowCreateForm}
                className="glass-btn glass-btn-primary px-6 py-2 text-sm flex items-center gap-2 !rounded-xl"
            >
                <PlusIcon className="w-4 h-4"/>
                <span className="hidden sm:inline font-bold">Créer</span>
            </button>

            <div className="h-6 w-px bg-[var(--border-glass)] mx-1"></div>

            <button onClick={handleImportClick} className="glass-btn-icon w-10 h-10" title="Importer">
                <DownloadIcon className="w-4 h-4"/>
            </button>
            <button 
                onClick={handleExportCards} 
                className={`glass-btn-icon w-10 h-10 transition-all duration-300 ${hasUnsavedChanges ? '!text-rose-600 !bg-rose-50 !border-rose-200 !shadow-[0_0_10px_rgba(225,29,72,0.2)]' : ''}`} 
                title={hasUnsavedChanges ? "Modifications en attente. Cliquez pour sauvegarder." : "Exporter"}
            >
                <LoadIcon className="w-4 h-4"/>
            </button>
        </div>
      </header>
      

      {/* MAIN BODY */}
      <div className="flex-1 flex overflow-hidden gap-4">
        {/* SIDEBAR: LISTE */}
        <aside className="w-80 flex flex-col shrink-0 glass-panel p-5 gap-5 z-10 !rounded-2xl">
            
            {/* Search */}
            <div className="relative shrink-0">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <SearchIcon className="w-4 h-4 text-[var(--text-muted)]" />
                </div>
                <input
                    type="search"
                    placeholder="Rechercher..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="glass-input w-full pl-10 pr-4 py-3 text-sm font-medium"
                />
            </div>

            {/* LISTE CARTES */}
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                <div className="flex items-center justify-between mb-3 px-1 shrink-0">
                    <h2 className="text-[11px] font-bold uppercase text-[var(--text-muted)] tracking-widest">Bibliothèque</h2>
                    <div className="flex gap-1">
                        <button 
                            onClick={() => handleSortChange('date')} 
                            className={`px-2 py-1 rounded-md text-[10px] font-bold transition-colors ${sortCriteria.startsWith('date') ? 'bg-[var(--accent-bg)] text-[var(--accent-primary)]' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'}`}
                        >
                            DATE
                        </button>
                        <button 
                            onClick={() => handleSortChange('alpha')} 
                            className={`px-2 py-1 rounded-md text-[10px] font-bold transition-colors ${sortCriteria.startsWith('alpha') ? 'bg-[var(--accent-bg)] text-[var(--accent-primary)]' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'}`}
                        >
                            A-Z
                        </button>
                    </div>
                </div>
                <div className="flex-grow overflow-hidden flex flex-col -mx-2 px-2">
                    {hasSearchResults ? (
                        <FlashcardList cards={sortedAndFilteredCards} activeCardId={activeCardId} onSelectCard={handleSelectCard} searchTerm={searchTerm} />
                    ) : (
                        <div className="text-[var(--text-muted)] text-xs text-center flex-grow flex flex-col items-center justify-center">
                            {(isSearching || isFilteringByTag) && hasCards ? <p>Aucun résultat.</p> : <p>Liste vide.</p>}
                        </div>
                    )}
                </div>
            </div>
        </aside>

        {/* MAIN CONTENT */}
        <main className="flex-1 h-full overflow-hidden relative">
            <div className="h-full overflow-y-auto scrollbar-hide rounded-2xl">
                {renderMainContent()}
            </div>
        </main>
      </div>
    </div>
  );
};

export default App;
