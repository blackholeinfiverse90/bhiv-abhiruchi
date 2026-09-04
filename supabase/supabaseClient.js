import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

let clientInstance;

if (SUPABASE_URL && SUPABASE_ANON_KEY && SUPABASE_URL.startsWith("http")) {
  clientInstance = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
} else {
  // Safe mock proxy client when Supabase is disabled / not used
  const createMockQueryBuilder = () => {
    const target = {
      single: async () => ({ data: null, error: null }),
      maybeSingle: async () => ({ data: null, error: null }),
      then: (resolve) => resolve({ data: [], error: null })
    };

    return new Proxy(target, {
      get(obj, prop) {
        if (prop in obj) {
          return obj[prop];
        }
        // Any method call (ilike, like, or, eq, neq, etc.) returns the proxy for chaining!
        return () => createMockQueryBuilder();
      }
    });
  };

  clientInstance = {
    from: () => createMockQueryBuilder(),
    rpc: async () => ({ data: null, error: null }),
    channel: () => ({
      on: () => ({
        subscribe: () => ({})
      })
    }),
    removeChannel: () => {},
    auth: {
      getUser: async () => ({ data: { user: null }, error: null }),
      getSession: async () => ({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } })
    }
  };
}

export const supabase = clientInstance;
export const SUPABASE_TABLE = import.meta.env.VITE_SUPABASE_TABLE || "students";
export const FORM_CONFIG_TABLE = "form_configurations";
