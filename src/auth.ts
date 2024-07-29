import { Lucia } from "lucia";
import { MongodbAdapter } from "@lucia-auth/adapter-mongodb";
import { Collection, MongoClient } from "mongodb";
import { GitHub } from "arctic";

interface UserDoc {
	_id: string;
  username: string;
	github_id?: string;
  password_hash?: string;
}

interface SessionDoc {
	_id: string;
	expires_at: Date;
	user_id: string;
}

interface DatabaseUserAttributes {
	username: string;
	github_id?: string;
}

const uri = import.meta.env.MONGODB_URI;
const client = new MongoClient(uri);
await client.connect();

const db = client.db('pasteler-ia');
const User = db.collection("users") as Collection<UserDoc>;
const Session = db.collection("sessions") as Collection<SessionDoc>;

const adapter = new MongodbAdapter(Session, User);

export const lucia = new Lucia(adapter, {
	sessionCookie: {
		attributes: {
			secure: import.meta.env.PROD
		}
	},
  getUserAttributes: (attributes) => {
		return {
			githubId: attributes.github_id,
			username: attributes.username
		};
	}
});

export const github = new GitHub(
	import.meta.env.GITHUB_CLIENT_ID,
	import.meta.env.GITHUB_CLIENT_SECRET
);

declare module "lucia" {
	interface Register {
		Lucia: typeof lucia;
    DatabaseUserAttributes: DatabaseUserAttributes;
	}
}