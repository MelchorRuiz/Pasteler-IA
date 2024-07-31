import type { APIRoute } from "astro";
import { createOpenAI } from '@ai-sdk/openai';
import { generateText } from 'ai';

const perplexity = createOpenAI({
  apiKey: import.meta.env.PERPLEXITY_API_KEY ?? '',
  baseURL: 'https://api.perplexity.ai/',
});

const model = perplexity('llama-3-8b-instruct');

export const GET: APIRoute = async () => {
  const { text } = await generateText({
    model,
    prompt: 'Escribe un mensaje de bienvenida cálido y amigable para un nuevo usuario, utilizando exactamente 20 palabras, que invite a explorar y participar.',
  });
  return new Response(JSON.stringify({
    message: text
  })
  )
}