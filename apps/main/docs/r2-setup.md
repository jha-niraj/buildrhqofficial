# Cloudflare R2 - creating the bucket and getting the keys

The five variables `apps/main` reads, all of them from `.env` locally and
`.env.production` for a deploy:

| Variable | What it is | Required |
|---|---|---|
| `R2_ACCOUNT_ID` | Your Cloudflare account id. Becomes the S3 endpoint hostname. | yes |
| `R2_ACCESS_KEY_ID` | From an R2 API token. | yes |
| `R2_SECRET_ACCESS_KEY` | From the same token. Shown **once**. | yes |
| `R2_BUCKET_NAME` | The bucket you create in step 2. | yes |
| `R2_PUBLIC_BASE_URL` | A public domain for avatars. | no |

---

## 1. Enable R2 on the account

Cloudflare dashboard, left nav, **R2 object storage**.

R2 needs billing enabled on the account before the first bucket can be created,
even though the free tier covers what this app does many times over: 10 GB of
storage, 1 million Class A operations (writes, lists) and 10 million Class B
operations (reads) per month. R2 charges **nothing for egress**, which is the
reason it is used here rather than S3 - a resume or an avatar served a thousand
times costs the same as one served once.

## 2. Create the bucket

**R2 object storage** -> **Create bucket**.

- **Bucket name** - this becomes `R2_BUCKET_NAME`. Lowercase, hyphens, no
  underscores. `shipithq-media` is a reasonable choice.
- **Location** - leave it on Automatic unless there is a reason not to.
- **Default storage class** - Standard. Infrequent Access is cheaper to store
  and more expensive to read, which is the wrong trade for avatars.

Leave the bucket **private**. Step 5 is the only public part, and it is
optional.

> One bucket holds every user's resume as well as their avatar. That is why
> `lib/r2-client.ts` has `R2_PUBLIC_PREFIX = "avatars/"` and `/api/media` will
> serve nothing outside it - without that check, the route would be an "enter
> any key, read any document" endpoint.

## 3. Get `R2_ACCOUNT_ID`

**R2 object storage** -> **Overview**, and read **Account ID** from the
**Account Details** panel on the right. It is a 32-character hex string.

It is also the middle segment of the dashboard URL:
`dash.cloudflare.com/<ACCOUNT_ID>/r2/overview`.

**This is the Account ID, not a Zone ID.** A Zone ID belongs to a single domain
and is also 32 hex characters, so the two are easy to confuse and impossible to
tell apart by looking. If R2 fails after you set this, that swap is the first
thing to check.

## 4. Create the API token -> `R2_ACCESS_KEY_ID` and `R2_SECRET_ACCESS_KEY`

**R2 object storage** -> **Overview** -> **Account Details** panel -> **Manage**
next to **API Tokens** -> **Create API token**.

Then:

- **Token type** - **Account API Token**. It belongs to the account rather than
  to you, so it keeps working if your user is ever removed. Creating one needs
  the Super Administrator role. A **User API Token** inherits your personal
  permissions and dies with your account membership - fine for a local
  experiment, wrong for a deploy.
- **Permissions** - **Object Read & Write**. The four options are Admin Read &
  Write, Admin Read only, Object Read & Write, and Object Read only. Admin
  means *manage buckets*: create, delete, change settings. This app only puts
  and gets objects, so Admin is strictly more authority than it needs.
- **Specify bucket** - scope it to the bucket from step 2. Available on the
  Object-level permissions only, and worth doing: a leaked token then reaches
  one bucket instead of all of them.
- **TTL** - a token that expires will take uploads down with it at whatever hour
  it happens to expire. Either leave it non-expiring, or set a calendar reminder
  for the rotation.

Create it, and the dashboard shows:

- **Access Key ID** -> `R2_ACCESS_KEY_ID`
- **Secret Access Key** -> `R2_SECRET_ACCESS_KEY`
- The S3 endpoint, `https://<ACCOUNT_ID>.r2.cloudflarestorage.com`

> **Copy the secret now.** Cloudflare's own wording: "You will not be able to
> access your Secret Access Key again after this step." If you lose it, the only
> repair is to delete the token and create another.

You do not need to store the endpoint anywhere. `lib/r2-client.ts` builds it
from `R2_ACCOUNT_ID`.

## 5. Optional: a public URL for avatars

Skip this and avatars are served by this app at `/api/media/<key>`. That works.
It routes every avatar request through the Worker, which is slower and burns
Worker requests on something a CDN should be handling.

Bucket -> **Settings**, then one of:

**Custom domain** (the one to use). **Custom Domains** -> **Add**. The domain
has to already be a zone on the same Cloudflare account. Set
`R2_PUBLIC_BASE_URL` to `https://<that domain>`. Objects are then cached at the
edge and can sit behind WAF rules and Bot Management.

**Public Development URL** (`r2.dev`). **Public Development URL** -> **Enable**,
and type `allow` to confirm. Gives `https://<bucket>.r2.dev`. Cloudflare's
documentation is explicit that this "is rate-limited and should only be used for
development purposes", so do not ship it. Do not put a CNAME in front of it
either - that is called out as an unsupported access path.

If you enable a custom domain **and** you previously enabled `r2.dev`, turn
`r2.dev` back off. Otherwise the bucket stays reachable through it, bypassing
whatever access controls you attached to the custom domain.

## What you do NOT need to turn on

**CORS.** The bucket settings page offers a CORS policy and it is tempting to add
one. This app does not need it, and that is a property of how it uploads rather
than a guess:

- Writes go through `uploadToR2()` in `lib/r2-client.ts`, which issues a
  `PutObjectCommand` from a **server action** or a route handler. The browser
  posts the file to this app; this app puts it in R2. No cross-origin request is
  ever made by the browser.
- Reads use `getR2SignedUrl()` and reach the user via `window.open(url)` - a
  top-level navigation. The same-origin policy does not apply to navigations, so
  no preflight happens and no CORS headers are consulted.

A CORS policy becomes necessary the day the browser talks to R2 directly, which
means either a presigned PUT uploaded with `fetch`, or a signed GET read with
`fetch`/XHR instead of opened. If either of those is ever added, come back here.

**Public Development URL.** Leave it disabled - see step 5.

**R2 Data Catalog, Object Lifecycle Rules, Bucket Lock, Event Notifications.**
None are used by this app.

## 6. Put the values in

Locally, `apps/main/.env`. For a deploy, `apps/main/.env.production`, then
`pnpm release` from `apps/main`.

```
R2_ACCOUNT_ID="0123456789abcdef0123456789abcdef"
R2_ACCESS_KEY_ID="..."
R2_SECRET_ACCESS_KEY="..."
R2_BUCKET_NAME="shipithq-media"
R2_PUBLIC_BASE_URL="https://media.shipithq.com"
```

Two traps, both from the repo's own working agreement:

- `wrangler deploy --secrets-file` is **additive**. A key you leave out keeps
  its current production value. A key present with an **empty** value overwrites
  the live secret with an empty string. Delete the line rather than blanking it.
- Use `pnpm release`, not `pnpm deploy`. `deploy` is a built-in pnpm command
  that shadows the script and fails with `ERR_PNPM_NOTHING_TO_DEPLOY` without
  deploying anything.

## Checking it worked

`isR2Configured()` in `lib/r2-client.ts` rejects placeholder values as well as
empty ones - it matches `your`, `here`, `xxx`, `placeholder`, `change_me`,
`todo`, `example`, `<` and `>`, and it validates that `R2_ACCOUNT_ID` is a legal
DNS label. On a misconfiguration `warnIfR2Misconfigured()` logs the specific
reason once at startup.

Reading a failure:

| What you see | What it means |
|---|---|
| `EPROTO ... SSL alert number 40` | A TLS handshake failure, so the request never got as far as being authenticated. The endpoint host is wrong, which means `R2_ACCOUNT_ID` is wrong - most often still a placeholder, giving `https://your_r2_account_id.r2.cloudflarestorage.com` |
| HTTP 403 `InvalidAccessKeyId` | The endpoint resolved and the credentials were rejected. Key id is wrong, or the token was deleted or expired |
| HTTP 403 `SignatureDoesNotMatch` | Access key id is right, secret is wrong |
| HTTP 404 `NoSuchBucket` | `R2_BUCKET_NAME` does not match the bucket, or the token is scoped to a different one |

The distinction in the first two rows is worth internalising: a TLS-level
failure can only be the endpoint, because nothing has been authenticated yet.
An HTTP 403 means the endpoint was fine. That one bit tells you whether to look
at the account id or at the token.
