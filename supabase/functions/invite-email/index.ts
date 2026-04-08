import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const { email, teamName, inviterEmail } = await req.json()

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: 'ChainGuard AI <onboarding@resend.dev>',
      to: email,
      subject: `${inviterEmail} invited you to join ${teamName} on ChainGuard AI`,
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#09090b;color:#f4f4f5;border-radius:12px;">
          <div style="margin-bottom:24px;">
            <span style="font-weight:bold;font-size:16px;">⛓️ ChainGuard AI</span>
          </div>
          <h2 style="margin:0 0 8px;font-size:20px;">You've been invited</h2>
          <p style="color:#a1a1aa;margin:0 0 24px;">
            <strong style="color:#f4f4f5;">${inviterEmail}</strong> has invited you to join the team <strong style="color:#10b981;">${teamName}</strong> on ChainGuard AI.
          </p>
          <a href="${Deno.env.get('SITE_URL')}/auth?mode=login"
             style="display:inline-block;padding:12px 24px;background:linear-gradient(135deg,#10b981,#06b6d4);color:white;text-decoration:none;border-radius:8px;font-weight:600;">
            Accept Invitation
          </a>
          <p style="color:#52525b;font-size:12px;margin-top:24px;">
            If you don't have an account yet, sign up at ${Deno.env.get('SITE_URL')}/auth?mode=signup
          </p>
        </div>
      `,
    }),
  })

  const data = await res.json()
  return new Response(JSON.stringify(data), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
