import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { buildMappedIcons } from './scripts/build_icons.js';

function iconWatcherPlugin() {
  return {
    name: 'vite-plugin-icon-watcher',
    buildStart() {
      buildMappedIcons();
    },
    handleHotUpdate({ file }) {
      if (file.includes('iconConfig.js') || file.endsWith('.svg')) {
        buildMappedIcons();
      }
    },
  };
}

export default defineConfig({
  plugins: [react(), iconWatcherPlugin()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    watch: {
      usePolling: true,
      interval: 100,
    },
  },
});

