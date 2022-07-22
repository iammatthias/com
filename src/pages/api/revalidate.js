export default async function handleWebhook(req, res) {
  // verify the webhook signature request against the
  // unmodified, unparsed body
  const body = await getRawBody(req);
  // Check for secret to confirm this is a valid request
  if (req.query.secret !== process.env.NEXT_PUBLIC_REVALIDATION) {
    return res.status(401).json({ message: 'Invalid token' });
  }
  // Check if body is empty
  if (!body) {
    res.status(400).send('Bad request (no body)');
    return;
  }

  const jsonBody = JSON.parse(body);

  if (jsonBody.metadata?.fields.slug) {
    console.log(jsonBody.metadata?.fields.slug);

    const slug = jsonBody.metadata?.fields.slug;

    // revalidated page
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
