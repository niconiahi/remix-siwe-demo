import { createCookie } from "@remix-run/cloudflare"

export const nonceCookie = createCookie("nonce", {
  maxAge: 604_800,
})
