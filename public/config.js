// Runtime-injected configuration.
// Railway (or any static host) can override API_BASE_URL via a bind mount
// or by replacing this file during deploy. Defaults to same-origin /api.
window.__APP_CONFIG__ = {
  API_BASE_URL: "",
};
