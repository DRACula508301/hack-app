// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { GoogleAuth, Sheets } from "https://googleapis.deno.dev/v1/sheets:v4.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'

console.log(Deno.env.get('SUPABASE_URL'))
console.log(Deno.env.get('SUPABASE_KEY'))

serve(async (req: Request) => {
  console.log(process.env.SUPABASE_KEY);
  console.log(process.env.SUPABASE_URL);
  try {
    
    const supabaseClient = createClient(
      // Supabase API URL - env var exported by default.
      Deno.env.get('SUPABASE_URL') ?? '',
      // process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
      // Supabase API ANON KEY - env var exported by default.
      Deno.env.get('NEXT_PUBLIC_SUPABASE_ANON_KEY') ?? '',
      //process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
      // Create client with Auth context of the user that called the function.
      // This way your row-level-security (RLS) policies are applied.
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )
    // Now we can get the session or user object
    const {
      data: { user },
    } = await supabaseClient.auth.getUser()
    console.log(user)


    const raw_auth = Deno.env.get("GOOGLE_OAUTH");
    const authProvider = new GoogleAuth()

    const sheets = new Sheets(authProvider.fromJSON(JSON.parse(raw_auth!)));

    await sheets.spreadsheetsValuesAppend(
      "Checkin",
      Deno.env.get("SPREADSHEET"),
      { majorDimension: "ROWS", values: [[user.email]] },
      { includeValuesInResponse: true, valueInputOption: "USER_ENTERED" }
    )
  } catch (error) {
    return new Response(
      JSON.stringify(error),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    )
  }

  return new Response(
    JSON.stringify("Success!"),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } },
  )
})