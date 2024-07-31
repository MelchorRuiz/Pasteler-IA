import type { APIRoute } from "astro";
import { createOpenAI } from '@ai-sdk/openai';
import { generateText, streamText } from 'ai';
import { MongoClient } from 'mongodb';

const uri = import.meta.env.MONGODB_URI;
const client = new MongoClient(uri);
const database = client.db('pasteler-ia');
const cakes = database.collection('cakes');

const perplexity = createOpenAI({
  apiKey: import.meta.env.PERPLEXITY_API_KEY ?? '',
  baseURL: 'https://api.perplexity.ai/',
});

const model = perplexity('llama-3-8b-instruct');
let system = 'Eres un experto en pasteles y repostería y te han pedido una recomedacion de un pastel basado en los gustos de una persona. Solo puedes dar recomendaciones de 40 palabras. Solo puedes recomendar uno de los siguientes pasteles: '

export const POST: APIRoute = async ({ request }) => {
  const allCakes = await cakes.find().toArray();
  if (allCakes.length === 0) {
    return new Response(JSON.stringify("No cakes found"),
      { headers: { "content-type": "application/json" }, status: 404 }
    );
  }

  system += allCakes.map((cake) => cake.name).join(', ');
  const body = await request.json();
  const description = body.description;

  const { text } = await generateText({
    model,
    maxTokens: 100,
    system,
    prompt: 'Un cliente te ha pedido una recomendación de un pastel basado en sus gustos. El cliente escribio esto sobre sus gustos: ' + description + '.',
  });

  let cakeId = '';
  let cakeName = '';
  allCakes.forEach((cake) => {
    if (text.includes(cake.name)) {
      cakeId = cake._id.toString();
      cakeName = cake.name;
      return;
    }
  })

  const result = {
    recommendation: text,
    cakeId,
    cakeName,
  }
  return new Response(JSON.stringify(result),
    { headers: { "content-type": "application/json" }, status: 200 }
  );
}