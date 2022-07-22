import { createHmac } from 'crypto';

export default async function handleWebhook(req, res) {
  // verify the webhook signature request against the
  // unmodified, unparsed body
  const body = await getRawBody(req);
  if (!body) {
    res.status(400).send('Bad request (no body)');
    return;
  }

  const jsonBody = JSON.parse(body);

  const slug = jsonBody.fields.slug['en-US'];

  // secret
  const secret = process.env.NEXT_PUBLIC_REVALIDATION;

  if (req.query.secret === secret) {
    // issue opened or edited
    // comment created or edited
    console.log('[Next.js] Revalidating /');
    await res.revalidate('/');
    if (slug) {
      console.log(`[Next.js] Revalidating /${slug}`);
      await res.revalidate(`/${slug}`);
    }

    return res.status(200).send('Success!');
  } else {
    return res.status(403).send('Forbidden');
  }
}

function getRawBody(req) {
  return new Promise((resolve, reject) => {
    let bodyChunks = [];
    req.on('end', () => {
      const rawBody = Buffer.concat(bodyChunks).toString('utf8');
      resolve(rawBody);
    });
    req.on('data', (chunk) => bodyChunks.push(chunk));
  });
}

export const config = {
  api: {
    bodyParser: false,
  },
};
