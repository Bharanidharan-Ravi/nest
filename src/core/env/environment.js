// The test environment is the same app under /Test (any case, e.g. https://nest.workglow.in/Test).
// Every API/SignalR call from it carries X-Environment: Test, which the API routes to the test DB.
const TEST_SEGMENT = /^\/test(?=\/|$)/i;

/** "/Test" exactly as typed in the URL, or "" in the live app. */
export const getBasePath = () =>
  (typeof window === "undefined" ? "" : window.location.pathname).match(TEST_SEGMENT)?.[0] ?? "";

export const isTestEnv = () => getBasePath() !== "";

/** Value of the X-Environment header / ?env= query the API routes on. */
export const getEnvironmentName = () => (isTestEnv() ? "Test" : "Live");

/** An app path ("/login", "/tickets/5") with the /Test prefix kept, for window.open / location.href. */
export const withBasePath = (path) => `${getBasePath()}${path}`;
