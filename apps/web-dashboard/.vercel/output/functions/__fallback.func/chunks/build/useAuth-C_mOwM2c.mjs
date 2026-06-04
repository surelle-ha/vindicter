import { toRef, isRef } from 'vue';
import { b as useNuxtApp } from './server.mjs';

function useSupabase() {
  {
    return null;
  }
}
const useStateKeyPrefix = "$s";
function useState(...args) {
  const autoKey = typeof args[args.length - 1] === "string" ? args.pop() : void 0;
  if (typeof args[0] !== "string") {
    args.unshift(autoKey);
  }
  const [_key, init] = args;
  if (!_key || typeof _key !== "string") {
    throw new TypeError("[nuxt] [useState] key must be a string: " + _key);
  }
  if (init !== void 0 && typeof init !== "function") {
    throw new Error("[nuxt] [useState] init must be a function: " + init);
  }
  const key = useStateKeyPrefix + _key;
  const nuxtApp = useNuxtApp();
  const state = toRef(nuxtApp.payload.state, key);
  if (init) {
    nuxtApp._state[key] ??= { _default: init };
  }
  if (state.value === void 0 && init) {
    const initialValue = init();
    if (isRef(initialValue)) {
      nuxtApp.payload.state[key] = initialValue;
      return initialValue;
    }
    state.value = initialValue;
  }
  return state;
}
const useAuth = () => {
  const supabase = useSupabase();
  const user = useState("auth-user", () => null);
  const isAdmin = useState("auth-is-admin", () => false);
  const authReady = useState("auth-ready", () => false);
  async function init() {
    return;
  }
  async function signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    let needsOnboarding = false;
    if (data.user) {
      user.value = data.user;
      const { data: profile } = await supabase.from("user_profiles").select("role, onboarding_complete").eq("id", data.user.id).single();
      isAdmin.value = profile?.role === "admin";
      needsOnboarding = !profile?.onboarding_complete;
    }
    authReady.value = true;
    return { needsOnboarding };
  }
  async function signOut() {
    await supabase.auth.signOut();
    user.value = null;
    isAdmin.value = false;
    authReady.value = false;
  }
  return { user, isAdmin, authReady, init, signIn, signOut };
};

export { useSupabase as a, useState as b, useAuth as u };
//# sourceMappingURL=useAuth-C_mOwM2c.mjs.map
