// pages/login/github/callback.ts
import { github, lucia } from "../../../auth";
import { OAuth2RequestError } from "arctic";
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

export async function GET(context: APIContext): Promise<Response> {
	const code = context.url.searchParams.get("code");
	const state = context.url.searchParams.get("state");
	const storedState = context.cookies.get("github_oauth_state")?.value ?? null;
	if (!code || !state || !storedState || state !== storedState) {
		return new Response(null, {
			status: 400
		});
	}

	try {
		const tokens = await github.validateAuthorizationCode(code);
		const githubUserResponse = await fetch("https://api.github.com/user", {
			headers: {
				Authorization: `Bearer ${tokens.accessToken}`
			}
		});
		const githubUser: GitHubUser = await githubUserResponse.json();

		// Replace this with your own DB client.
		const existingUser = await User.findOne({ github_id: githubUser.id });

		if (existingUser) {
			const session = await lucia.createSession(existingUser._id, {});
			const sessionCookie = lucia.createSessionCookie(session.id);
			context.cookies.set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);
			return context.redirect("/");
		}

		const userId = generateIdFromEntropySize(10); // 16 characters long

		// Replace this with your own DB client.
		await User.insertOne({
      _id: userId,
      username: githubUser.login,
      github_id: githubUser.id
    });

		const session = await lucia.createSession(userId, {});
		const sessionCookie = lucia.createSessionCookie(session.id);
		context.cookies.set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);
		return context.redirect("/");
	} catch (e) {
		// the specific error message depends on the provider
		if (e instanceof OAuth2RequestError) {
			// invalid code
			return new Response(null, {
				status: 400
			});
		}
		return new Response(null, {
			status: 500
		});
	}
}

interface GitHubUser {
	id: string;
	login: string;
}
