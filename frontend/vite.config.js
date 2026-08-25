import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { buildMappedIcons } from './scripts/build_icons.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

function iconDevApiPlugin() {
  return {
    name: 'vite-plugin-icon-dev-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url || !req.url.startsWith('/__icon_api')) {
          return next();
        }

        const publicDir = path.resolve(__dirname, 'public');
        const configPath = path.resolve(__dirname, 'src/iconConfig.js');

        const sendJson = (data, status = 200) => {
          res.writeHead(status, { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
          });
          res.end(JSON.stringify(data));
        };

        if (req.method === 'OPTIONS') {
          return sendJson({});
        }

        const parseBody = () => new Promise((resolve) => {
          let body = '';
          req.on('data', chunk => { body += chunk; });
          req.on('end', () => {
            try {
              resolve(JSON.parse(body || '{}'));
            } catch (e) {
              resolve({});
            }
          });
        });

        if (req.method === 'GET' && req.url === '/__icon_api/list') {
          try {
            const configText = fs.readFileSync(configPath, 'utf8');
            const svgs = fs.readdirSync(publicDir).filter(f => f.endsWith('.svg'));
            
            const lines = configText.split('\n');
            const items = [];
            let currentSection = '🧭 Navigation & Header';

            lines.forEach(line => {
              if (line.includes('// ═') || line.includes('// ──')) return;
              if (line.trim().startsWith('// 🧭') || line.trim().startsWith('// 🔍') || line.trim().startsWith('// 🎬') || 
                  line.trim().startsWith('// 🎟️') || line.trim().startsWith('// 📊') || line.trim().startsWith('// 🏟️') || 
                  line.trim().startsWith('// 🏆') || line.trim().startsWith('// 🔐') || line.trim().startsWith('// 👤') || 
                  line.trim().startsWith('// 🔔') || line.trim().startsWith('// 🧩')) {
                currentSection = line.replace(/^\/\/\s*/, '').trim();
                return;
              }

              const itemMatch = line.match(/^\s*([A-Za-z0-9_]+)\s*:\s*([^,\n]+),?(?:\s*\/\/\s*(.*))?$/);
              if (itemMatch) {
                const iconName = itemMatch[1].trim();
                let rawVal = itemMatch[2].trim();
                let filename = null;
                if (rawVal !== 'null' && rawVal !== "''" && rawVal !== '""') {
                  filename = rawVal.replace(/^['"]|['"]$/g, '').trim();
                }
                const description = itemMatch[3] ? itemMatch[3].trim() : '';
                items.push({
                  iconName,
                  filename,
                  description,
                  section: currentSection,
                });
              }
            });

            return sendJson({ success: true, items, svgs });
          } catch (err) {
            return sendJson({ success: false, error: err.message }, 500);
          }
        }

        if (req.method === 'POST' && req.url === '/__icon_api/update') {
          try {
            const { iconName, filename } = await parseBody();
            if (!iconName) return sendJson({ success: false, error: 'iconName is required' }, 400);

            let configText = fs.readFileSync(configPath, 'utf8');
            const newMappedVal = filename ? `'${filename}'` : 'null';

            const regex = new RegExp(`^(\\s*${iconName}\\s*:\s*)([^,\\n]+)(,?(?:\\s*\\/\\/.*)?)$`, 'm');
            if (regex.test(configText)) {
              configText = configText.replace(regex, (m, p1, p2, p3) => `${p1}${newMappedVal}${p3}`);
            } else {
              configText = configText.replace(/(\n\s*\}\s*;?\s*)$/, `\n  ${iconName}: ${newMappedVal},\n$1`);
            }

            fs.writeFileSync(configPath, configText, 'utf8');
            buildMappedIcons();

            return sendJson({ success: true, iconName, filename });
          } catch (err) {
            return sendJson({ success: false, error: err.message }, 500);
          }
        }

        if (req.method === 'POST' && req.url === '/__icon_api/upload') {
          try {
            const { filename, svgContent, iconName } = await parseBody();
            if (!filename || !svgContent) {
              return sendJson({ success: false, error: 'filename and svgContent are required' }, 400);
            }

            let cleanFilename = filename.toLowerCase().replace(/[^a-z0-9._-]/g, '-');
            if (!cleanFilename.endsWith('.svg')) cleanFilename += '.svg';

            const targetFilePath = path.join(publicDir, cleanFilename);
            fs.writeFileSync(targetFilePath, svgContent, 'utf8');

            if (iconName) {
              let configText = fs.readFileSync(configPath, 'utf8');
              const regex = new RegExp(`^(\\s*${iconName}\\s*:\s*)([^,\\n]+)(,?(?:\\s*\\/\\/.*)?)$`, 'm');
              if (regex.test(configText)) {
                configText = configText.replace(regex, (m, p1, p2, p3) => `${p1}'${cleanFilename}'${p3}`);
              }
              fs.writeFileSync(configPath, configText, 'utf8');
            }

            buildMappedIcons();

            return sendJson({ success: true, filename: cleanFilename, iconName });
          } catch (err) {
            return sendJson({ success: false, error: err.message }, 500);
          }
        }

        next();
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), iconWatcherPlugin(), iconDevApiPlugin()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    watch: {
      usePolling: true,
      interval: 100,
    },
  },
});
