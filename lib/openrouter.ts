import { OpenRouter } from "@openrouter/sdk";

// Initialize OpenRouter client with official SDK
const openrouter = process.env.OPENROUTER_API_KEY
  ? new OpenRouter({
      apiKey: process.env.OPENROUTER_API_KEY,
    })
  : null;

// Available models configuration
export const MODELS = {
  // Free tier models
  FREE: {
    primary: 'arcee-ai/trinity-large-preview:free',
    fallback: 'meta-llama/llama-3.2-3b-instruct:free',
    reasoning: 'arcee-ai/trinity-large-preview:free',
  },
  // Paid models (for premium users)
  PREMIUM: {
    primary: 'anthropic/claude-3.5-sonnet',
    fallback: 'openai/gpt-4o-mini',
    reasoning: 'anthropic/claude-3-opus',
  },
} as const;

export type UserTier = 'free' | 'premium';
export type ModelTask = 'primary' | 'fallback' | 'reasoning';

// Get model based on user tier and task
export function getModel(userTier: UserTier, task: ModelTask): string {
  return userTier === 'premium' ? MODELS.PREMIUM[task] : MODELS.FREE[task];
}

// LLM Request interface
interface LLMRequest {
  prompt: string;
  systemPrompt?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  userTier?: UserTier;
}

// Generate content using OpenRouter
export async function generateContent(request: LLMRequest): Promise<string> {
  const model = request.model || getModel(request.userTier || 'free', 'primary');

  const messages: { role: 'system' | 'user' | 'assistant'; content: string }[] = [];

  if (request.systemPrompt) {
    messages.push({ role: 'system', content: request.systemPrompt });
  }
  messages.push({ role: 'user', content: request.prompt });

  if (!openrouter) {
    throw new Error('OPENROUTER_API_KEY environment variable is not set');
  }

  try {
    console.log(`🔄 Using model: ${model}`);

    let response = '';
    let reasoningTokens = 0;

    // Use streaming for better handling and to get usage info
    const stream = await openrouter.chat.send({
      model,
      messages,
      temperature: request.temperature ?? 0.7,
      maxTokens: request.maxTokens ?? 4000,
      stream: true,
      streamOptions: {
        includeUsage: true,
      },
    });

    // Collect streamed content
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        response += content;
      }

      // Usage information comes in the final chunk
      if (chunk.usage) {
        reasoningTokens = (chunk.usage as any).reasoningTokens || 0;
        if (reasoningTokens > 0) {
          console.log(`💭 Reasoning tokens used: ${reasoningTokens}`);
        }
      }
    }

    return response;
  } catch (error) {
    console.error(`❌ Model ${model} failed, trying fallback...`, error);

    // Try fallback model
    try {
      const fallbackModel = getModel(request.userTier || 'free', 'fallback');
      console.log(`🔄 Trying fallback model: ${fallbackModel}`);

      let response = '';

      const stream = await openrouter.chat.send({
        model: fallbackModel,
        messages,
        temperature: request.temperature ?? 0.7,
        maxTokens: request.maxTokens ?? 4000,
        stream: true,
        streamOptions: {
          includeUsage: true,
        },
      });

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content;
        if (content) {
          response += content;
        }

        if (chunk.usage) {
          const reasoningTokens = (chunk.usage as any).reasoningTokens || 0;
          if (reasoningTokens > 0) {
            console.log(`💭 Reasoning tokens used: ${reasoningTokens}`);
          }
        }
      }

      return response;
    } catch (fallbackError) {
      console.error('❌ Fallback model also failed:', fallbackError);
      throw new Error('Failed to generate content with all available models');
    }
  }
}

// Generate structured JSON output
export async function generateJSON<T>(
  prompt: string,
  userTier: UserTier = 'free'
): Promise<T> {
  const systemPrompt = `You are a JSON generator. You MUST respond with valid JSON only. No markdown, no code blocks, no explanations. Just pure JSON.`;

  const response = await generateContent({
    prompt,
    systemPrompt,
    temperature: 0.3,
    userTier,
  });

  // Clean the response - remove markdown code blocks if present
  let cleanedResponse = response.trim();
  if (cleanedResponse.startsWith('```json')) {
    cleanedResponse = cleanedResponse.slice(7);
  }
  if (cleanedResponse.startsWith('```')) {
    cleanedResponse = cleanedResponse.slice(3);
  }
  if (cleanedResponse.endsWith('```')) {
    cleanedResponse = cleanedResponse.slice(0, -3);
  }
  cleanedResponse = cleanedResponse.trim();

  try {
    return JSON.parse(cleanedResponse) as T;
  } catch (error) {
    console.error('Failed to parse JSON response:', cleanedResponse);
    throw new Error('Failed to parse AI response as JSON');
  }
}

// Stream content generation (for real-time updates)
export async function* streamContent(
  request: LLMRequest
): AsyncGenerator<string, void, unknown> {
  if (!openrouter) {
    throw new Error('OPENROUTER_API_KEY environment variable is not set');
  }

  const model = request.model || getModel(request.userTier || 'free', 'primary');

  const messages: { role: 'system' | 'user' | 'assistant'; content: string }[] = [];

  if (request.systemPrompt) {
    messages.push({ role: 'system', content: request.systemPrompt });
  }
  messages.push({ role: 'user', content: request.prompt });

  const stream = await openrouter.chat.send({
    model,
    messages,
    stream: true,
  });

  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content;
    if (content) {
      yield content;
    }
  }
}
