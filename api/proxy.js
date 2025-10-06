export default async function handler(req, res) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Get the URL from the path parameter (not query parameter)
  const pathUrl = req.url.replace('/proxy/', '');
  const url = decodeURIComponent(pathUrl);

  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid URL parameter' });
  }

  console.log(`Proxy request for: ${url}`);

  try {
    // Basic URL validation (less restrictive)
    const urlObj = new URL(url);

    // Only allow HTTP/HTTPS protocols
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return res.status(403).json({ error: 'Invalid protocol' });
    }

    // Block private/localhost IPs for security
    const hostname = urlObj.hostname.toLowerCase();
    if (hostname.includes('localhost') ||
        hostname.includes('127.0.0.1') ||
        hostname.includes('10.') ||
        hostname.includes('192.168.') ||
        hostname.includes('172.')) {
      return res.status(403).json({ error: 'Local/private IPs not allowed' });
    }

    console.log(`Fetching from: ${url}`);

    // Fetch the image with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; NODES-NFT-Collage-Maker/1.0)',
        'Accept': 'image/*,*/*',
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.error(`Fetch failed: ${response.status} ${response.statusText}`);
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
