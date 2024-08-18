import type { JsonRpcSigner } from "@ethersproject/providers"
import { Web3Provider } from "@ethersproject/providers"
import type {
  ActionFunctionArgs,
  LoaderFunctionArgs,
} from "@remix-run/cloudflare"
import { json, redirect } from "@remix-run/cloudflare"
import { Form, useLoaderData } from "@remix-run/react"
import { useEffect, useState } from "react"
import { SiweErrorType, SiweMessage, generateNonce } from "siwe"

import { HomeButton } from "~/components/home-button"
import { PrimaryButton } from "~/components/primary-button"
import { getUserByAddress } from "~/models/user.server"
import { nonceCookie } from "~/utils/cookies.server"
import { safeRedirect } from "~/utils/routing.server"
import { createUserSession, getSessionStorage } from "~/utils/session.server"

export async function action({ request, context }: ActionFunctionArgs) {
  const formData = await request.formData()
  const url = new URL(request.url)
  const redirectTo = safeRedirect(url.searchParams.get("redirectTo"), "/")
  const message = formData.get("message")
  const account = formData.get("account")
  const signature = formData.get("signature")

  if (typeof message !== "string") {
    return json(
      {
        errors: {
          nonce: null,
          account: null,
          message: "Message is required",
          signature: null,
          expired: null,
          valid: null,
        },
      },
      { status: 400 },
    )
  }

  if (typeof account !== "string") {
    return json(
      {
        errors: {
          nonce: null,
          account: "A connected account is required",
          message: null,
          signature: null,
          expired: null,
          valid: null,
        },
      },
      { status: 400 },
    )
  }

  if (typeof signature !== "string") {
    return json(
      {
        errors: {
          nonce: null,
          account: null,
          message: null,
          signature: "Signature is required",
          expired: null,
          valid: null,
        },
      },
      { status: 400 },
    )
  }

  try {
    const siweMessage = new SiweMessage(message)
    // next line does the trick. It will throw if it's invalid
    await siweMessage.verify({ signature })

    const cookieHeader = request.headers.get("Cookie")
    const cookie = (await nonceCookie.parse(cookieHeader)) || {}

    if (siweMessage.nonce !== cookie.nonce) {
      return json(
        {
          errors: {
            nonce: "Invalid nonce",
            account: null,
            message: null,
            signature: null,
            expired: null,
            valid: null,
          },
        },
        { status: 422 },
      )
    }
  } catch (error) {
    switch (error) {
      case SiweErrorType.EXPIRED_MESSAGE: {
        return json(
          {
            errors: {
              nonce: null,
              account: null,
              message: null,
              signature: null,
              expired: "Your sesion has expired",
              valid: null,
            },
          },
          { status: 400 },
        )
      }
      case SiweErrorType.INVALID_SIGNATURE: {
        return json(
          {
            errors: {
              nonce: null,
              account: null,
              message: null,
              signature: null,
              expired: null,
              valid: "Your signature is invalid",
            },
          },
          { status: 400 },
        )
      }
      default: {
        break
      }
    }
  }

  const prevUser = await getUserByAddress(account)
  const sessionStorage = getSessionStorage(context)

  if (!prevUser) {
    return redirect("/join")
  } else {
    return createUserSession({
      request,
      sessionStorage,
      userAddress: account,
      remember: true,
      redirectTo,
    })
  }
}

export async function loader({ request }: LoaderFunctionArgs) {
  const cookieHeader = request.headers.get("Cookie")
  const cookie = (await nonceCookie.parse(cookieHeader)) || {}

  if (!cookie.nonce) {
    const nextNonce = generateNonce()
    cookie.nonce = nextNonce

    return json(
      {
        nonce: nextNonce,
      },
      {
        headers: {
          "Set-Cookie": await nonceCookie.serialize(cookie),
        },
      },
    )
  }

  return json({
    nonce: cookie.nonce,
  })
}

export default function LoginPage() {
  const { nonce } = useLoaderData<typeof loader>()
  const { provider, connectProvider } = useProvider()
  const [account, setAccount] = useState<string | undefined>(undefined)
  const [message, setMessage] = useState<string | undefined>(undefined)
  const [signature, setSignature] = useState<string | undefined>(undefined)

  return (
    <main className="flex h-full w-full items-center justify-center space-x-2">
      <HomeButton />
      <PrimaryButton
        aria-label="Connect your wallet"
        disabled={Boolean(provider)}
        onClick={() => connectProvider()}
      >
        <span>1</span>
        <h3>Connect your wallet</h3>
      </PrimaryButton>
      <PrimaryButton
        aria-label="Generate personal signature"
        disabled={Boolean(!provider) || Boolean(signature)}
        onClick={async () => {
          if (!provider) {
            // eslint-disable-next-line no-alert
            alert(
              "You need to have Metamask connected to create your signature",
            )

            return
          }

          const signer = getSigner(provider)
          const siweMessage = new SiweMessage({
            uri: window.location.origin,
            domain: window.location.host,
            nonce,
            address: await signer.getAddress(),
            version: "1",
            chainId: 1,
            statement: "Sign in with Ethereum to this application",
          })

          const message = siweMessage.prepareMessage()
          setSignature(await signer.signMessage(message))
          setMessage(message)

          const account = await getAccount(provider)
          setAccount(account)
        }}
      >
        <span>2</span>
        <h3>Generate personal signature</h3>
      </PrimaryButton>
      <Form method="post">
        <input type="hidden" name="message" defaultValue={message} />
        <input type="hidden" name="account" defaultValue={account} />
        <input type="hidden" name="signature" defaultValue={signature} />
        <PrimaryButton
          type="submit"
          name="_action"
          aria-label="Connect your wallet"
          disabled={Boolean(!message) || Boolean(!signature)}
        >
          <span>3</span>
          <h3>Login</h3>
        </PrimaryButton>
      </Form>
    </main>
  )
}

function useProvider(): {
  provider: Web3Provider | undefined
  connectProvider: () => void
} {
  const [provider, setProvider] = useState<Web3Provider | undefined>(undefined)

  async function getProvider() {
    if ((window as any)?.ethereum) {
      const provider = new Web3Provider((window as any).ethereum)
      const account = await getAccount(provider)

      if (!account) {
        return setProvider(undefined)
      }

      setProvider(provider)
    } else {
      setProvider(undefined)
    }
  }

  useEffect(() => {
    if (typeof window === "undefined") {
      return
    }

    getProvider()
  }, [])

  function connectProvider() {
    new Web3Provider((window as any).ethereum)
      .send("eth_requestAccounts", [])
      .then(() => {
        if (provider) {
          return
        }

        getProvider()
      })
      .catch((error) => {
        if (error.code === -32002) {
          // eslint-disable-next-line no-alert
          alert(
            "You have already connected Metamask to the application. Click on the Metamask extension and type your password",
          )
        }
      })
  }

  return { provider, connectProvider }
}

async function getAccount(provider: Web3Provider): Promise<string> {
  return provider.send("eth_accounts", []).then(accounts => accounts[0])
}

function getSigner(provider: Web3Provider): JsonRpcSigner {
  return provider.getSigner()
}
