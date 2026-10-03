import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react';
import path from 'path';
import packageJson from "./package.json";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, path.resolve());

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
