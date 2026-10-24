import "server-only";

export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing ${name}. Add it to .env.local — see .env.example for setup details.`,
    );
  }
  return value;
}

export function getServiceRoleKey(): string {
  return requireEnv("SUPABASE_SERVICE_ROLE_KEY");
}

export function getRazorpayCredentials() {
  return {
    keyId: requireEnv("RAZORPAY_KEY_ID"),
    keySecret: requireEnv("RAZORPAY_KEY_SECRET"),
  };
}

export function getRazorpayWebhookSecret(): string {
  return requireEnv("RAZORPAY_WEBHOOK_SECRET");
}

export function getResendCredentials() {
  return {
    apiKey: requireEnv("RESEND_API_KEY"),
    from: requireEnv("RESEND_FROM_EMAIL"),
  };
}
