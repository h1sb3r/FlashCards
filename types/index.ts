export interface CardDto {
  id: string;
  title: string;
  content: string;
  tags: string[];
  images: string[];
  createdAt: string;
  updatedAt: string;
  version: number;
}

export interface CardPayload {
  title: string;
  content: string;
  tags: string[];
  images: string[];
}

export interface CardsResponse {
  cards: CardDto[];
  availableTags: string[];
}

export interface AssistResponse {
  content: string;
  tags: string[];
  assisted: boolean;
  provider: 'gemini' | 'local';
}

export interface ImportPayload {
  cards: CardDto[];
  strategy?: 'merge' | 'replace';
}