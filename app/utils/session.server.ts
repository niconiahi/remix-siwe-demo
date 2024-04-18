import type { AppLoadContext, SessionData, SessionStorage } from "@remix-run/cloudflare"
import { createCookieSessionStorage, redirect } from "@remix-run/cloudflare"
import { getUserByAddress } from "~/models/user.server"
import { getEnv } from "~/utils/env.server"

interface User {
  address: string
}

export function getSessionStorage(context: AppLoadContext) {
  const env = getEnv(context)
  return createCookieSessionStorage({
    cookie: {
      name: "__session",
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      secrets: [env.SESSION_SECRET],
      secure: env.ENVIRONMENT === "production",
    },
  })
}

const USER_SESSION_KEY = "userAddress"

export async function getSession(
  request: Request,
  sessionStorage: SessionStorage<SessionData, SessionData>,
) {
  const cookie = request.headers.get("Cookie")

  return sessionStorage.getSession(cookie)
}

export async function getUserAddress(
  request: Request,
  sessionStorage: SessionStorage<SessionData, SessionData>,
): Promise<User["address"] | undefined> {
  const session = await getSession(request, sessionStorage)
  const userAddress = session.get(USER_SESSION_KEY)

  return userAddress
}

export async function getUser(
  request: Request,
  sessionStorage: SessionStorage<SessionData, SessionData>,
) {
  const userAddress = await getUserAddress(request, sessionStorage)

  if (userAddress === undefined)
    return null

  const user = await getUserByAddress(userAddress)

  if (user)
    return user

  throw await logout(request, sessionStorage)
}

export async function requireUserAddress(
  request: Request,
  sessionStorage: SessionStorage<SessionData, SessionData>,
  redirectTo: string = new URL(request.url).pathname,
) {
  const userAddress = await getUserAddress(request, sessionStorage)

  if (!userAddress) {
    const searchParams = new URLSearchParams([["redirectTo", redirectTo]])
    throw redirect(`/login?${searchParams}`)
  }

  return userAddress
}

export async function requireUser(
  request: Request,
  sessionStorage: SessionStorage<SessionData, SessionData>,
) {
  const userAddress = await requireUserAddress(request, sessionStorage)

  const user = await getUserByAddress(userAddress)

  if (user)
    return user

  throw await logout(request, sessionStorage)
}

export async function createUserSession({
  request,
  sessionStorage,
  userAddress,
  remember,
  redirectTo,
}: {
  request: Request
  sessionStorage: SessionStorage<SessionData, SessionData>
  userAddress: string
  remember: boolean
  redirectTo: string
}) {
  const session = await getSession(request, sessionStorage)
  session.set(USER_SESSION_KEY, userAddress)

  return redirect(redirectTo, {
    headers: {
      "Set-Cookie": await sessionStorage.commitSession(session, {
        maxAge: remember
          ? 60 * 60 * 24 * 3 // 3 days
          : undefined,
      }),
    },
  })
}

export async function logout(
  request: Request,
  sessionStorage: SessionStorage<SessionData, SessionData>,
) {
  const session = await getSession(request, sessionStorage)

  return redirect("/", {
    headers: {
      "Set-Cookie": await sessionStorage.destroySession(session),
    },
  })
}
