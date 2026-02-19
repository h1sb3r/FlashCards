import React from 'react';
import type { Flashcard } from '../types';
import Highlight from './Highlight';

interface FlashcardListProps {
  cards: Flashcard[];
  activeCardId: string | null;
  onSelectCard: (id: string) => void;
  searchTerm: string;
}

const FlashcardList: React.FC<FlashcardListProps> = ({ cards, activeCardId, onSelectCard, searchTerm }) => {
  return (
    <nav className="flex-1 space-y-2 overflow-y-auto pb-2 pr-1 custom-scrollbar">
      {cards.length > 0 ? (
        cards.map((card) => {
          const isActive = activeCardId === card.id;
          return (
            <button
              key={card.id}
              onClick={() => onSelectCard(card.id)}
              className={`w-full text-left px-5 py-4 rounded-xl transition-all duration-200 ease-out group relative border backdrop-blur-sm ${
                isActive
                  ? 'bg-white shadow-lg border-white/50 border-l-[4px] border-l-[var(--accent-primary)]'
                  : 'bg-white/10 border-transparent hover:bg-white/30 hover:border-white/30'
              }`}
            >
              <div className="flex justify-between items-center gap-2">
                  <h3 className={`font-medium text-sm leading-snug truncate transition-colors ${isActive ? 'text-[var(--text-main)] font-bold' : 'text-[var(--text-main)] opacity-80 group-hover:opacity-100'}`}>
                    <Highlight text={card.title} highlight={searchTerm} />
                  </h3>
              </div>
            </button>
          );
        })
      ) : null }
    </nav>
  );
};

export default FlashcardList;