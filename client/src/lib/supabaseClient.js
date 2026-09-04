// Safe mock proxy client when Supabase is disabled / not used (Pure MERN Stack)
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
      return () => createMockQueryBuilder();
    }
  });
};

const clientInstance = {
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

export const supabase = clientInstance;
export const SUPABASE_TABLE = "students";
export const FORM_CONFIG_TABLE = "form_configurations";
