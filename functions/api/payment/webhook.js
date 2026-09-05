async function verifySignature(payload, signature, secret) {
  const encoder = new TextEncoder();

  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    {
      name: "HMAC",
      hash: "SHA-256"
    },
    false,
    ["sign"]
  );

  const digest = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(payload)
  );

  const computed = [...new Uint8Array(digest)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  if (computed.length !== signature.length) return false;

  let result = 0;

  for (let i = 0; i < computed.length; i++) {
    result |= computed.charCodeAt(i) ^ signature.charCodeAt(i);
  }

  return result === 0;
}

export async function onRequestPost(context) {
  const { request, env } = context;

  if (!env.CHARGILY_SECRET_KEY) {
    return new Response("Configuration error", { status: 500 });
  }

  const payload = await request.text();

  const signature = request.headers.get("signature");

  if (!signature) {
    return new Response("Missing signature", { status: 400 });
  }

  const valid = await verifySignature(
    payload,
    signature,
    env.CHARGILY_SECRET_KEY
  );

  if (!valid) {
    return new Response("Invalid signature", { status: 403 });
  }

  let event;

  try {
    event = JSON.parse(payload);
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const checkout = event?.data;

  if (!checkout?.id) {
    return new Response("Invalid event", { status: 400 });
  }

  /*
    هنا لاحقًا نحدث payment_transactions
    ونفعّل subscription.
  */

  if (event.type === "checkout.paid") {
    console.log("Chargily payment paid:", checkout.id);
  }

  if (event.type === "checkout.failed") {
    console.log("Chargily payment failed:", checkout.id);
  }

  if (event.type === "checkout.canceled") {
    console.log("Chargily payment canceled:", checkout.id);
  }

  return Response.json({
    received: true
  });
}
