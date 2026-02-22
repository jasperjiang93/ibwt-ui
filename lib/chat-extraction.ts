interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface ExtractedTaskData {
  request: string;
  budgetIbwt: number | null;
  keywords: string[];
  isComplete: boolean;
}

/**
 * Common stopwords to exclude from keyword extraction
 */
const STOPWORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
  'of', 'with', 'by', 'from', 'up', 'about', 'into', 'through', 'during',
  'before', 'after', 'above', 'below', 'between', 'under', 'again', 'further',
  'then', 'once', 'here', 'there', 'when', 'where', 'why', 'how', 'all', 'both',
  'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not',
  'only', 'own', 'same', 'so', 'than', 'too', 'very', 'can', 'will', 'just',
  'should', 'now', 'need', 'help', 'want', 'would', 'could', 'please', 'ibwt',
  'task', 'tasks', 'create', 'make'
]);

/**
 * Extract task details from conversation messages
 */
export function extractTaskDetailsFromConversation(
  messages: Message[]
): ExtractedTaskData {
  // Concatenate all user messages for request (limit 500 chars)
  const userMessages = messages
    .filter((m) => m.role === 'user')
    .map((m) => m.content)
    .join(' ');

  const request = userMessages.slice(0, 500);

  // Extract budget using regex patterns
  let budgetIbwt: number | null = null;
  const budgetPatterns = [
    /(\d+(?:,\d{3})*)\s*(?:\$)?IBWT/i,  // "3000 IBWT", "3000 $IBWT" (integers only)
    /\$(\d+(?:,\d{3})*)\b/,              // "$3000" (integers only, word boundary)
  ];

  for (const pattern of budgetPatterns) {
    const match = userMessages.match(pattern);
    if (match) {
      const numStr = match[1].replace(/,/g, '');
      budgetIbwt = parseInt(numStr, 10);
      break;
    }
  }

  // Fallback: if AI asked about budget and user replied with a number
  // Look for context where assistant mentions "budget" and extract number from response
  if (budgetIbwt === null) {
    for (let i = messages.length - 1; i >= 0; i--) {
      const msg = messages[i];
      if (msg.role === 'assistant' && /budget/i.test(msg.content)) {
        // Check next user messages for a number (extract largest integer found)
        for (let j = i + 1; j < messages.length; j++) {
          if (messages[j].role === 'user') {
            // Match integers (not decimals like "2.2000")
            // Look for standalone numbers, not part of list markers
            const numbers = messages[j].content.match(/\b(\d{3,})\b/g); // At least 3 digits
            if (numbers && numbers.length > 0) {
              // Take the largest number (most likely the budget)
              const largest = Math.max(...numbers.map(n => parseInt(n, 10)));
              if (largest >= 100) { // Reasonable minimum budget
                budgetIbwt = largest;
                break;
              }
            }
          }
        }
        if (budgetIbwt !== null) break;
      }
    }
  }

  // Extract keywords: significant words (length > 3, not stopwords)
  const words = userMessages
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter((word) => word.length > 3 && !STOPWORDS.has(word));

  // Count word frequency and take top 10 unique
  const wordFreq = new Map<string, number>();
  words.forEach((word) => {
    wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
  });

  const keywords = Array.from(wordFreq.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([word]) => word);

  // Task is complete if:
  // 1. Budget exists
  // 2. Conversation has substantial content (100+ chars to ensure enough detail)
  // 3. At least 2 user messages (ensure back-and-forth discussion)
  const userMessageCount = messages.filter(m => m.role === 'user').length;
  const isComplete =
    budgetIbwt !== null &&
    request.length >= 100 &&
    userMessageCount >= 3;

  return {
    request,
    budgetIbwt,
    keywords,
    isComplete,
  };
}
