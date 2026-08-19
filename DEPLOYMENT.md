# Deployment

Every deployable app in this monorepo ships to **Cloudflare Workers**. The Next.js apps go
through `@opennextjs/cloudflare`; the two background workers are plain Workers.

## What deploys where

| App | Type | Worker name | Port (dev) |
|---|---|---|---|
| `apps/web` | Next (marketing, `shipithq.com`) | `shipithq-web` | 4100 |
| `apps/main` | Next (product, `app.shipithq.com`) | `shipithq-main` | 4101 |
| `apps/admin` | Next | `shipithq-admin` | 3005 |
| `apps/hiring` | Next | `shipithq-hiring` | 3002 |
| `apps/uni` | Next | `shipithq-uni` | 3003 |
| `apps/shipitworker` | Cloudflare Worker + Container | `shipithq-shipitworker` | - |
| `apps/worker` | Cloudflare Worker (Durable Objects + Alarms) | `shipithq-worker` | - |

### Deploy order matters

`apps/main` and `apps/uni` declare **service bindings** to both workers by name. A binding
to a Worker script that does not exist yet fails the deploy, so:

```bash
cd apps/shipitworker && pnpm release     # 1. code executor  (shipithq-shipitworker)
cd apps/worker       && pnpm release     # 2. job worker     (shipithq-worker)
cd apps/main         && pnpm release     # 3. apps that bind to them
cd apps/uni          && pnpm release
```

The workers can be redeployed on their own afterwards; the bindings survive.

> **`apps/worker` was renamed.** It used to be `apps/generationworker`, deployed as
> `shipithq-generation`. It is now `shipithq-worker` - a different Worker script, with its own
> Durable Object namespaces. Deploy the new one, deploy `apps/main` and `apps/uni` against it,
> let any in-flight generation jobs on the old script finish (they take minutes, not hours),
> then delete `shipithq-generation` in the dashboard. Do not delete it first: its Durable
> Objects are still holding jobs that users are polling.

Each Next app owns two config files:

- `wrangler.jsonc` - worker name, compatibility flags, asset + R2 bindings
- `open-next.config.ts` - the OpenNext adapter config (incremental cache)

## One-time setup

The R2 bucket backing the Next incremental cache is **shared by all the Next apps**, so it
only has to be created once for the whole monorepo:

```bash
wrangler r2 bucket create shipithq-next-cache
```

Each app namespaces its own entries inside that bucket via `NEXT_INC_CACHE_R2_PREFIX` in its
`wrangler.jsonc`, so they cannot collide.

The binding name must stay exactly `NEXT_INC_CACHE_R2_BUCKET` - that is the name
`r2IncrementalCache` looks up. Rename it and nothing errors; the cache just silently never
hits and every request re-renders inside the Worker.

## Commands

From an app directory (or `pnpm --filter <app> <script>` from the root):

```bash
pnpm deploy:build     # build the Worker bundle into .open-next/
pnpm preview          # run that bundle locally in workerd
pnpm deploy           # build + wrangler deploy        (code only - the default)
pnpm deploy:secrets   # build + deploy, also uploading secrets
pnpm cf-typegen       # regenerate cloudflare-env.d.ts from the wrangler bindings
```

`deploy` never depends on a local secrets file. Secrets are uploaded only by
`deploy:secrets`, which reads `secrets.json` (admin, hiring, uni, main) or `.env.production`
(web). Both are gitignored. Setting secrets once via the Cloudflare dashboard or
`wrangler secret put` and then using plain `deploy` is equally valid.

## Deploying `apps/shipitworker` (the code executor)

This one is different from every other app here: it ships a **Cloudflare Container**, not
just a Worker. `wrangler deploy` builds the `Dockerfile`, pushes the image to Cloudflare's
own registry, and rolls the Container application - so it has requirements the others do not.

**Prerequisites**

1. A **paid Workers plan**. Containers are not on the free plan; the deploy fails at the
   container step, not at the Worker step, so it looks like a build error.
2. A **running Docker daemon** on the machine doing the deploy. Wrangler builds the image
   locally and pushes it. `docker info` is the check.
3. `wrangler` v4 (already pinned in the app's `devDependencies`).

**The deploy**

```bash
cd apps/shipitworker
cp .env.production.example .env.production   # fill in WORKER_SECRET
pnpm release                                 # wrangler deploy --secrets-file .env.production
```

`WORKER_SECRET` must be byte-identical to `apps/main`'s, because that is the bearer token the
executor checks. Note the trap `--secrets-file` shares with every other app here: a key
present with an **empty** value overwrites the live secret with an empty string. Delete the
line instead of blanking it.

**What the deploy actually does**

- builds `Dockerfile` (node 20 + tsx + python3 + gcc/g++ + JDK) for **linux/amd64**
- pushes it to the Cloudflare container registry under `shipithq-code-executor`
- provisions the container application with `max_instances: 5`
- deploys the Worker + the `CodeExecutor` Durable Object that owns the container lifecycle

The first deploy is slow (a few minutes - the image carries a JDK). Later deploys only push
changed layers, so keep the `apt-get` layer above the `COPY`, which it already is.

**On Apple Silicon**, the image must still be amd64. Wrangler asks Docker for the right
platform, but if a cached local build was made natively the push can fail with an
architecture error. `docker builder prune` and redeploy, or build explicitly:

```bash
docker build --platform linux/amd64 -t shipithq-code-executor .
```

**Verifying**

```bash
curl https://shipithq-shipitworker.<subdomain>.workers.dev/health
# {"ok":true}

curl -X POST https://shipithq-shipitworker.<subdomain>.workers.dev/api/v1/execute \
  -H "Authorization: Bearer $WORKER_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"code":"print(1+1)","language":"python"}'
```

The first request after a deploy (or after `sleepAfter: "3m"` has elapsed) pays a container
cold start of a few seconds. That is why `src/index.ts` spreads requests over a pool of five
warm instances rather than one.

**Cost shape.** Containers bill for the time an instance is awake, not per request. The
`sleepAfter = "3m"` in `src/executor-container.ts` is the knob: longer keeps runs fast and
costs more, shorter is cheaper and colder. `max_instances: 5` is the ceiling on concurrency -
past it, requests queue.

**How apps/main reaches it.** Over the `CODE_EXECUTOR` service binding, so the executor does
not need a public route at all and the request never leaves Cloudflare's network. The
`NEXT_PUBLIC_WORKER_URL` fallback is only for local `next dev`, where there is no binding.
Once bound, you can remove the worker's public workers.dev route entirely.

## Rules that are easy to get wrong

**Middleware must stay named `middleware.ts` - never `proxy.ts`.**
Next 16 renames Middleware to Proxy. Do not make that rename here: the Cloudflare adapter
does not support the `proxy.ts` convention, while `middleware.ts` is still fully supported by
Next 16 and is what OpenNext bundles. `apps/main`, `apps/hiring` and `apps/uni` each have a
`middleware.ts` that must keep its name.

**`public/_headers` does nothing on Workers.**
`_headers` is a Cloudflare *Pages* feature and is silently ignored by a Workers deploy.
Declare security and cache headers in `next.config.mjs` / `next.config.js` under `headers()`
instead, or they will look correct in the repo and never be sent.

**Workspace packages need `transpilePackages`.**
`@repo/ui`, `@repo/db`, `@repo/auth` and `@repo/email` all export raw `.ts`/`.tsx` from
`src/` with no build step, so every Next app must list the ones it uses in
`transpilePackages`.

**Keep `open-next.config.ts` minimal.**
No `enableCacheInterception`, no `withRegionalCache`, no Durable Object sharded tag cache.
That combination caused intermittent production 500s on this stack in a sibling project. Add
the DO tag cache only for an app that genuinely uses tag-based revalidation.

**Node 20.9+ is required** (Next 16). The root `engines` field enforces it.

## Version alignment

| Package | Version |
|---|---|
| `next` | `^16.2.12` |
| `@opennextjs/cloudflare` | `^1.20.2` |
| `wrangler` | `^4.116.0` |
| `react` / `react-dom` | `^19.2.0` |

`@opennextjs/cloudflare@1.20.2` requires `next >=15.5.21 <16 || >=16.2.11`, so the Next and
adapter versions have to move together. If you bump one, check the other's peer range.

> **`apps/main` is still on Next 15.4.10 / OpenNext 1.19.8.** It was intentionally left
> behind while the other apps were upgraded, because it had active in-flight changes at the
> time. It needs the same treatment: bump `next`, `@opennextjs/cloudflare` and `wrangler`,
> add `transpilePackages`, and add the R2 cache binding to its `wrangler.jsonc` (the
> commented-out block is already there). Its `middleware.ts` keeps its name.
