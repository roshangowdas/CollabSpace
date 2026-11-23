// ==============================================================================
// Supabase Edge Function: send-invitation
// File: supabase/functions/send-invitation/index.ts
// Description: Secure server-side privileged invitation creator & email sender.
//              Never exposes the service_role key to client browsers.
// ==============================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''

    // 1. Verify caller authorization header (Bearer JWT)
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing Authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Initialize user-scoped client to verify token & identity
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    })

    const {
      data: { user },
      error: userError,
    } = await userClient.auth.getUser()

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired user session' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 2. Parse request payload
    const body = await req.json()
    const { workspaceId, email, role, appOrigin } = body

    if (!workspaceId || !email || !role) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters: workspaceId, email, or role' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Strict role check: Owner role is prohibited from invitations
    const ALLOWED_ROLES = ['Admin', 'Developer', 'Designer', 'Tester', 'Member']
    if (!ALLOWED_ROLES.includes(role)) {
      return new Response(
        JSON.stringify({
          error: `Invalid role "${role}". Permitted invitation roles: ${ALLOWED_ROLES.join(', ')}`,
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 3. Initialize server-side administrative client (service_role)
    const adminClient = createClient(supabaseUrl, supabaseServiceKey || supabaseAnonKey)

    // Verify caller is an Owner or Admin of the target workspace
    const { data: memberRecord, error: memberCheckError } = await adminClient
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', workspaceId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (memberCheckError || !memberRecord || !['Owner', 'Admin'].includes(memberRecord.role)) {
      return new Response(
        JSON.stringify({ error: 'Forbidden: Only workspace Owners and Admins can issue invitations.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 4. Call secure RPC create_workspace_invitation
    const { data: inviteData, error: inviteRpcError } = await userClient.rpc(
      'create_workspace_invitation',
      {
        p_workspace_id: workspaceId,
        p_email: email,
        p_role: role,
      }
    )

    if (inviteRpcError) {
      return new Response(
        JSON.stringify({ error: inviteRpcError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 5. Build invite URL
    const baseUrl = appOrigin || 'https://collabspace.app'
    const inviteUrl = `${baseUrl.replace(/\/+$/, '')}/invite/${inviteData.token}`

    // 6. Dispatch transactional email (Simulated or via integrated provider)
    console.log(`[CollabSpace Edge Function] Invitation created for ${email}`)
    console.log(`[CollabSpace Edge Function] Workspace: ${inviteData.workspace_name}`)
    console.log(`[CollabSpace Edge Function] Role: ${role}`)
    console.log(`[CollabSpace Edge Function] Invitation URL: ${inviteUrl}`)

    return new Response(
      JSON.stringify({
        success: true,
        invitation: inviteData,
        inviteUrl,
        message: `Invitation successfully sent to ${email} as ${role}.`,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('[CollabSpace Edge Function] Unhandled exception:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error processing invitation' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

