import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // 127.0.0.1, not localhost: the API only listens on IPv4 loopback, and "localhost" may resolve to ::1.
    proxy: { '/api': 'http://127.0.0.1:5000' },
  },
});
