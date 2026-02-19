import React from 'react';

interface TagFilterProps {
  allTags: string[];
  selectedTags: string[];
  onTagClick: (tag: string) => void;
}

const TagFilter: React.FC<TagFilterProps> = ({ allTags, selectedTags, onTagClick }) => {
  return (
    <div className="flex flex-wrap gap-2 px-1 py-2">
      {allTags.map(tag => {
        const isSelected = selectedTags.includes(tag);
        return (
          <button
            key={tag}
            onClick={() => onTagClick(tag)}
            className={`neu-tag transition-all duration-200 hover:text-indigo-500 ${
              isSelected
                ? 'active font-semibold'
                : 'opacity-80 hover:opacity-100'
            }`}
          >
            {tag}
          </button>
        );
      })}
    </div>
  );
};

export default TagFilter;