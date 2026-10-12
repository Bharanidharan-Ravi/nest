import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react';
import path from 'path';
import packageJson from "./package.json";

// Every VITE_* variable is shipped to the browser in plain text, so a secret
// there is readable by any user. Fail the build instead of leaking it.
const SECRET_ENV_NAME = /(KEY|SECRET|PASSWORD|PASSWD|PRIVATE|CREDENTIAL)/i;

const assertNoSecretsInClientEnv = (env) => {
  const leaked = Object.keys(env).filter(
    (name) => name.startsWith("VITE_") && SECRET_ENV_NAME.test(name),
  );
  if (leaked.length) {
    throw new Error(
      `Secret-looking VITE_ variables would be exposed in the bundle: ${leaked.join(", ")}. ` +
        "Keep secrets on the server, or rename the variable if it is not secret.",
    );
  }
};

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, path.resolve());
  assertNoSecretsInClientEnv(env);

  return {
    plugins: [react()],
    // "/Test/" for `npm run build:test` (.env.testenv), so the test build loads its own assets
    base: env.VITE_BASE_PATH || "/",
    define: {
      __APP_VERSION__: JSON.stringify(packageJson.version),
    },
    resolve: {
      alias: {
        // Force the app to use its own copy of React for everything
        react: path.resolve('./node_modules/react'),
        'react-dom': path.resolve('./node_modules/react-dom'),
      },
    },
  };
})
