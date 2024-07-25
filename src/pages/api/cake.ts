import type { APIRoute } from "astro";
import { MongoClient } from 'mongodb';

const uri = import.meta.env.MONGODB_URI;
const client = new MongoClient(uri);
const database = client.db('pasteler-ia');
const cakes = database.collection('cakes');

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get('page') || '1', 10);
  if (page < 1) {
    return new Response(JSON.stringify({ message: 'Invalid page number' }),
      { headers: { "content-type": "application/json" }, status: 400 }
    );
  }

  const limit = 12;
  const skip = (page - 1) * limit;

  const totalItems = await cakes.countDocuments();
  const totalPages = Math.ceil(totalItems / limit);

  const results = (await cakes.find().skip(skip).limit(limit).toArray()).map((cake) => {
    const { _id, ...rest } = cake;
    return { id: _id, ...rest }; 
  });

  if (results.length === 0) {
    return new Response(JSON.stringify({ message: 'No cakes found' }),
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
  const result = await cakes.insertOne(body);

  return new Response(JSON.stringify(result),
    { headers: { "content-type": "application/json" }, status: 201 }
  );
}

export const PUT: APIRoute = async ({ request }) => {
  const body = await request.json();
  const result = await cakes.updateOne({ _id: body.id }, { $set: body });

  return new Response(JSON.stringify(result),
    { headers: { "content-type": "application/json" }, status: 200 }
  );
}

export const DELETE: APIRoute = async ({ request }) => {
  const body = await request.json();
  const result = await cakes.deleteOne({ _id: body.id });

  return new Response(JSON.stringify(result),
    { headers: { "content-type": "application/json" }, status: 200 }
  );
}