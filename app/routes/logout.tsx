import type { ActionFunctionArgs } from "@remix-run/cloudflare"
import { redirect } from "@remix-run/cloudflare"
import { logout } from "~/utils/session.server"

export async function action({ request }: ActionFunctionArgs) {
  return logout(request)
}

export async function loader() {
  return redirect("/")
}
