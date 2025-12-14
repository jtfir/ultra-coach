import { createClient } from "@supabase/supabase-js";

/**
 * Supabase client for use in client components and API routes.  
 *
 * The anon key is safe to expose in the browser.  
 * See https://supabase.com/docs/reference/javascript/initializing for details.
 */
export const supabaseAnon = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
);

/**
 * Supabase client with elevated privileges for server-side use only.  
 *
 * The service role key should never be exposed to the client.
 */
export const supabaseService = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string,
  {
    auth: { persistSession: false },
  }
);
