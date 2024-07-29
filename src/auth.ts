import { Lucia } from "lucia";
import { MongodbAdapter } from "@lucia-auth/adapter-mongodb";
import { Collection, MongoClient } from "mongodb";

interface UserDoc {
	_id: string;
  username: string;
  password_hash: string;
}

interface SessionDoc {
	_id: string;
	expires_at: Date;
	user_id: string;
}

interface DatabaseUserAttributes {
	username: string;
  password_hash: string;
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
			username: attributes.username
		};
	}
});

declare module "lucia" {
	interface Register {
		Lucia: typeof lucia;
    DatabaseUserAttributes: DatabaseUserAttributes;
	}
}