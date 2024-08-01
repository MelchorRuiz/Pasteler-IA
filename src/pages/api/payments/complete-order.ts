import type { APIRoute } from "astro";
import { MercadoPagoConfig, Payment, Preference } from 'mercadopago';
import { MongoClient, ObjectId } from 'mongodb';

const uri = import.meta.env.MONGODB_URI;
const clientDb = new MongoClient(uri);
const database = clientDb.db('pasteler-ia');
const cakes = database.collection('cakes');
const orders = database.collection('orders');

const client = new MercadoPagoConfig({
  accessToken: import.meta.env.MERCADOPAGO_ACCESS_TOKEN,
});

export const GET: APIRoute = async ({ request, redirect }) => {
  const { searchParams } = new URL(request.url);
  const preferenceId = searchParams.get('preference_id') || '';
  const paymentId = searchParams.get('payment_id') || '';

  const payment = new Payment(client);
  const response = await payment.get({ id: paymentId });

  if (response.status !== "approved") {
    return new Response(JSON.stringify({ error: 'Payment not approved' }),
      { headers: { "content-type": "application/json" }, status: 400 }
    );
  }

  const order = await orders.findOne({ order_id: preferenceId });
  console.log(order);
  if (!order) {
    const preference = new Preference(client);
    let response = await preference.get({ preferenceId });

    const { items } = response;
    const order = {
      order_id: preferenceId,
      items: items?.map((item) => ({
        id: item.id,
        title: item.title,
        quantity: item.quantity,
        unit_price: item.unit_price,
      })),
      total: items?.reduce((total: number, item) => total + item.unit_price, 0),
      status: 'approved',
    };

    items?.forEach(async (item) => {
      const cake = await cakes.findOne({ _id: new ObjectId(item.id) });
      if (cake) {
        await cakes.updateOne({ _id: new ObjectId(item.id) }, { $inc: { stock: -item.quantity } });
      }
    });

    await orders.insertOne(order);
  }

  return redirect('/');
}