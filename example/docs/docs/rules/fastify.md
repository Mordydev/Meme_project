fastify
Fast and low overhead web framework, for Node.js

Why
An efficient server implies a lower cost of the infrastructure, better responsiveness under load, and happy users. How can you efficiently handle the resources of your server, knowing that you are serving the highest number of requests possible, without sacrificing security validations and handy development?

Enter Fastify. Fastify is a web framework highly focused on providing the best developer experience with the least overhead and a powerful plugin architecture. It is inspired by Hapi and Express and as far as we know, it is one of the fastest web frameworks in town.

Core features
These are the main features and principles on which Fastify has been built:

Highly performant: as far as we know, Fastify is one of the fastest web frameworks in town, depending on the code complexity we can serve up to 30 thousand requests per second.
Extensible: Fastify is fully extensible via its hooks, plugins, and decorators.
Schema-based: even if it is not mandatory we recommend using JSON Schema to validate your routes and serialize your outputs. Internally Fastify compiles the schema in a highly performant function.
Logging: logs are extremely important but are costly; we chose the best logger to almost remove this cost, Pino!
Developer friendly: the framework is built to be very expressive and help developers in their daily use, without sacrificing performance and security.
TypeScript ready: we work hard to maintain a TypeScript type declaration file so we can support the growing TypeScript community.
Quick start
Get Fastify with NPM:

npm install fastify

Then create server.js and add the following content:

ESM
CJS
// Import the framework and instantiate it
import Fastify from 'fastify'
const fastify = Fastify({
  logger: true
})

// Declare a route
fastify.get('/', async function handler (request, reply) {
  return { hello: 'world' }
})

// Run the server!
try {
  await fastify.listen({ port: 3000 })
} catch (err) {
  fastify.log.error(err)
  process.exit(1)
}

Finally, launch the server with:

node server

and test it with:

curl http://localhost:3000

Using CLI
Get the fastify-cli to create a new scaffolding project:

npm install --global fastify-cli
fastify generate myproject
Request/Response validation and hooks
Fastify can do much more than this. For example, you can easily provide input and output validation using JSON Schema and perform specific operations before the handler is executed:

ESM
CJS
import Fastify from 'fastify'
const fastify = Fastify({
  logger: true
})

fastify.route({
  method: 'GET',
  url: '/',
  schema: {
    // request needs to have a querystring with a `name` parameter
    querystring: {
      type: 'object',
      properties: {
          name: { type: 'string'}
      },
      required: ['name'],
    },
    // the response needs to be an object with an `hello` property of type 'string'
    response: {
      200: {
        type: 'object',
        properties: {
          hello: { type: 'string' }
        }
      }
    }
  },
  // this function is executed for every request before the handler is executed
  preHandler: async (request, reply) => {
    // E.g. check authentication
  },
  handler: async (request, reply) => {
    return { hello: 'world' }
  }
})

try {
  await fastify.listen({ port: 3000 })
} catch (err) {
  fastify.log.error(err)
  process.exit(1)
}

TypeScript Support
Fastify is shipped with a typings file, but you may need to install @types/node, depending on the Node.js version you are using.
The following example creates a http server.
We pass the relevant typings for our http version used. By passing types we get correctly typed access to the underlying http objects in routes.
If using http2 we would pass <http2.Http2Server, http2.Http2ServerRequest, http2.Http2ServerResponse>.
For https pass http2.Http2SecureServer or http.SecureServer instead of Server.
This ensures within the server handler we also get http.ServerResponse with correct typings on reply.res.

TypeScript
import Fastify, { FastifyInstance, RouteShorthandOptions } from 'fastify'
import { Server, IncomingMessage, ServerResponse } from 'http'

const server: FastifyInstance = Fastify({})

const opts: RouteShorthandOptions = {
  schema: {
    response: {
      200: {
        type: 'object',
        properties: {
          pong: {
            type: 'string'
          }
        }
      }
    }
  }
}

server.get('/ping', opts, async (request, reply) => {
  return { pong: 'it worked!' }
})

const start = async () => {
  try {
    await server.listen({ port: 3000 })

    const address = server.server.address()
    const port = typeof address === 'string' ? address : address?.port

  } catch (err) {
    server.log.error(err)
    process.exit(1)
  }
}

start()

Plugins
There are 60 core plugins and 239 community plugins
A core plugin is a plugin maintained by the Fastify team, and we do our best to maintain them according to the Fastify Long Term Support policy
We guarantee that every community plugin respects Fastify best practices (tests, etc) at the time they have been added to the list. We offer no guarantee on their maintenance
Can't find the plugin you're looking for? No problem, you can learn how to do it! Would need to check the githib of these links can be found here https://fastify.dev/ecosystem/. 
