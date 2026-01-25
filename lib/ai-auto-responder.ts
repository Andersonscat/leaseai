import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * System Prompt для AI Auto-responder
 * 
 * Требования:
 * - Дружелюбный и уважительный тон
 * - Только про аренду и продажу недвижимости
 * - Короткие, но информативные ответы (2-4 предложения)
 * - Как обычный профессиональный риэлтор
 */
const REALTOR_SYSTEM_PROMPT = `You are a warm, welcoming, and professional real estate agent. Every client is an important guest who deserves your genuine attention and care.

CRITICAL LANGUAGE RULE:
**ALWAYS respond in the SAME LANGUAGE as the client's message!**
- If client writes in English → respond in English
- If client writes in Russian → respond in Russian  
- If client writes in Spanish → respond in Spanish
- Match the client's language EXACTLY

COMMUNICATION TONE:
1. Warm and welcoming — greet clients like valued guests
2. Genuinely eager to help them find their perfect home
3. Personalized — use their name if they provided it
4. Enthusiastic — show genuine interest in their inquiry
5. Empathetic — understand their needs and concerns

RESPONSE STYLE:
- Keep responses short but warm (2-4 sentences)
- Natural, conversational style
- Light emojis are fine if appropriate
- Professional yet friendly, like a real estate agent who truly cares

EXAMPLES OF GOOD RESPONSES:

❌ BAD: "Yes, the apartment is available."
✅ GOOD: "Hi John! I'm so glad you're interested in this apartment. Yes, it's still available for rent. When would be convenient for you to schedule a viewing?"

❌ BAD: "I'll send the information."
✅ GOOD: "Great choice! I'd be happy to send you all the details and photos. What's your budget range, and when are you planning to move in?"

❌ BAD: "Any questions?"
✅ GOOD: "I'm here to help with anything you need! Would you like to discuss lease terms or learn more about the neighborhood?"

REMEMBER:
- Treat each client as an important guest, not a random passerby
- Show genuine interest in their needs
- Be positive and inspiring
- Help them feel they've reached the right person
- **MATCH THEIR LANGUAGE!**
`;

interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
}

/**
 * Генерирует автоматический ответ клиенту
 * 
 * @param clientMessage - Последнее сообщение клиента
 * @param conversationHistory - История переписки (опционально)
 * @param realtorInfo - Информация о риэлторе (имя, специализация и т.д.)
 * @returns AI-сгенерированный ответ
 */
export async function generateAutoResponse(
  clientMessage: string,
  conversationHistory: ConversationMessage[] = [],
  realtorInfo?: {
    name?: string;
    specialization?: string;
    properties?: string[]; // Список доступных объектов
  }
): Promise<string> {
  try {
    console.log('🤖 Generating AI auto-response...');
    
    // Формируем контекст для AI
    let systemPrompt = REALTOR_SYSTEM_PROMPT;
    
    if (realtorInfo?.name) {
      systemPrompt += `\n\nТвое имя: ${realtorInfo.name}`;
    }
    
    if (realtorInfo?.specialization) {
      systemPrompt += `\nТвоя специализация: ${realtorInfo.specialization}`;
    }
    
    if (realtorInfo?.properties && realtorInfo.properties.length > 0) {
      systemPrompt += `\n\nДоступные объекты:\n${realtorInfo.properties.join('\n')}`;
    }
    
    // Формируем историю сообщений для контекста
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      {
        role: 'system',
        content: systemPrompt,
      },
      // Добавляем историю переписки (если есть)
      ...conversationHistory.map((msg) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      })),
      // Добавляем текущее сообщение клиента
      {
        role: 'user',
        content: clientMessage,
      },
    ];
    
    // Вызываем OpenAI API
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // Быстрая и дешевая модель
      messages,
      temperature: 0.7, // Немного креативности, но не слишком
      max_tokens: 200, // Ограничиваем длину ответа (короткие ответы)
      presence_penalty: 0.3, // Избегаем повторений
      frequency_penalty: 0.3,
    });
    
    const aiResponse = completion.choices[0]?.message?.content?.trim();
    
    if (!aiResponse) {
      throw new Error('AI returned empty response');
    }
    
    console.log('✅ AI auto-response generated:', {
      length: aiResponse.length,
      preview: aiResponse.substring(0, 50) + '...',
    });
    
    return aiResponse;
    
  } catch (error) {
    console.error('❌ Error generating AI auto-response:', error);
    
    // Fallback ответ если AI не сработал
    return 'Спасибо за ваше сообщение! Я сейчас уточню информацию и скоро отвечу.';
  }
}

/**
 * Проверяет, нужно ли отвечать автоматически на это сообщение
 * 
 * Не отвечаем если:
 * - Сообщение от самого риэлтора
 * - Это спам или реклама
 * - Клиент попросил не отвечать автоматически
 */
export function shouldAutoRespond(
  message: string,
  isFromRealtor: boolean = false
): boolean {
  // Не отвечаем на свои сообщения
  if (isFromRealtor) {
    return false;
  }
  
  // Не отвечаем на очень короткие сообщения (типа "Ok", "Thanks")
  if (message.trim().length < 10) {
    return false;
  }
  
  // Проверяем на стоп-слова (клиент не хочет автоответов)
  const stopPhrases = [
    'не отвечайте',
    'не надо автоответов',
    'stop auto',
    'unsubscribe',
  ];
  
  const lowerMessage = message.toLowerCase();
  if (stopPhrases.some((phrase) => lowerMessage.includes(phrase))) {
    return false;
  }
  
  return true;
}
