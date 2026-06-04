import { c as useNuxtApp, b as useRuntimeConfig } from './server.mjs';
import { toRef, isRef } from 'vue';

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
const useApi = () => {
  const { public: { apiBaseUrl } } = useRuntimeConfig();
  const token = useState("api-token", () => null);
  async function request(path, options = {}) {
    const headers = new Headers(options.headers);
    headers.set("Content-Type", "application/json");
    if (token.value) headers.set("Authorization", `Bearer ${token.value}`);
    const response = await fetch(`${apiBaseUrl}${path}`, { ...options, headers });
    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      const message = payload && typeof payload === "object" && "error" in payload ? payload.error?.message : null;
      throw new Error(message || `API request failed with status ${response.status}`);
    }
    if (payload && typeof payload === "object" && "data" in payload) {
      return payload.data;
    }
    return payload;
  }
  function setToken(value) {
    token.value = value;
    return;
  }
  return { request, token, setToken };
};

export { useState as a, useApi as u };
//# sourceMappingURL=useApi-wCkPPjv2.mjs.map
