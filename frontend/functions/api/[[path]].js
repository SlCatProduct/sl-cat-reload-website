/**
 * Cloudflare Pages Function - API Reverse Proxy
 * Intercepts /api/* requests on your custom domain and transparently forwards
 * them to your Node.js + Baileys WhatsApp backend.
 */
export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  // Backend Origin URL (Set in Cloudflare Pages Environment Variables or use default)
  const backendBaseUrl = env.BACKEND_URL || 'http://localhost:5000';
  
  // Construct the target URL
  const targetUrl = new URL(url.pathname + url.search, backendBaseUrl);

  // Clone headers and set proxy forwards
  const newHeaders = new Headers(request.headers);
  newHeaders.set('X-Forwarded-Host', url.host);
  newHeaders.set('X-Forwarded-Proto', url.protocol.replace(':', ''));
  newHeaders.set('X-Real-IP', request.headers.get('CF-Connecting-IP') || '');

  // Prepare request options
  const requestInit = {
    method: request.method,
    headers: newHeaders,
    redirect: 'follow'
  };

  // Attach body if method is not GET or HEAD
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    requestInit.body = request.body;
  }

  try {
    const backendResponse = await fetch(targetUrl.toString(), requestInit);

    // Clone response headers and add CORS if needed
    const responseHeaders = new Headers(backendResponse.headers);
    responseHeaders.set('Access-Control-Allow-Origin', '*');
    responseHeaders.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    responseHeaders.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    return new Response(backendResponse.body, {
      status: backendResponse.status,
      statusText: backendResponse.statusText,
      headers: responseHeaders
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        message: 'Backend server is currently offline or unreachable.',
        error: error.message
      }),
      {
        status: 502,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    );
  }
}
