// src/lib/ai-security.ts

// ═══════════════════════════════════════════════════════════════════════
//                    AI SECURITY & RATE LIMITING
// ═══════════════════════════════════════════════════════════════════════

// 1. NEVER expose API keys in frontend
//    All AI calls go through Vercel Edge Functions

// 2. Rate limiting per user (in Edge Function)
const RATE_LIMITS = {
  mnemonics: { perHour: 20, perDay: 50 },
  pronunciationTips: { perHour: 30, perDay: 100 },
  weeklyInsights: { perDay: 1 },
};

// 3. Input sanitization
export const sanitizeAIInput = (input: string): string => {
  // Remove potential prompt injection attempts
  const dangerous = [
    'ignore previous',
    'ignore above',
    'disregard',
    'new instruction',
    'system:',
    'assistant:',
    'human:',
  ];
  
  let sanitized = input.trim().slice(0, 500); // Max length
  
  dangerous.forEach(phrase => {
    sanitized = sanitized.toLowerCase().replace(phrase, '');
  });
  
  return sanitized;
};

// 4. Response validation
export const validateAIResponse = (response: string): boolean => {
  // Check response isn't trying to do something weird
  const maxLength = 2000;
  if (response.length > maxLength) return false;
  
  // Add more validation as needed
  return true;
};

// 5. Caching to reduce API calls
// Cache AI responses in localStorage with expiry

interface CachedAIResponse {
  value: string;
  timestamp: number;
  expiresIn: number; // ms
}

export const getCachedAIResponse = (key: string): string | null => {
  const cached = localStorage.getItem(`ai_cache_${key}`);
  if (!cached) return null;
  
  const parsed: CachedAIResponse = JSON.parse(cached);
  if (Date.now() > parsed.timestamp + parsed.expiresIn) {
    localStorage.removeItem(`ai_cache_${key}`);
    return null;
  }
  
  return parsed.value;
};

export const setCachedAIResponse = (
  key: string, 
  value: string, 
  expiresIn: number = 24 * 60 * 60 * 1000 // 24 hours default
): void => {
  const cached: CachedAIResponse = {
    value,
    timestamp: Date.now(),
    expiresIn,
  };
  localStorage.setItem(`ai_cache_${key}`, JSON.stringify(cached));
};

// Usage example for mnemonic:
// Key = `mnemonic_${word}_${targetLang}`
// If user asks for same word's mnemonic, serve from cache