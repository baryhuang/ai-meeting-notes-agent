import { createClient } from 'npm:@insforge/sdk';

export default async function (request) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'POST required' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await request.json();
    const { embedding, status, priority, project, limit = 20 } = body;

    if (!embedding || !Array.isArray(embedding)) {
      return new Response(JSON.stringify({ error: 'embedding array required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const BASE_URL = Deno.env.get('INSFORGE_BASE_URL');
    const ANON_KEY = Deno.env.get('ANON_KEY');

    // Build WHERE clauses for optional filters
    const conditions = [];
    const params = [];
    let paramIdx = 1;

    if (status) {
      conditions.push(`"Status" = $${paramIdx++}`);
      params.push(status);
    }
    if (priority) {
      conditions.push(`"Priority" = $${paramIdx++}`);
      params.push(priority);
    }
    if (project) {
      conditions.push(`"Project" ILIKE $${paramIdx++}`);
      params.push(`%${project}%`);
    }

    const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

    const sql = `
      SELECT "ID", "Title", "Description", "Status", "Priority", "Project", "Assignee", "Labels",
             "Created", "Updated", "Due Date", "Parent issue", "Related to", "Blocked by", "Duplicate of",
             1 - (embedding <=> $${paramIdx}::vector) AS similarity
      FROM linear_tasks
      ${whereClause}
      ORDER BY embedding <=> $${paramIdx}::vector
      LIMIT $${paramIdx + 1}
    `;

    params.push(`[${embedding.join(',')}]`);
    params.push(limit);

    const dbResp = await fetch(`${BASE_URL}/api/database/sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ANON_KEY}`,
      },
      body: JSON.stringify({ query: sql, params }),
    });

    if (!dbResp.ok) {
      const errText = await dbResp.text();
      return new Response(JSON.stringify({ error: 'DB query failed', detail: errText }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const result = await dbResp.json();
    return new Response(JSON.stringify({ tasks: result.rows || [] }), {
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
