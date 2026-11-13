// Feature switches. The AI assistant is still in development and stays hidden
// unless NEXT_PUBLIC_AI_ASSISTANT_ENABLED=true (the API has its own switch too).
export const AI_ASSISTANT_ENABLED = process.env.NEXT_PUBLIC_AI_ASSISTANT_ENABLED === "true";

// Google sign-in shows only when a Google OAuth client ID is configured (public value, not a secret)
export const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";
