import { GoogleGenAI } from '@google/genai';
import { Product } from '../types';

let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI | null {
  if (!aiClient) {
    const apiKey = import.meta.env.GEMINI_API_KEY || (typeof process !== 'undefined' ? process.env.GEMINI_API_KEY : '');
    if (apiKey) {
      aiClient = new GoogleGenAI({ apiKey });
    }
  }
  return aiClient;
}

export const aiAssistant = {
  // 1. AI Smart Search & Recommendations
  async smartSearch(query: string, products: Product[]): Promise<Product[]> {
    const ai = getAiClient();
    const cleanQuery = query.toLowerCase().trim();
    if (!cleanQuery) return products;

    // Fast local fallback match
    const localMatches = products.filter((p) =>
      p.title.toLowerCase().includes(cleanQuery) ||
      p.categoryName.toLowerCase().includes(cleanQuery) ||
      p.description.toLowerCase().includes(cleanQuery) ||
      p.tags.some((t) => t.toLowerCase().includes(cleanQuery))
    );

    if (!ai) return localMatches;

    try {
      const productCatalogSummary = products.map((p) => ({
        id: p.id,
        title: p.title,
        category: p.categoryName,
        tags: p.tags,
        price: p.price,
      }));

      const prompt = `You are a high-end AI E-commerce Assistant for AURA LUXE.
Given the customer query: "${cleanQuery}"
Here is our catalog: ${JSON.stringify(productCatalogSummary)}

Return ONLY a JSON array of product IDs that best match the query conceptually, ordered by relevance. Example format: ["prod-1", "prod-3"]`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      const text = response.text || '';
      const matchedIds = JSON.parse(text.replace(/```json|```/g, '').trim());

      if (Array.isArray(matchedIds) && matchedIds.length > 0) {
        const aiMatched = matchedIds
          .map((id) => products.find((p) => p.id === id))
          .filter((p): p is Product => Boolean(p));
        if (aiMatched.length > 0) return aiMatched;
      }
    } catch (e) {
      console.warn('AI smart search error, fallback to local match:', e);
    }

    return localMatches;
  },

  // 2. AI Stylist Chat
  async chatWithStylist(userMessage: string, history: { role: 'user' | 'model'; text: string }[], products: Product[]): Promise<string> {
    const ai = getAiClient();
    if (!ai) {
      // Smart offline response fallback
      if (userMessage.toLowerCase().includes('recommend') || userMessage.toLowerCase().includes('gift')) {
        return `I recommend exploring our flagship **AURA Horizon ANC Headphones** or the **Titanium Ceramic Chronograph**. Both represent our pinnacle of craft and modern luxury!`;
      }
      return `Welcome to AURA Luxe. As your personal AI Stylist, I suggest browsing our curated Cyber Tech and Performance Footwear collections. How may I refine your selection today?`;
    }

    try {
      const catalogBrief = products.map((p) => `- ${p.title} ($${p.price}) in ${p.categoryName}`).join('\n');
      const systemInstruction = `You are "AURA AI", a luxury e-commerce personal stylist and shopping advisor for AURA LUXE.
Speak with polished, minimal, high-end, and helpful tone (Apple / Nike / Couture style).
Keep answers concise (2-3 sentences), recommendation-focused, and mention relevant items from our catalog below:
${catalogBrief}`;

      const contents = history.map((h) => ({
        role: h.role,
        parts: [{ text: h.text }],
      }));

      contents.push({
        role: 'user',
        parts: [{ text: userMessage }],
      });

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: contents as any,
        config: {
          systemInstruction,
        },
      });

      return response.text || 'I am happy to assist you in selecting the perfect piece from our AURA collections.';
    } catch (e) {
      console.error('Gemini Chat error:', e);
      return 'I am currently processing high volume. Feel free to explore our featured collections directly!';
    }
  },

  // 3. AI Product Description Generator for Admin
  async generateProductDescription(title: string, category: string, keyFeatures: string): Promise<string> {
    const ai = getAiClient();
    if (!ai) {
      return `Crafted with aerospace-grade precision and minimalist aesthetics, the ${title} redefines luxury in ${category}. Built with premium materials for unmatched durability and style.`;
    }

    try {
      const prompt = `Write a compelling, luxury-brand product description for an e-commerce store (Apple / Nike style).
Product Title: "${title}"
Category: "${category}"
Key Highlights: "${keyFeatures}"

Keep it around 40-60 words. Tone: Sophisticated, modern, innovative.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      return response.text?.trim() || `An exquisite piece crafted with precision and modern elegance for ${category}.`;
    } catch (e) {
      return `Masterfully designed for the modern connoisseur, combining performance with timeless elegance.`;
    }
  },
};
