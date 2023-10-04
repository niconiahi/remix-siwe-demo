import type { ActionFunctionArgs } from "@remix-run/cloudflare";
import { redirect } from "@remix-run/cloudflare";
import { envSchema } from "~/utils/env.server";
import { getSessionStorage, logout } from "~/utils/session.server";

export async function action({ request, context }: ActionFunctionArgs) {
  const env = envSchema.parse(context.env);
  const sessionStorage = getSessionStorage(env.SESSION_SECRET);
  return logout(request, sessionStorage);
}

export async function loader() {
  return redirect("/");
}
