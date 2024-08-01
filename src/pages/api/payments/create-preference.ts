import type { APIRoute } from "astro";
import { MercadoPagoConfig, Preference } from 'mercadopago';
import { MongoClient, ObjectId } from 'mongodb';

interface Product {
  id: string;
  quantity: number;
}

const uri = import.meta.env.MONGODB_URI;
const clientDB = new MongoClient(uri);
const database = clientDB.db('pasteler-ia');
const cakes = database.collection('cakes');

const client = new MercadoPagoConfig({
  accessToken: import.meta.env.MERCADOPAGO_ACCESS_TOKEN,
});

export const POST: APIRoute = async ({ request }) => {
  const { products } = await request.json();

  if (!Array.isArray(products) || products.length === 0) {
    return new Response(JSON.stringify({ error: 'Invalid products' }),
      { headers: { "content-type": "application/json" }, status: 400 }
    );
  }

  const results = products.map(async (product: Product) => {
    const cake = await cakes.findOne({ _id: new ObjectId(product.id) });
    if (!cake) {
      return {
        id: product.id,
        title: 'Unknown',
        quantity: product.quantity,
        unit_price: 0,
        currency_id: 'MXN',
      };
    }

    return {
      id: product.id,
      title: cake.name,
      quantity: product.quantity,
      unit_price: parseInt(cake.price),
      currency_id: 'MXN',
    };
  });

  const items = await Promise.all(results);
  const preference = new Preference(client);

  const response = await preference.create({
    body: {
      items,
      shipments: {
        cost: 200,
        mode: 'not_specified',
      },
      binary_mode: true,
      statement_descriptor: 'Pasteler-IA',
      auto_return: 'approved',
      back_urls: {
        success: import.meta.env.PROD ? 'https://pasteler-ia.vercel.app/api/payments/complete-order' : 'http://localhost/api/payments/complete-order'
      }
    }
  })

  return new Response(JSON.stringify({ id: response.id }),
    { headers: { "content-type": "application/json" }, status: 200 }
  );

}