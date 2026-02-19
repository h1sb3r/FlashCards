import React from 'react';

interface HighlightProps {
  text: string;
  highlight: string;
}

// Aide pour échapper les caractères spéciaux des expressions régulières
const escapeRegExp = (str: string) => {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

/**
 * Crée une expression régulière insensible à la casse et aux accents.
 * @param str La chaîne de recherche.
 * @returns Une RegExp ou null si la chaîne est vide.
 */
const createAccentInsensitiveRegex = (str: string): RegExp | null => {
    if (!str.trim()) return null;

    // Carte des caractères de base vers une classe de caractères regex incluant les versions accentuées
    const accentMap: { [base: string]: string } = {
        'a': '[aàáâãäå]', 'c': '[cç]', 'e': '[eèéêë]', 'i': '[iìíîï]', 
        'n': '[nñ]', 'o': '[oòóôõö]', 'u': '[uùúûü]', 'y': '[yÿ]',
    };

    const regexString = Array.from(escapeRegExp(str)).map(char => {
        const lowerChar = char.toLowerCase();
        return accentMap[lowerChar] || char; // Utilise la carte si disponible, sinon le caractère original
    }).join('');
    
    return new RegExp(`(${regexString})`, 'gi');
}

const Highlight: React.FC<HighlightProps> = ({ text, highlight }) => {
  if (!highlight.trim() || !text) {
    return <>{text}</>;
  }
  
  const regex = createAccentInsensitiveRegex(highlight);

  if (!regex) {
    return <>{text}</>;
  }

  const parts = text.split(regex);

  return (
    <>
      {parts.map((part, i) =>
        // Les parties qui correspondent à la regex sont aux indices impairs
        i % 2 === 1 ? (
          <mark key={i} className="bg-yellow-200 text-slate-800 rounded-sm">
            {part}
          </mark>
        ) : (
          <React.Fragment key={i}>{part}</React.Fragment>
        )
      )}
    </>
  );
};

export default Highlight;
