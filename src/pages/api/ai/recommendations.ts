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

const getSystemPrompt = (locale: string) => {
  if (locale === 'en') {
    return 'You are an expert in cakes and pastries and have been asked for a recommendation of a cake based on a person\'s tastes. You can only give recommendations of 40 words. You can only recommend one of the following cakes: ';
  }
  if (locale === 'fr') {
    return 'Vous êtes un expert en gâteaux et pâtisseries et on vous a demandé une recommandation de gâteau basée sur les goûts d\'une personne. Vous ne pouvez donner que des recommandations de 40 mots. Vous ne pouvez recommander qu\'un des gâteaux suivants: ';
  }
  return 'Eres un experto en pasteles y repostería y te han pedido una recomedacion de un pastel basado en los gustos de una persona. Solo puedes dar recomendaciones de 40 palabras. Solo puedes recomendar uno de los siguientes pasteles: ';
}

const getUserPrompt = (locale: string, description: string) => {
  if (locale === 'en') {
    return 'A customer has asked you for a recommendation of a cake based on their tastes. The customer wrote this about their tastes: ' + description + '.';
  }
  if (locale === 'fr') {
    return 'Un client vous a demandé une recommandation de gâteau basée sur ses goûts. Le client a écrit ceci sur ses goûts: ' + description + '.';
  }
  return 'Un cliente te ha pedido una recomendación de un pastel basado en sus gustos. El cliente escribio esto sobre sus gustos: ' + description + '.';
}

export const POST: APIRoute = async ({ request }) => {
  const allCakes = await cakes.find().toArray();
  if (allCakes.length === 0) {
    return new Response(JSON.stringify("No cakes found"),
      { headers: { "content-type": "application/json" }, status: 404 }
    );
  }

  const body = await request.json();
  const description = body.description;
  
  let system = getSystemPrompt(body.locale);
  system += allCakes.map((cake) => cake.name).join(', ');

  const { text } = await generateText({
    model,
    maxTokens: 100,
    system,
    prompt: getUserPrompt(body.locale, description),
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