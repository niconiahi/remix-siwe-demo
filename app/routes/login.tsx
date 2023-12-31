import { useEffect, useState } from "react";
import type {
  ActionFunctionArgs,
  LoaderFunctionArgs,
} from "@remix-run/cloudflare";
import { redirect, json } from "@remix-run/cloudflare";
import { Form, useLoaderData } from "@remix-run/react";
import type { JsonRpcSigner } from "@ethersproject/providers";
import { Web3Provider } from "@ethersproject/providers";
import { SiweErrorType, SiweMessage, generateNonce } from "siwe";
import { createUserSession, getSessionStorage } from "~/utils/session.server";
import { safeRedirect } from "~/utils/routing.server";
import { nonceCookie } from "~/utils/cookies.server";
import { PrimaryButton } from "~/components/primary-button";
import { HomeButton } from "~/components/home-button";
import { getUserByAddress } from "~/models/user.server";
import { envSchema } from "~/utils/env.server";

export async function action({ request, context }: ActionFunctionArgs) {
  const env = envSchema.parse(context.env);
  const formData = await request.formData();
  const url = new URL(request.url);
  const redirectTo = safeRedirect(url.searchParams.get("redirectTo"), "/");
  const message = formData.get("message");
  const account = formData.get("account");
  const signature = formData.get("signature");

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
    );
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
    );
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
    );
  }

  try {
    const siweMessage = new SiweMessage(message);
    // next line does the trick. It will throw if it's invalid
    await siweMessage.verify({ signature: siweMessage.prepareMessage() });

    const cookieHeader = request.headers.get("Cookie");
    const cookie = (await nonceCookie.parse(cookieHeader)) || {};

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
      );
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
        );
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
        );
      }
      default: {
        break;
      }
    }
  }

  const prevUser = await getUserByAddress(account);
  const sessionStorage = getSessionStorage(env.SESSION_SECRET);

  if (!prevUser) {
    return redirect("/join");
  } else {
    return createUserSession({
      request,
      sessionStorage,
      userAddress: account,
      remember: true,
      redirectTo,
    });
  }
}

export async function loader({ request }: LoaderFunctionArgs) {
  const cookieHeader = request.headers.get("Cookie");
  const cookie = (await nonceCookie.parse(cookieHeader)) || {};

  if (!cookie.nonce) {
    const nextNonce = generateNonce();
    cookie.nonce = nextNonce;

    return json(
      {
        nonce: nextNonce,
      },
      {
        headers: {
          "Set-Cookie": await nonceCookie.serialize(cookie),
        },
      },
    );
  }

  return json({
    nonce: cookie.nonce,
  });
}

export default function LoginPage() {
  const { nonce } = useLoaderData<typeof loader>();
  const { provider, connectProvider } = useProvider();
  const [account, setAccount] = useState<string | undefined>(undefined);
  const [message, setMessage] = useState<string | undefined>(undefined);
  const [signature, setSignature] = useState<string | undefined>(undefined);

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
            alert(
              "You need to have Metamask connected to create your signature",
            );

            return;
          }

          const account = await getAccount(provider);
          const signer = getSigner(provider);

          const siweMessage = new SiweMessage({
            uri: window.location.origin,
            domain: window.location.host,
            nonce,
            address: account,
            version: "0.1",
            chainId: 1,
            statement: "Sign in with Ethereum to this application",
          });

          const message = siweMessage.prepareMessage();
          setSignature(await signer.signMessage(message));
          setMessage(message);
          setAccount(account);
        }}
      >
        <span>2</span>
        <h3>Generate personal signature</h3>
      </PrimaryButton>
      <Form method="post">
        <input type="hidden" name="message" value={message} />
        <input type="hidden" name="account" value={account} />
        <input type="hidden" name="signature" value={signature} />
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
  );
}

function useProvider(): {
  provider: Web3Provider | undefined;
  connectProvider: () => void;
} {
  const [provider, setProvider] = useState<Web3Provider | undefined>(undefined);

  async function getProvider() {
    if ((window as any)?.ethereum) {
      const provider = new Web3Provider((window as any).ethereum);
      const account = await getAccount(provider);

      if (!account) return setProvider(undefined);

      setProvider(provider);
    } else {
      setProvider(undefined);
    }
  }

  useEffect(() => {
    if (typeof window === "undefined") return;

    getProvider();
  }, []);

  function connectProvider() {
    new Web3Provider((window as any).ethereum)
      .send("eth_requestAccounts", [])
      .then(() => {
        if (provider) return;

        getProvider();
      })
      .catch((error) => {
        if (error.code === -32002) {
          alert(
            "You have already connected Metamask to the application. Click on the Metamask extension and type your password",
          );
        }
      });
  }

  return { provider, connectProvider };
}

async function getAccount(provider: Web3Provider): Promise<string> {
  return provider.send("eth_accounts", []).then((accounts) => accounts[0]);
}

function getSigner(provider: Web3Provider): JsonRpcSigner {
  return provider.getSigner();
}
