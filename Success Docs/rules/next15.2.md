1: Next.js 15.2
Posted by
Jiachi Liu
Jiachi Liu
@huozhi
Jiwon Choi
Jiwon Choi
@devjiwonchoi
Jude Gao
Jude Gao
@gao_jude
Maia Teegarden
Maia Teegarden
@padmaia
Pranathi Peri
Pranathi Peri
@pranathiperii
Rauno Freiberg
Rauno Freiberg
@raunofreiberg
Sebastian Silbermann
Sebastian Silbermann
@sebsilbermann
Zack Tanner
Zack Tanner
@zt1072
Next.js 15.2 includes updates for debugging errors, metadata, Turbopack, and more:

Redesigned error UI and improved stack traces: A redesigned debugging experience
Streaming metadata: Async metadata will no longer block page rendering or client-side page transitions
Turbopack performance improvements: Faster compile times and reduced memory usage
React View Transitions (experimental): Experimental support for React's new View Transitions API
Node.js Middleware (experimental): Experimental support for using the Node.js runtime in Middleware
Upgrade today, or get started with:

Terminal

# Use the automated upgrade CLI
npx @next/codemod@canary upgrade latest
 
# ...or upgrade manually
npm install next@latest react@latest react-dom@latest
 
# ...or start a new project
npx create-next-app@latest
Redesigned error UI and improved stack traces
We've added both visual and quality improvements to errors you may encounter while building your application. Let's walk through each area of improvements:

Error overlay
An example of the Next.js error overlay after version 15.2
An example of the Next.js error overlay after version 15.2
We've overhauled the UI and presentation of error messages in Next.js, making them easier to understand. The new design highlights the core details of the error—such as the message, the relevant code frame, and the call stack—while reducing noise from code in libraries or dependencies. This means you can quickly get to the root of what went wrong and start fixing it faster.

Leveraging the newly introduced owner stacks feature in React, we're now able to provide higher fidelity into where your errors are coming from. Next.js will now be able to surface the subcomponent responsible for throwing the error, skipping over intermediary elements that weren't responsible for creating the element that caused the error.

We're also making it easier to customize your indicator preferences without needing to add additional configuration.

An example of the Next.js dev tools preferences
An example of the Next.js dev tools preferences
We've added a feedback section at the bottom of error overlays that lets you rate how helpful the error message was. Your opinion helps us understand common pain points and improve error messages to make debugging easier.

Dev indicator
The various states of the dev indicator, from rendering to showing additional information.
We've consolidated development information into a new, streamlined indicator that shows details like rendering mode and build status.

During compilation, you'll notice a dimmed, animated Next.js logo when navigating between routes. The logo brightens once compilation is complete and React begins rendering, providing a visual cue of your application's state.

Opening the dev indicator now displays:

Your current route's rendering mode (static/dynamic)
Turbopack compilation status
Active errors with quick access to the error overlay
Future updates will expand this menu to include:

PPR (Partial Prerendering) debugging tools
Cache monitoring features
Additional developer tooling
This unified approach puts all crucial development information in one accessible location. We'll continue to refine and expand this feature in future releases based on your feedback.

Streaming metadata
It can often be necessary to fetch dynamic data, or perform some async operation, in generateMetadata. In prior versions of Next.js, this metadata needed to finish generating before the initial UI would be sent so it could be included in the document <head>.

This meant that for many pages where a fast initial UI was available, the initial paint was still delayed by data requirements that did not affect what the user would see visually. We've improved this in 15.2 by allowing the initial UI to be sent to the browser even before generateMetadata has completed.

An example of the Next.js dev tools preferences
An example of the Next.js dev tools preferences
However, to maintain compatibility with bots and crawlers that expect metadata to be available in the <head> of the document, we continue to delay sending HTML to certain bot user agents. If you need more fine-grained control over which bots receive this treatment, you can customize the regex used to serve them via the htmlLimitedBots option in next.config.js.

Learn more about streaming metadata.

Turbopack performance improvements
Turbopack was marked stable with Next.js 15.

We've been working on improving Turbopack's performance, particularly in scenarios without persistent caching. As part of this release, we've introduced the following enhancements:

Faster compile times: Early adopters have reported up to 57.6% faster compile times when accessing routes compared to Next.js 15.1.
Reduced memory usage: For the vercel.com application, we observed a 30% decrease in memory usage during local development.
With these improvements, Turbopack should now be faster than Webpack in virtually all cases. If you encounter a scenario where this isn't true for your application, please reach out—we want to investigate these.

We've also made progress on persistent caching and production builds. Although these features aren't ready for an experimental release yet, we've started testing them on real-world projects. We'll share more detailed metrics once they're available for broader use.

React View Transitions (experimental)
We've added a feature flag to enable the new experimental View Transitions API in React. This new API allows you to animate between different views and components in your application.

To enable this feature, add the following to your next.config.js:

next.config.js

module.exports = {
  experimental: {
    viewTransition: true,
  },
};
Note: This feature is highly experimental and may change in future releases.

For more information on how to use this feature, please refer to the original View Transition pull request in the React repository. This work builds on the native browser implementation of View Transitions.

We will be publishing more documentation and examples as stability progresses.

Node.js Middleware (experimental)
We've been working on a new experimental flag to allow using the Node.js runtime for the Next.js Middleware.

To enable this feature, add the following to your next.config.js:

next.config.js

module.exports = {
  experimental: {
    nodeMiddleware: true,
  },
};
You can then specify the Node.js runtime in your Middleware config export:

middleware.js

import bcrypt from 'bcrypt';
 
const API_KEY_HASH = process.env.API_KEY_HASH; // Pre-hashed API key in env
 
export default async function middleware(req) {
  const apiKey = req.headers.get('x-api-key');
 
  if (!apiKey || !(await bcrypt.compare(apiKey, API_KEY_HASH))) {
    return new Response('Forbidden', { status: 403 });
  }
 
  console.log('API key validated');
}
 
export const config = {
  runtime: 'nodejs',
};
Note: This feature is not yet recommended for production use. Therefore, Next.js will throw an error unless you are using the next@canary release instead of the stable release.

We are planning to take this opportunity to improve and reshape the Middleware API. If you have any suggestions or requests, please let us know. Node.js Middleware was a top community request and we are excited to have this addressed.

Coming soon
"use cache" (beta): We've been working on stabilizing "use cache" as a standalone feature. Stay tuned for more details in the coming releases. Learn more about "use cache".
Turbopack persistent caching (experimental): We've been dogfooding persistent caching at Vercel with positive performance improvements. Once we've stabilized it further, we'll release it behind a feature flag for additional feedback and testing.
Other Changes
[Feature] Add --api flag to create a headless API-only with create-next-app (PR)
[Feature] Add support for images.qualities with next/image (PR)
[Deprecation] Warn about i18n configuration deprecation in App Router (PR)
[Improvement] Improve lint performance of no-html-link-for-pages (PR)
[Improvement] Emit build error if "use action" directive is incorrectly used (PR)
[Improvement] Display global-error alongside dev overlay during development (PR)
[Improvement] Allow disabling HTTP request logs in development server (PR)
[Improvement] Add pagination SEO link tags (PR)
[Improvement] Improve JSDocs for metadata and <Link> components (PR)
[Improvement] Middleware should match next/image requests (PR)
[Improvement] Add hostname to default error boundary message (PR)
[Improvement] Send errors not handled by explicit error boundaries through reportError (PR)

2: Building APIs with Next.js
Posted by
Lee Robinson
Lee Robinson
@leeerob
This guide will cover how you can build APIs with Next.js, including setting up your project, understanding the App Router and Route Handlers, handling multiple HTTP methods, implementing dynamic routing, creating reusable middleware logic, and deciding when to spin up a dedicated API layer.

1. Getting started
1.1 Create a Next.js app
1.2 App Router vs. Pages Router
2. Why (and when) to build APIs with Next.js
3. Creating an API with Route Handlers
3.1 Basic file setup
3.2 Multiple HTTP methods in one file
4. Working with Web APIs
4.1 Directly using Request & Response
4.2 Query parameters
4.3 Headers and cookies
5. Dynamic routes
6. Using Next.js as a proxy or forwarding layer
7. Building shared “middleware” logic
8. Deployment and “SPA Mode” considerations
8.1 Standard Node.js deployment
8.2 SPA/Static Export
8.3 Deploying APIs on Vercel
9. When to skip creating an API endpoint
10. Putting It All Together
Conclusion
Frequently Asked Questions
What about Server Actions?
Can I use TypeScript with Route Handlers?
What are the best practices for authentication?
1. Getting started
1.1 Create a Next.js app
If you’re starting fresh, you can create a new Next.js project using:

Terminal

npx create-next-app@latest --api
Note: The --api flag automatically includes an example route.ts in your new project’s app/ folder, demonstrating how to create an API endpoint.

1.2 App Router vs. Pages Router
Pages Router: Historically, Next.js used pages/api/* for APIs. This approach relied on Node.js request/response objects and an Express-like API.
App Router (Default): Introduced in Next.js 13, the App Router fully embraces web standard Request/Response APIs. Instead of pages/api/*, you can now place route.ts or route.js files anywhere inside the app/ directory.
Why switch? The App Router’s “Route Handlers” lean on the Web Platform Request/Response APIs rather than Node.js-specific APIs. This simplifies learning, reduces friction, and helps you reuse your knowledge across different tools.

2. Why (and when) to build APIs with Next.js
Public API for Multiple Clients

You can build a public API that’s consumed by your Next.js web app, a separate mobile app, or any third-party service. For example, you might fetch from /api/users both in your React website and a React Native mobile app.
Proxy to an Existing Backend

Sometimes you want to hide or consolidate external microservices behind a single endpoint. Next.js Route Handlers can act as a proxy or middle layer to another existing backend. For instance, you might intercept requests, handle authentication, transform data, and then pass the request along to an upstream API.
Webhooks and Integrations

If you receive external callbacks or webhooks (e.g., from Stripe, GitHub, Twilio), you can handle them with Route Handlers.
Custom Authentication

If you need sessions, tokens, or other auth logic, you can store cookies, read headers, and respond with the appropriate data in your Next.js API layer.
Note: If you only need server-side data fetching for your own Next.js app (and you don’t need to share that data externally), Server Components might be sufficient to fetch data directly during render—no separate API layer is required.

3. Creating an API with Route Handlers
3.1 Basic file setup
In the App Router (app/), create a folder that represents your route, and inside it, a route.ts file.

For example, to create an endpoint at /api/users:


app
└── api
    └── users
        └── route.ts
3.2 Multiple HTTP methods in one file
Unlike the Pages Router API routes (which had a single default export), you can export multiple functions representing different HTTP methods from the same file.

app/api/users/route.ts

import { NextRequest } from 'next/server';
 
export async function GET(request: NextRequest) {
  // For example, fetch data from your DB here
  const users = [{ id: 1, name: 'Alice' }, { id: 2, name: 'Bob' }];
  return new Response(JSON.stringify(users), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
 
export async function POST(request: NextRequest) {
  // Parse the request body
  const body = await request.json();
  const { name } = body;
 
  // e.g. Insert new user into your DB
  const newUser = { id: Date.now(), name };
 
  return new Response(JSON.stringify(newUser), {
    status: 201,
    headers: { 'Content-Type': 'application/json' },
  });
}
Now, sending a GET request to /api/users returns your list of users, while a POST request to the same URL will insert a new one.

4. Working with Web APIs
4.1 Directly using Request & Response
By default, your Route Handler methods (GET, POST, etc.) receive a standard Request object, and you must return a standard Response object.

4.2 Query parameters
app/api/search/route.ts

import { NextRequest } from 'next/server';
 
export function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('query'); // e.g. `/api/search?query=hello`
 
  return new Response(
    JSON.stringify({ result: `You searched for: ${query}` }),
    {
      headers: { 'Content-Type': 'application/json' },
    },
  );
}
4.3 Headers and cookies
app/api/auth/route.ts

import { NextRequest } from 'next/server';
import { cookies, headers } from 'next/headers';
 
export async function GET(request: NextRequest) {
  // 1. Using 'next/headers' helpers
  const cookieStore = cookies();
  const token = cookieStore.get('token');
 
  const headersList = headers();
  const referer = headersList.get('referer');
 
  // 2. Using the standard Web APIs
  const userAgent = request.headers.get('user-agent');
 
  return new Response(JSON.stringify({ token, referer, userAgent }), {
    headers: { 'Content-Type': 'application/json' },
  });
}
The cookies() and headers() functions can be helpful if you plan to re-use shared logic across other server-side code in Next.js.

5. Dynamic routes
To create dynamic paths (e.g. /api/users/:id), use Dynamic Segments in your folder structure:


app
└── api
    └── users
        └── [id]
            └── route.ts
This file corresponds to a URL like /api/users/123, with the 123 captured as a parameter.

app/api/users/[id]/route.ts

import { NextRequest } from 'next/server';
 
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const id = (await params).id;
  // e.g. Query a database for user with ID `id`
  return new Response(JSON.stringify({ id, name: `User ${id}` }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
 
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const id = (await params).id;
  // e.g. Delete user with ID `id` in DB
  return new Response(null, { status: 204 });
}
Here, params.id gives you the dynamic segment.

6. Using Next.js as a proxy or forwarding layer
A common scenario is proxying an existing backend service. You can authenticate requests, handle logging, or transform data before sending it to a remote server or backend:

app/api/external/route.ts

import { NextRequest } from 'next/server';
 
export async function GET(request: NextRequest) {
  const response = await fetch('https://example.com/api/data', {
    // Optional: forward some headers, add auth tokens, etc.
    headers: { Authorization: `Bearer ${process.env.API_TOKEN}` },
  });
 
  // Transform or forward the response
  const data = await response.json();
  const transformed = { ...data, source: 'proxied-through-nextjs' };
 
  return new Response(JSON.stringify(transformed), {
    headers: { 'Content-Type': 'application/json' },
  });
}
Now your clients only need to call /api/external, and Next.js will handle the rest. This is also sometimes called a “Backend for Frontend” or BFF.

7. Building shared “middleware” logic
If you want to apply the same logic (e.g. authentication checks, logging) across multiple Route Handlers, you can create reusable functions that wrap your handlers:

app/lib/with-auth.ts

import { NextRequest } from 'next/server';
 
type Handler = (req: NextRequest, context?: any) => Promise<Response>;
 
export function withAuth(handler: Handler): Handler {
  return async (req, context) => {
    const token = req.cookies.get('token')?.value;
    if (!token) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }
 
    // If authenticated, call the original handler
    return handler(req, context);
  };
}
Then in your Route Handler:

app/api/secret/route.ts

import { NextRequest } from 'next/server';
import { withAuth } from '@/app/lib/with-auth';
 
async function secretGET(request: NextRequest) {
  return new Response(JSON.stringify({ secret: 'Here be dragons' }), {
    headers: { 'Content-Type': 'application/json' },
  });
}
 
export const GET = withAuth(secretGET);
8. Deployment and “SPA Mode” considerations
8.1 Standard Node.js deployment
The standard Next.js server deployment using next start enables you to use features like Route Handlers, Server Components, Middleware and more – while taking advantage of dynamic, request time information.

There is no additional configuration required. See Deploying for more details.

8.2 SPA/Static Export
Next.js also supports outputting your entire site as a static Single-Page Application (SPA).

You can enable this by setting:

next.config.ts

import type { NextConfig } from 'next';
 
const nextConfig: NextConfig = {
  output: 'export',
};
 
export default nextConfig;
In static export mode, Next.js will generate purely static HTML, CSS, and JS. You cannot run server-side code (like API endpoints). If you still need an API, you’d have to host it separately (e.g., a standalone Node.js server).

Note:

GET Route Handlers can be statically exported if they don’t rely on dynamic request data. They become static files in your out folder.
All other server features (dynamic requests, rewriting cookies, etc.) are not supported in a pure SPA export.
8.3 Deploying APIs on Vercel
If you are deploying your Next.js application to Vercel, we have a guide on deploying APIs. This includes other Vercel features like programmatic rate-limiting through the Vercel Firewall. Vercel also offers Cron Jobs, which are commonly needed with API approaches.

9. When to skip creating an API endpoint
With the App Router’s React Server Components, you can fetch data directly on the server without exposing a public endpoint:

app/users/page.tsx

// (Server Component)
export default async function UsersPage() {
  // This fetch runs on the server (no client-side code needed here)
  const res = await fetch('https://api.example.com/users');
  const data = await res.json();
 
  return (
    <main>
      <h1>Users</h1>
      <ul>
        {data.map((user: any) => (
          <li key={user.id}>{user.name}</li>
        ))}
      </ul>
    </main>
  );
}
If your data is only used inside your Next.js app, you may not need a public API at all.

10. Putting It All Together
Create a new Next.js project: npx create-next-app@latest --api.
Add Route Handlers inside the app/ directory (e.g., app/api/users/route.ts).
Export HTTP methods (GET, POST, PUT, DELETE, etc.) in the same file.
Use Web Standard APIs to interact with the Request object and return a Response.
Build a public API if you need other clients to consume your data, or to proxy a backend service.
Fetch your new API routes from the client (e.g., within a Client Component or with fetch('/api/...')).
Or skip creating an API altogether if a Server Component can just fetch data.
Add a shared “middleware” pattern (e.g., withAuth()) for auth or other repeated logic.
Deploy to a Node.js-capable environment for server features, or export statically if you only need a static SPA.
Conclusion
Using the Next.js App Router and Route Handlers gives you a flexible, modern way to build APIs that embrace the Web Platform directly. You can:

Create a full public API to be shared by web, mobile, or third-party clients.
Proxy and customize calls to existing external services.
Implement a reusable “middleware” layer for authentication, logging, or any repeated logic.
Dynamically route requests using the [id] segment folder structure.
Frequently Asked Questions
What about Server Actions?
You can think of Server Actions like automatically generated POST API routes that can be called from the client.

They are designed for mutation operations, such as creating, updating, or deleting data. You call a Server Action like a normal JavaScript function, versus making an explicit fetch to a defined API route.

While there is still a network request happening, you don't need to manage it explicitly. The URL path is auto-generated and encrypted, so you can't manually access a route like /api/users in the browser.

If you plan to use Server Actions and expose a public API, we recommend moving the core logic to a Data Access Layer and calling the same logic from both the Server Action and the API route.

Can I use TypeScript with Route Handlers?
Yes, you can use TypeScript with Route Handlers. For example, defining the Request and Response types in your route file.

