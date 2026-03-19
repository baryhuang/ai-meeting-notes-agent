module.exports = async function(request) {
  const UPSTREAM = 'https://workspace-endpoint.openagents.org';

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
  };

  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  // All requests come as POST to the edge function.
  // The real method, path, headers, and body are passed in the JSON body.
  let payload;
  try {
    payload = await request.json();
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const { method, path, body, workspaceToken } = payload;

  if (!path) {
    return new Response(JSON.stringify({ error: 'Missing path' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const upstreamUrl = UPSTREAM + path;

  // Build upstream headers
  const headers = new Headers();
  headers.set('Content-Type', 'application/json');
  if (workspaceToken) {
    headers.set('X-Workspace-Token', workspaceToken);
  }

  const fetchOptions = {
    method: method || 'GET',
    headers,
  };

  // Forward body for non-GET requests
  if (fetchOptions.method !== 'GET' && fetchOptions.method !== 'HEAD' && body) {
    fetchOptions.body = typeof body === 'string' ? body : JSON.stringify(body);
  }

  const response = await fetch(upstreamUrl, fetchOptions);

  const responseText = await response.text();

  return new Response(responseText, {
    status: response.status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
};
