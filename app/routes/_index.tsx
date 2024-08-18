import type { LoaderFunctionArgs } from "@remix-run/cloudflare"
import { json } from "@remix-run/cloudflare"
import { Form, Link, useLoaderData } from "@remix-run/react"

import { PrimaryButton } from "~/components/primary-button"
import { getSessionStorage, getUserAddress } from "~/utils/session.server"

export async function loader({ request, context }: LoaderFunctionArgs) {
  const sessionStorage = getSessionStorage(context)
  const userAddress = await getUserAddress(request, sessionStorage)
  const isLoggedIn = Boolean(userAddress)

  return json({ isLoggedIn })
}

export default function () {
  const { isLoggedIn } = useLoaderData<typeof loader>()

  return (
    <div className="flex h-full w-full items-center justify-center space-x-2">
      <Link to="login">
        <PrimaryButton disabled={isLoggedIn}>Login</PrimaryButton>
      </Link>
      <Link to="join">
        <PrimaryButton disabled={isLoggedIn}>Join</PrimaryButton>
      </Link>
      <Form action="/logout" method="post">
        <PrimaryButton type="submit" disabled={!isLoggedIn}>
          Logout
        </PrimaryButton>
      </Form>
      <Link to="user">
        <PrimaryButton type="submit">User</PrimaryButton>
      </Link>
    </div>
  )
}
