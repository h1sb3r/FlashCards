import { GoogleGenAI, Type } from "@google/genai";

// FIX: Initialized GoogleGenAI directly with process.env.API_KEY as per the guidelines.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const model = 'gemini-2.5-flash';

interface FormattedResult {
  content: string;
  tags: string[];
}

/**
 * Formats the given raw text content using the Gemini API, without affecting tags.
 * @param rawContent The raw text content to process.
 * @returns A promise that resolves to the formatted content string.
 */
export async function formatContent(rawContent: string): Promise<string> {
  const prompt = `Vous êtes un expert en design d'information. Votre tâche est de prendre le texte brut suivant et le formater en utilisant Markdown pour une clarté, une structure et une lisibilité optimales (titres, listes, tableaux, etc.).

Règles impératives :
1.  **INTÉGRALITÉ :** Vous devez restituer l'intégralité du contenu original. Ne résumez pas, ne coupez pas, ne tronquez pas et ne supprimez aucune information. Tout le texte d'entrée doit se retrouver dans la sortie, mais mieux présenté.
2.  **FORMAT :** Ne jamais ajouter de phrase d'introduction au début du contenu formaté. Le résultat doit commencer directement par le contenu lui-même.
3.  Le résultat doit être la chaîne de caractères formatée, sans aucun commentaire ou texte additionnel.

Voici le contenu à traiter :
---
${rawContent}
---`;

  try {
    const response = await ai.models.generateContent({
        model: model,
        contents: prompt,
        config: {
            maxOutputTokens: 8192, // Ensure ample space for long content
        }
    });
    
    const formattedContent = response.text;
    
    // Fallback to raw content if Gemini returns an empty response
    return formattedContent || rawContent;
  } catch (error) {
    console.error("Error calling Gemini API for content formatting:", error);
    // In case of an error, re-throw to let the caller handle it.
    throw new Error("Failed to format content with Gemini API.");
  }
}


/**
 * Formats the given raw text content and generates relevant tags using the Gemini API.
 * @param rawContent The raw text content to process.
 * @returns A promise that resolves to an object containing the formatted content and an array of tags.
 */
export async function formatAndCategorizeContent(rawContent: string): Promise<{ content: string; tags: string[] }> {
  const prompt = `Vous êtes un expert en design d'information et en classification. Votre tâche est double :
1.  Prendre le texte brut suivant et le formater en utilisant Markdown pour une clarté, une structure et une lisibilité optimales (titres, listes, tableaux, etc.).
2.  Identifier 2 à 4 catégories ou mots-clés pertinents pour ce contenu.

Règles impératives :
1.  **INTÉGRALITÉ :** Le contenu généré dans le champ "content" doit correspondre à TOUT le texte original. **Ne tronquez pas le texte.** Si le texte est long, reformatez-le entièrement. Ne faites pas de résumé.
2.  Ne jamais ajouter de phrase d'introduction.
3.  Le résultat doit être un objet JSON valide avec "content" et "tags".

Voici le contenu à traiter :
---
${rawContent}
---`;

  try {
    const response = await ai.models.generateContent({
        model: model,
        contents: prompt,
        config: {
          maxOutputTokens: 8192, // Ensure ample space for long content
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              content: {
                type: Type.STRING,
                description: "Le contenu original complet, reformaté en Markdown, sans perte d'information."
              },
              tags: {
                type: Type.ARRAY,
                description: "Un tableau de 2 à 4 catégories ou mots-clés pertinents pour le contenu.",
                items: {
                  type: Type.STRING
                }
              }
            },
            required: ["content", "tags"]
          }
        }
    });
    
    const resultText = response.text;
    const resultJson: FormattedResult = JSON.parse(resultText);

    if (!resultJson.content) {
      console.warn("Gemini response is missing content, returning original content.");
      resultJson.content = rawContent;
    }
    if (!resultJson.tags || resultJson.tags.length === 0) {
        console.warn("Gemini response is missing tags, returning empty array.");
        resultJson.tags = [];
    }
    
    return resultJson;
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    // En cas d'erreur, rejeter la promesse pour que l'appelant puisse la gérer.
    throw new Error("Failed to format content with Gemini API.");
  }
}