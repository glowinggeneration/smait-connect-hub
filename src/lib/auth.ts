import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

/**
 * Shared current-user accessor.
 *
 * Reads the locally cached session instead of hitting the auth server on
 * every call (as `supabase.auth.getUser()` does). Use the `useAuth()` hook
 * inside components when you need reactive user/session state.
 */
export const getCurrentUser = async (): Promise<User | null> => {
  const { data } = await supabase.auth.getSession();
  return data.session?.user ?? null;
};
