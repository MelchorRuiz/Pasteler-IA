import { lucia } from "../../../auth";
import { hash } from "@node-rs/argon2";
import { generateIdFromEntropySize } from "lucia";
import { Collection, MongoClient } from "mongodb";

import type { APIContext } from "astro";

interface UserDoc {
	_id: string;
  username: string;
  github_id?: string;
  password_hash?: string;
}

const uri = import.meta.env.MONGODB_URI;
const client = new MongoClient(uri);
await client.connect();

const db = client.db('pasteler-ia');
const User = db.collection("users") as Collection<UserDoc>;

export async function POST(context: APIContext): Promise<Response> {
	const formData = await context.request.formData();
	const username = formData.get("username");
	// username must be between 4 ~ 31 characters, and only consists of lowercase letters, 0-9, -, and _
	// keep in mind some database (e.g. mysql) are case insensitive
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

	const userId = generateIdFromEntropySize(10); // 16 characters long
	const passwordHash = await hash(password, {
		// recommended minimum parameters
		memoryCost: 19456,
		timeCost: 2,
		outputLen: 32,
		parallelism: 1
	});

	const existingUser = await User.findOne({username});
  if (existingUser) {
    return new Response("User already exists", {
      status: 400
    });
  }

	await User.insertOne({
    _id: userId,
    username,
    password_hash: passwordHash
  })

	const session = await lucia.createSession(userId, {});
	const sessionCookie = lucia.createSessionCookie(session.id);
	context.cookies.set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);

	return context.redirect("/");
}
