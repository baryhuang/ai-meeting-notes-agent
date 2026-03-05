import { createClient } from 'npm:@insforge/sdk';

export default async function(req) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  const client = createClient({
    baseUrl: Deno.env.get('INSFORGE_BASE_URL'),
    anonKey: Deno.env.get('ANON_KEY'),
  });

  const url = new URL(req.url);
  const path = url.pathname;

  // Parse action from query param: ?action=dimensions or ?action=data&name=market
  const action = url.searchParams.get('action');
  const name = url.searchParams.get('name');

  try {
    // GET dimensions
    if (req.method === 'GET' && action === 'dimensions') {
      const { data: blob, error } = await client.storage
        .from('atlas-data')
        .download('dimensions.json');

      if (error) {
        return new Response(JSON.stringify({ error: 'dimensions.json not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const text = await blob.text();
      return new Response(text, {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // GET data/{name}
    if (req.method === 'GET' && action === 'data' && name) {
      if (!/^[a-zA-Z0-9_-]+$/.test(name)) {
        return new Response(JSON.stringify({ error: 'Invalid resource name' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { data: blob, error } = await client.storage
        .from('atlas-data')
        .download(`${name}.json`);

      if (error) {
        return new Response(JSON.stringify({ error: `${name}.json not found` }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const text = await blob.text();
      return new Response(text, {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // PUT data/{name}
    if (req.method === 'PUT' && action === 'data' && name) {
      if (!/^[a-zA-Z0-9_-]+$/.test(name)) {
        return new Response(JSON.stringify({ error: 'Invalid resource name' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const body = await req.json();
      const jsonStr = JSON.stringify(body, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });

      const { data, error } = await client.storage
        .from('atlas-data')
        .upload(`${name}.json`, blob);

      if (error) {
        return new Response(JSON.stringify({ error: `Failed to save ${name}.json` }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ status: 'saved', file: `${name}.json` }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Not found. Use ?action=dimensions or ?action=data&name=<name>' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}
