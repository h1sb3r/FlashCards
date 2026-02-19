import React, { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Flashcard } from '../types';
import Highlight from './Highlight';
import SortableTable from './SortableTable';

interface MultiCardViewProps {
  cards: Flashcard[];
  searchTerm: string;
  onImageClick: (src: string) => void;
}

const MultiCardView: React.FC<MultiCardViewProps> = ({ cards, searchTerm, onImageClick }) => {
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

  return (
    <div className="h-full overflow-y-auto animate-fade-in pb-8 p-4 custom-scrollbar">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
        {cards.map((card) => (
          <article key={card.id} className="glass-panel p-6 md:p-8 hover:border-[var(--accent-primary)] hover:shadow-[0_8px_32px_rgba(91,180,221,0.2)] transition-all duration-300 group relative">
            
            <div className="flex justify-between items-start mb-4">
                {/* Badge titre en #2C2C2C */}
                <h1 className="text-lg font-bold text-white bg-[#2C2C2C] px-3 py-1.5 rounded-lg tracking-tight shadow-sm inline-block">
                    <Highlight text={card.title} highlight={searchTerm} />
                </h1>
                <time dateTime={card.updatedAt} className="text-[10px] text-[var(--text-muted)] font-medium bg-white/50 px-2 py-1 rounded-md border border-[var(--border-glass)]">
                    {new Date(card.updatedAt).toLocaleDateString()}
                </time>
            </div>
            
            <div className="flex flex-wrap gap-2 mb-5">
                {card.tags.slice(0, 3).map(tag => (
                  <span key={tag} className="glass-tag text-xs">
                    #{tag}
                  </span>
                ))}
                {card.tags.length > 3 && <span className="text-xs text-[var(--text-muted)] self-center">+{card.tags.length - 3}</span>}
            </div>

            <div className="glass-input p-5 border-0 bg-white/40 max-h-48 overflow-hidden relative" style={{maskImage: 'linear-gradient(to bottom, black 60%, transparent 100%)', WebkitMaskImage: 'linear-gradient(to bottom, black 60%, transparent 100%)'}}>
                <ReactMarkdown
                className="prose max-w-none text-sm"
                remarkPlugins={[remarkGfm]}
                components={markdownComponents}
                >
                {card.content}
                </ReactMarkdown>
            </div>

            {card.images && card.images.length > 0 && (
                <div className="mt-4 pt-4 border-t border-[var(--border-glass)] flex gap-2 overflow-x-auto pb-1 custom-scrollbar">
                    {card.images.map((imgSrc, index) => (
                        <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); onImageClick(imgSrc); }}
                            key={index}
                            className="block flex-shrink-0 w-16 h-16 overflow-hidden rounded-lg border border-[var(--border-glass)] hover:border-[var(--accent-primary)] hover:scale-105 transition-all"
                        >
                            <img
                                src={imgSrc}
                                alt=""
                                className="object-cover w-full h-full"
                            />
                        </button>
                    ))}
                </div>
            )}
          </article>
        ))}
      </div>
    </div>
  );
};

export default MultiCardView;