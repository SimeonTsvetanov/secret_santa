// Cloudflare Worker for Secret Santa email sending via Resend

export default {
  async fetch(request, env) {
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405, headers: corsHeaders });
    }

    try {
      const { to, toName, assignedName } = await request.json();

      if (!to || !toName || !assignedName) {
        return new Response(JSON.stringify({ error: 'Missing required fields' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Clean, minimal email HTML template
      const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
      background: #f5f5f5; 
      color: #1a1a1a; 
      padding: 40px 20px; 
      margin: 0; 
      line-height: 1.6;
    }
    .container { 
      max-width: 480px; 
      margin: 0 auto; 
      background: #ffffff;
      border-radius: 16px;
      padding: 40px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.08);
    }
    .header { 
      text-align: center; 
      margin-bottom: 32px; 
    }
    .gift { 
      font-size: 56px; 
      margin-bottom: 16px; 
    }
    h1 { 
      font-size: 22px; 
      margin: 0; 
      font-weight: 600;
      color: #1a1a1a;
    }
    .greeting {
      color: #666;
      margin-bottom: 24px;
    }
    .card { 
      background: #f8f8f8; 
      border-radius: 12px; 
      padding: 24px; 
      margin: 24px 0;
      text-align: center;
      border: 1px solid #eee;
    }
    .label { 
      font-size: 11px; 
      color: #888; 
      text-transform: uppercase; 
      letter-spacing: 1px; 
      margin-bottom: 12px; 
    }
    .name { 
      font-size: 28px; 
      font-weight: 700; 
      color: #1a1a1a;
    }
    .divider { 
      height: 1px; 
      background: #eee; 
      margin: 24px 0; 
    }
    .secret {
      background: #fff3cd;
      border: 1px solid #ffc107;
      border-radius: 8px;
      padding: 12px 16px;
      font-size: 14px;
      color: #856404;
      margin-bottom: 16px;
    }
    .tips { 
      color: #666; 
      font-size: 14px; 
    }
    .tips strong {
      color: #1a1a1a;
    }
    .footer { 
      text-align: center; 
      color: #999; 
      font-size: 12px; 
      margin-top: 32px; 
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="gift">🎁</div>
      <h1>Secret Santa</h1>
    </div>
    
    <p class="greeting">Hello ${toName}!</p>
    <p>The draw is complete. Here's your assignment:</p>
    
    <div class="card">
      <div class="label">You will be gifting</div>
      <div class="name">${assignedName}</div>
    </div>
    
    <div class="secret">
      🤫 <strong>Remember:</strong> Keep it a secret!
    </div>
    
    <div class="divider"></div>
    
    <div class="tips">
      <strong>Tips for a great gift:</strong><br>
      • Think about what they might enjoy<br>
      • Stick to the agreed budget<br>
      • Add a personal touch!
    </div>
    
    <div class="footer">
      Sent via Secret Santa App
    </div>
  </div>
</body>
</html>`;

      // Send via Resend
      const resendResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Secret Santa <onboarding@resend.dev>',
          to: [to],
          subject: '🎁 Your Secret Santa Assignment',
          html: htmlContent,
        }),
      });

      const result = await resendResponse.json();

      if (!resendResponse.ok) {
        return new Response(JSON.stringify({ error: result }), {
          status: resendResponse.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ success: true, id: result.id }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  },
};
