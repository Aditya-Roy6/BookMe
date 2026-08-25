import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const publicDir = path.resolve(__dirname, '../public');
const outPath = path.resolve(__dirname, '../src/components/MappedIcons.jsx');
const configModulePath = path.resolve(__dirname, '../src/iconConfig.js');

export function buildMappedIcons() {
  const publicDir = path.resolve(__dirname, '../public');
  const outPath = path.resolve(__dirname, '../src/components/MappedIcons.jsx');
  const configModulePath = path.resolve(__dirname, '../src/iconConfig.js');

  if (!fs.existsSync(configModulePath)) return;

  const configText = fs.readFileSync(configModulePath, 'utf8');
  const mapMatch = configText.match(/export const ICON_MAP = ({[\s\S]*});/);
  if (!mapMatch) {
    console.error('Could not find ICON_MAP in iconConfig.js');
    return;
  }

  // Strip comments before eval — new Function can't handle emoji/unicode in comments
  const cleanedObj = mapMatch[1]
    .replace(/\/\*[\s\S]*?\*\//g, '')   // remove block comments
    .replace(/\/\/[^\n]*/g, '');        // remove line comments

  let ICON_MAP;
  try {
    ICON_MAP = new Function('return (' + cleanedObj + ')')();
  } catch (err) {
    console.error('⚠️ [Icon System] Failed to parse ICON_MAP:', err.message);
    return;
  }

  let output = `import React from 'react';
import * as Lucide from 'lucide-react';

`;

  for (const [componentName, filename] of Object.entries(ICON_MAP)) {
    if (filename && typeof filename === 'string' && filename.trim() !== '') {
      const filePath = path.join(publicDir, filename.trim());
      if (fs.existsSync(filePath)) {
        let content = fs.readFileSync(filePath, 'utf-8');
        
        const viewBoxMatch = content.match(/viewBox="([^"]+)"/i);
        const viewBox = viewBoxMatch ? viewBoxMatch[1] : '0 0 24 24';

        const svgMatch = content.match(/<svg([^>]+)>/i);
        let outerFill = 'currentColor';
        
        if (svgMatch) {
          const svgInner = svgMatch[1];
          if (svgInner.includes('fill="none"')) {
            outerFill = 'none';
          } else if (svgInner.match(/fill="#[A-Fa-f0-9]+"/)) {
            outerFill = 'currentColor';
          }
        }

        const innerMatch = content.match(/<svg[^>]*>([\s\S]*?)<\/svg>/i);
        let inner = innerMatch ? innerMatch[1] : '';
        
        inner = inner.replace(/<!--[\s\S]*?-->/g, '');
        inner = inner.replace(/<style[^>]*>[\s\S]*?<\/style>/g, '');
        inner = inner.replace(/<g[^>]*\/>/g, '');
        inner = inner.replace(/<g id="SVGRepo_bgCarrier"[^>]*>[\s\S]*?<\/g>/g, '');
        inner = inner.replace(/<g id="SVGRepo_tracerCarrier"[^>]*>[\s\S]*?<\/g>/g, '');
        inner = inner.replace(/<g id="SVGRepo_iconCarrier">([\s\S]*?)<\/g>/, '$1');

        inner = inner.replace(/<rect[^>]*fill="white"[^>]*\/>/g, '');
        inner = inner.replace(/<rect[^>]*fill="#ffffff"[^>]*\/>/gi, '');
        inner = inner.replace(/<rect[^>]*fill="#FFF"[^>]*\/>/gi, '');

        inner = inner.replace(/fill-rule/g, 'fillRule')
                     .replace(/clip-rule/g, 'clipRule')
                     .replace(/stroke-width/g, 'strokeWidth')
                     .replace(/stroke-linecap/g, 'strokeLinecap')
                     .replace(/stroke-linejoin/g, 'strokeLinejoin')
                     .replace(/stroke-miterlimit/g, 'strokeMiterlimit')
                     .replace(/fill-opacity/g, 'fillOpacity')
                     .replace(/class=/g, 'className=')
                     .replace(/className="st[0-9]+"/g, 'fill="currentColor"');

        inner = inner.replace(/fill="#0{3,6}"/g, 'fill="currentColor"');
        inner = inner.replace(/fill="#[1-9A-Fa-f]{3,6}"/gi, 'fill="currentColor"');
        
        inner = inner.replace(/stroke="#0{3,6}"/g, 'stroke="currentColor"');
        inner = inner.replace(/stroke="#[1-9A-Fa-f]{3,6}"/gi, 'stroke="currentColor"');
        
        output += `export const ${componentName} = ({ size = 24, className = '', color = 'currentColor', ...props }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="${viewBox}" 
    width={size} 
    height={size} 
    className={className} 
    fill={color === 'currentColor' ? '${outerFill}' : color}
    {...props}
  >
    ${inner.trim()}
  </svg>
);\n\n`;
        continue;
      }
    }

    // Fallback to Lucide icon if available, or placeholder
    output += `export const ${componentName} = Lucide['${componentName}'] || (({ size = 24, className = '', ...props }) => (
  <span className={className} {...props} />
));\n\n`;
  }

  fs.writeFileSync(outPath, output, 'utf8');
  console.log('⚡ [Icon System] Automatically recompiled MappedIcons.jsx');
}

// Auto-run if executed directly via node scripts/build_icons.js
buildMappedIcons();
