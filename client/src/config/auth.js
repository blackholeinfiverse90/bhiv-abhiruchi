const DEV_TEST_KEY = 'pk_test_cGxlYXNlZC16ZWJyYS01OC5jbGVyay5hY2NvdW50cy5kZXYk';
const envKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

const isLocalhost = typeof window !== 'undefined' && 
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

// On localhost, if envKey is a live production key (pk_live_), use dev test key so localhost won't crash on unconfigured CNAMEs
let selectedKey = envKey && envKey.startsWith('pk_') ? envKey : DEV_TEST_KEY;

if (isLocalhost && selectedKey.startsWith('pk_live_')) {
  console.warn('⚠️ Localhost environment detected with live key. Falling back to Clerk development key for local testing.');
  selectedKey = DEV_TEST_KEY;
}

export const CLERK_PUBLISHABLE_KEY = selectedKey;
export const CLERK_ENABLED = Boolean(CLERK_PUBLISHABLE_KEY);
