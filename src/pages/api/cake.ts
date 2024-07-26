import type { APIRoute } from "astro";
import { MongoClient, ObjectId } from 'mongodb';

const uri = import.meta.env.MONGODB_URI;
const client = new MongoClient(uri);
const database = client.db('pasteler-ia');
const cakes = database.collection('cakes');

class ApiError extends Error {
  code: number;

  constructor(message: string, code: number) {
    super(message);
    this.code = code;
    this.name = "ApiError";
  }
}

const getOneCake = async (id: string) => {
  if (!ObjectId.isValid(id)) {
    throw new ApiError('Invalid ID format', 400);
  }
  const cake = await cakes.findOne({ _id: new ObjectId(id) });
  if (!cake) {
    throw new ApiError('Cake not found', 404);
  }

  const { _id, ...rest } = cake;
  return { id: _id, ...rest };
}

const getAllCakes = async (page: number) => {
  if (page < 1) {
    throw new ApiError('Invalid page number', 400);
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
    throw new ApiError('No cakes found', 404);
  }

  return {
    data: results,
    totalItems,
    totalPages,
    currentPage: page,
    itemsPerPage: limit,
  };
}

export const GET: APIRoute = async ({ request }) => {
  try {

    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    const page = parseInt(url.searchParams.get('page') || '1', 10);

    if (id) {
      return new Response(JSON.stringify(await getOneCake(id)),
        { headers: { "content-type": "application/json" }, status: 200 }
      );
    }

    return new Response(JSON.stringify(await getAllCakes(page)),
      { headers: { "content-type": "application/json" }, status: 200 }
    );

  } catch (error) {
    if (error instanceof ApiError) {
      return new Response(JSON.stringify({ error: error.message }),
        { headers: { "content-type": "application/json" }, status: error.code }
      );
    }

    return new Response(JSON.stringify({ error: 'Internal server error' }),
      { headers: { "content-type": "application/json" }, status: 500 }
    );
  }
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