import type { ActionFunctionArgs } from "@remix-run/cloudflare"
import { redirect } from "@remix-run/cloudflare"
import { getSessionStorage, logout } from "~/utils/session.server"

export async function action({ request, context }: ActionFunctionArgs) {
  const sessionStorage = getSessionStorage(context)
  return logout(request, sessionStorage)
}

export async function loader() {
  return redirect("/")
}
