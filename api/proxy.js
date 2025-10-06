export default async function handler(req, res) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Get the URL from the query parameter
  const { url } = req.query;

  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid URL parameter' });
  }

  try {
    // Decode the URL
    const decodedUrl = decodeURIComponent(url);

    // Validate URL to prevent SSRF attacks
    const urlObj = new URL(decodedUrl);
    const allowedDomains = [
      'ipfs.io',
      'gateway.pinata.cloud',
      'cloudflare-ipfs.com',
      'nftstorage.link',
      'dweb.link',
      'ipfs.infura.io'
    ];

    const isAllowedDomain = allowedDomains.some(domain =>
      urlObj.hostname.endsWith(domain) || urlObj.hostname === domain
    );

    if (!isAllowedDomain) {
      return res.status(403).json({ error: 'Domain not allowed' });
    }

    // Fetch the image with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(decodedUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; NODES-NFT-Collage-Maker/1.0)',
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return res.status(response.status).json({ error: 'Failed to fetch image' });
    }

    // Get content type
    const contentType = response.headers.get('content-type') || 'image/jpeg';

    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Cache-Control', 'public, max-age=3600');

    // Set content type
    res.setHeader('Content-Type', contentType);

    // Stream the response
    const buffer = Buffer.from(await response.arrayBuffer());
    res.send(buffer);

  } catch (error) {
    console.error('Proxy error:', error);

    if (error instanceof Error && error.name === 'AbortError') {
      return res.status(408).json({ error: 'Request timeout' });
    }

    return res.status(500).json({ error: 'Internal server error' });
  }
}
