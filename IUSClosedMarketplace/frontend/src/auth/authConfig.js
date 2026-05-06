import { PublicClientApplication, LogLevel } from '@azure/msal-browser';

// ─── Azure AD App Registration values (from your colleague) ────────────────
const TENANT_ID = '2f2dcb5d-f3e1-4f33-8584-dcacd25d604d';
const CLIENT_ID = '562c6df4-0ce8-4165-8969-f300f4c1842a';

// ─── MSAL configuration ────────────────────────────────────────────────────
export const msalConfig = {
  auth: {
    clientId: CLIENT_ID,
    authority: `https://login.microsoftonline.com/${TENANT_ID}`,
    // The redirect URI must be registered in Azure AD. We use the root so the
    // SPA loads normally after the redirect — App.jsx handles routing.
    redirectUri: 'http://localhost:5173/',
    postLogoutRedirectUri: 'http://localhost:5173/',
    navigateToLoginRequestUrl: false
  },
  cache: {
    // sessionStorage clears on tab close (safer); use 'localStorage' if you
    // want the session to persist across tabs/browser restarts.
    cacheLocation: 'sessionStorage',
    storeAuthStateInCookie: false
  },
  system: {
    loggerOptions: {
      logLevel: LogLevel.Warning,
      loggerCallback: (level, message, containsPii) => {
        if (containsPii) return;
        if (level === LogLevel.Error) console.error(message);
      }
    }
  }
};

// ─── Scope used when requesting an access token for OUR API ────────────────
// This must match the scope exposed in the Azure AD app registration.
export const apiRequest = {
  scopes: [`api://${CLIENT_ID}/api_access`]
};

// ─── Scope used at sign-in time (OpenID basics + the API scope) ────────────
export const loginRequest = {
  scopes: ['openid', 'profile', 'email', `api://${CLIENT_ID}/api_access`]
};

// ─── Singleton MSAL instance ───────────────────────────────────────────────
// Exporting the instance (not just the config) lets non-React code (axios
// interceptor, SignalR hook) acquire tokens without going through hooks.
export const msalInstance = new PublicClientApplication(msalConfig);

// Initialize once at app start. MSAL v3 requires explicit initialization
// before any other API call.
export const initializeMsal = async () => {
  await msalInstance.initialize();

  // Handle the redirect response if we're returning from a login redirect.
  // This must run before React renders so the account is set in MSAL state.
  const response = await msalInstance.handleRedirectPromise();
  if (response?.account) {
    msalInstance.setActiveAccount(response.account);
  } else {
    // If we already have a cached account, mark it as active.
    const accounts = msalInstance.getAllAccounts();
    if (accounts.length > 0) {
      msalInstance.setActiveAccount(accounts[0]);
    }
  }
};

// ─── Helper: silently get an access token for our API ─────────────────────
// Returns null if no user is signed in, throws on unexpected errors.
// On `InteractionRequiredAuthError` it falls back to a redirect login.
export const getApiAccessToken = async () => {
  const account = msalInstance.getActiveAccount();
  if (!account) return null;

  try {
    const result = await msalInstance.acquireTokenSilent({
      ...apiRequest,
      account
    });
    return result.accessToken;
  } catch (err) {
    // If silent acquisition fails (e.g., consent revoked, token expired and
    // refresh token gone), fall back to interactive login.
    if (err.name === 'InteractionRequiredAuthError') {
      await msalInstance.acquireTokenRedirect(apiRequest);
      return null; // redirect in progress
    }
    throw err;
  }
};
