import { NextApiRequest, NextApiResponse } from 'next';
import requestIp from 'request-ip';

export default async function myRoute(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const detectedIp = requestIp.getClientIp(req);
  if (detectedIp !== `::1`) {
    res.status(200).json({ ip: detectedIp });
  } else {
    res.status(200).json({ ip: `23.241.18.164` });
  }
}
