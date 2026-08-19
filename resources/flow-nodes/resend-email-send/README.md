# @particle-academy/resend_email_send

Send an email through Resend.

```bash
npx fancy-cli@latest add node @particle-academy/resend_email_send
```

## There is NO sandbox, and the node says so

Resend has no test estate, so `mode` offers only `fake` and `live` — a choice the
provider cannot honour is an invitation to pick it and read an error.

Resend does publish simulator recipients (`delivered@resend.dev`,
`bounced@resend.dev`, …). **Those are not a sandbox**: the send is real, billed
and counted against your quota. Modelling them as one would put a live send
behind a control labelled "test".

On a local project with no connection configured, the node resolves to `fake` and
sends nothing. That is the whole reason a faker ships with every connector rather
than only with the providers that lack a sandbox.

## Host wiring

```ts
registerConnectionHost({
  environment: { production: process.env.NODE_ENV === "production" },
  connections: {
    resend: { service: "resend", live: { apiKey: process.env.RESEND_API_KEY } },
  },
});
```

## One provider quirk worth knowing

Resend answers **403 to any request without a `User-Agent`**, which reads exactly
like a bad key and sends people off to rotate a credential that was fine. The
service descriptor always sets one.

## Replay

`idempotent`. A retry would send a second email — annoying and recoverable, which
is what separates this from a payment.
