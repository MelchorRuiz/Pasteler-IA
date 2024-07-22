import type { APIRoute } from "astro";
import { MongoClient } from 'mongodb';

const uri = import.meta.env.MONGODB_URI;
const client = new MongoClient(uri);
const database = client.db('cerveceria-ia');
const beers = database.collection('beers');

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get('page') || '1', 10);
  const limit = 10;
  const skip = (page - 1) * limit;

  const totalItems = await beers.countDocuments();
  const totalPages = Math.ceil(totalItems / limit);

  const results = (await beers.find().skip(skip).limit(limit).toArray()).map((beer) => {
    const { _id, ...rest } = beer;
    return { id: _id, ...rest }; 
  });

  if (results.length === 0) {
    return new Response(JSON.stringify({ message: 'No beers found' }),
      { headers: { "content-type": "application/json" }, status: 404 }
    );
  }

  const response = {
    data: results,
    totalItems,
    totalPages,
    currentPage: page,
    itemsPerPage: limit,
  };

  return new Response(JSON.stringify(response),
    { headers: { "content-type": "application/json" }, status: 200 }
  );
}

export const POST: APIRoute = async ({ request }) => {
  const body = await request.json();
  const result = await beers.insertOne(body);

  return new Response(JSON.stringify(result),
    { headers: { "content-type": "application/json" }, status: 201 }
  );
}

export const PUT: APIRoute = async ({ request }) => {
  const body = await request.json();
  const result = await beers.updateOne({ _id: body.id }, { $set: body });

  return new Response(JSON.stringify(result),
    { headers: { "content-type": "application/json" }, status: 200 }
  );
}

export const DELETE: APIRoute = async ({ request }) => {
  const body = await request.json();
  const result = await beers.deleteOne({ _id: body.id });

  return new Response(JSON.stringify(result),
    { headers: { "content-type": "application/json" }, status: 200 }
  );
}