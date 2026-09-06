import { getUser, json } from "../../_lib/auth.js";

export async function onRequestGet({ request, env }) {
  const auth = await getUser(request, env);

  if (!auth.ok) return auth.response;

  return json({
    success: true,
    user: auth.user
  });
}
