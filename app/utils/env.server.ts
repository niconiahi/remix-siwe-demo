import type { AppLoadContext } from "@remix-run/cloudflare"

interface Env {
  SESSION_SECRET: string
  ENVIRONMENT: string
}

export function getEnv(context: AppLoadContext): Env {
  return context.cloudflare.env
}
