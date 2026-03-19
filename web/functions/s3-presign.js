import { S3Client, GetObjectCommand } from 'npm:@aws-sdk/client-s3';
import { getSignedUrl } from 'npm:@aws-sdk/s3-request-presigner';

const BUCKET = Deno.env.get('S3_BUCKET') || 'notesly-transcripts';
const REGION = Deno.env.get('S3_REGION') || 'us-east-1';
const ACCESS_KEY = Deno.env.get('S3_ACCESS_KEY_ID') || '';
const SECRET_KEY = Deno.env.get('S3_SECRET_ACCESS_KEY') || '';

export default async function(req) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  const url = new URL(req.url);
  const key = url.searchParams.get('key');
  const mode = url.searchParams.get('mode') || 'download';

  if (!key) {
    return new Response(JSON.stringify({ error: 'Missing ?key= parameter' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  if (key.includes('..') || !key.startsWith('by-dates/')) {
    return new Response(JSON.stringify({ error: 'Invalid key' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const s3 = new S3Client({
      region: REGION,
      credentials: { accessKeyId: ACCESS_KEY, secretAccessKey: SECRET_KEY },
    });

    const filename = key.split('/').pop();

    const command = new GetObjectCommand({
      Bucket: BUCKET,
      Key: key,
      ...(mode === 'download'
        ? { ResponseContentDisposition: `attachment; filename="${filename}"` }
        : { ResponseContentType: filename.endsWith('.txt') ? 'text/plain; charset=utf-8' : undefined }),
    });

    const presignedUrl = await getSignedUrl(s3, command, { expiresIn: 3600 });

    return new Response(JSON.stringify({ url: presignedUrl }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}
