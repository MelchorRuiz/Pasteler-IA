// pages/api/login.ts
import { lucia } from "../../../auth";
import { verify } from "@node-rs/argon2";
import { Collection, MongoClient } from "mongodb";

import type { APIContext } from "astro";

interface UserDoc {
	_id: string;
  username: string;
  password_hash: string;
}

const uri = import.meta.env.MONGODB_URI;
const client = new MongoClient(uri);
await client.connect();

const db = client.db('pasteler-ia');
const User = db.collection("users") as Collection<UserDoc>;

export async function POST(context: APIContext): Promise<Response> {
	const formData = await context.request.formData();
	const username = formData.get("username");
	if (
		typeof username !== "string" ||
		username.length < 3 ||
		username.length > 31 ||
		!/^[a-zA-Z0-9_-]+$/.test(username)
	) {
		return new Response("Invalid username", {
			status: 400
		});
	}
	const password = formData.get("password");
	if (typeof password !== "string" || password.length < 6 || password.length > 255) {
		return new Response("Invalid password", {
			status: 400
		});
	}

	const existingUser = await User.findOne({username});
	if (!existingUser) {
		return new Response("Incorrect username or password", {
			status: 400
		});
	}

	const validPassword = await verify(existingUser.password_hash, password, {
		memoryCost: 19456,
		timeCost: 2,
		outputLen: 32,
		parallelism: 1
	});
	if (!validPassword) {
		return new Response("Incorrect username or password", {
			status: 400
		});
	}

  const userId = existingUser._id;
	const session = await lucia.createSession(userId, {});
	const sessionCookie = lucia.createSessionCookie(session.id);
	context.cookies.set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);

	return context.redirect("/");
}