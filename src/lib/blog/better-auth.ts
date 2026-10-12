import "server-only";
import { betterAuth } from "better-auth";
import { dash } from "@better-auth/infra";
import { genericOAuth } from "better-auth/plugins";
import { PostgresDialect } from "kysely";
import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL_POOLED || process.env.DATABASE_URL;
const authUrl = process.env.BETTER_AUTH_URL || process.env.APP_URL || "http://localhost:3000";
const authSecret = process.env.AUTH_SECRET;
if (process.env.NODE_ENV === "production" && (!authSecret || authSecret.length < 32)) {
  throw new Error("Set AUTH_SECRET to a random value of at least 32 characters.");
}
const trustedOrigins = (process.env.BETTER_AUTH_TRUSTED_ORIGINS || authUrl).split(",").map((origin) => origin.trim()).filter(Boolean);
const database = connectionString
  ? new PostgresDialect({ pool: new Pool({ connectionString, max: 5, ssl: { rejectUnauthorized: true } }) })
  : undefined;

const socialProviders = {
  ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
    ? { google: { clientId: process.env.GOOGLE_CLIENT_ID, clientSecret: process.env.GOOGLE_CLIENT_SECRET } }
    : {}),
  ...(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET
    ? { github: { clientId: process.env.GITHUB_CLIENT_ID, clientSecret: process.env.GITHUB_CLIENT_SECRET } }
    : {}),
};

const customOidcProvider = process.env.CUSTOM_OIDC_PROVIDER_ID && process.env.CUSTOM_OIDC_DISCOVERY_URL && process.env.CUSTOM_OIDC_CLIENT_ID
  ? {
      providerId: process.env.CUSTOM_OIDC_PROVIDER_ID,
      name: process.env.CUSTOM_OIDC_PROVIDER_NAME || process.env.CUSTOM_OIDC_PROVIDER_ID,
      discoveryUrl: process.env.CUSTOM_OIDC_DISCOVERY_URL,
      requireIdTokenVerification: true,
      clientId: process.env.CUSTOM_OIDC_CLIENT_ID,
      clientSecret: process.env.CUSTOM_OIDC_CLIENT_SECRET,
      scopes: (process.env.CUSTOM_OIDC_SCOPES || "openid email profile").split(/\s+/).filter(Boolean),
    }
  : null;

export const configuredProviders = {
  google: Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
  github: Boolean(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET),
  custom: customOidcProvider ? { id: customOidcProvider.providerId, name: customOidcProvider.name } : null,
};

export const auth = betterAuth({
  ...(database ? { database } : {}),
  baseURL: authUrl,
  basePath: "/api/auth",
  trustedOrigins,
  secret: authSecret,
  socialProviders,
  account: { accountLinking: { enabled: false, trustedProviders: ["google", "github"] } },
  emailVerification: { autoSignInAfterVerification: true },
  plugins: [dash({ apiKey: process.env.BETTER_AUTH_API_KEY }), ...(customOidcProvider ? [genericOAuth({ config: [customOidcProvider] })] : [])],
});
