### Expectations
In this repo you'll learn how to utilize [SIWE](https://docs.login.xyz/general-information/siwe-overview) as an authentication library, in a decentralized fashion

### Demo
There is currently not a demo because SIWE is built upon Node APIs like `Buffer` and given that I'm running the application on Cloudflare pages, it doesn't currently work. The code is fine though, if deployed to a Node environment. I don't this because I'm moving away from deployment services that run on Node. I assume that SIWE maintainers will, at some point, implement this, because the edge native applications are a real thing and they should address it. As soon as they address it, this demo will be the first to show it

### Files to pay attention
1. [login.tsx](/app/routes/login.tsx)
2. [join.tsx](/app/routes/join.tsx)
3. [logout.tsx](/app/routes/logout.tsx)
4. [user.tsx](/app/routes/user.tsx)
5. [cookies.server.ts](/app/utils/cookies.server.ts)
6. [session.server.ts](/app/utils/session.server.ts)
7. [user.server.ts](/app/models/user.server.ts)

### Links
- [Quick overview](https://docs.login.xyz/general-information/siwe-overview)
- [Detailed explanation of SIWE theory](https://docs.login.xyz/general-information/siwe-overview/eip-4361)

### Demos
- [spruceid/siwe-quickstart/tree/main/03_complete_app](https://github.com/spruceid/siwe-quickstart/tree/main/03_complete_app)
- [spruceid/siwe-notepad/tree/main](https://github.com/spruceid/siwe-notepad/tree/main)

### Instructions

#### Join
- Visit the page `/join` to be able to create an user from the wallet you are currently connected

#### Login
- Once the user is created, you can visit `/login` and naturally, login into the application

#### Logout
- Once logged in, you can try logging out

#### User
- Once logged in, you can try visiting the `/user` page which is private. If you are logged out, you won't be able to navigate there. This resembles the many private routes you may need to protect on your application

