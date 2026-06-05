import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react';
import path from 'path';
import packageJson from "./package.json";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
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
})
