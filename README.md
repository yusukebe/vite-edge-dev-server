# edge-dev-server

This is an experiment to run the runtime for Edge in dev-server. This is using [the new feature](https://github.com/vitejs/vite/pull/12165) for Vite that will be introduced soon.

## Features

- This plugin replaces Vite's built-in dev-server.
- You can specify a `fetch`-based application that can run on Cloudflare Workers, etc as an entry.
- Your application will be evaluated by [The Edge Runtime](https://edge-runtime.vercel.app/).
- Support HMR.

## How this work

- `EdgeRunner` receives the code. An instance of Edge Runtime evaluates it.
- Within the plugin, the Vite runtime has the runner executes the entry file.
- The executed application is running on `@hono/node-server`.

## References

- https://github.com/vitejs/vite/pull/12165 - The PR
- https://github.com/sapphi-red/vite-envs/tree/use-vite-runtime - Heavily inspired. Thanks!
