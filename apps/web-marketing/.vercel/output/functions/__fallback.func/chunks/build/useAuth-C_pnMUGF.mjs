import { u as useApi, a as useState } from './useApi-wCkPPjv2.mjs';

const useAuth = () => {
  const api = useApi();
  const user = useState("auth-user", () => null);
  const isInternal = useState("auth-is-internal", () => false);
  const authReady = useState("auth-ready", () => false);
  function canUseMarketing(profile) {
    const roles = Array.isArray(profile?.roles) ? profile.roles : [];
    const accesses = Array.isArray(profile?.accesses) ? profile.accesses : [];
    return roles.includes("admin") || accesses.includes("marketing.read");
  }
  async function init() {
    return;
  }
  async function signIn(email, password, turnstileToken) {
    const data = await api.request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password, turnstileToken, clientApp: "web-marketing" })
    });
    api.setToken(data.access_token);
    const profile = await api.request("/auth/me");
    user.value = profile;
    isInternal.value = canUseMarketing(profile);
    authReady.value = true;
  }
  async function signOut() {
    api.setToken(null);
    user.value = null;
    isInternal.value = false;
    authReady.value = false;
  }
  return { user, isInternal, authReady, init, signIn, signOut };
};

export { useAuth as u };
//# sourceMappingURL=useAuth-C_pnMUGF.mjs.map
