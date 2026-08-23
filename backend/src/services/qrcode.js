const QRCode = require('qrcode');
const { Resvg } = require('@resvg/resvg-js');
const https = require('https');
const http = require('http');

/**
 * Fetch remote image as base64 data URI for offline SVG/PNG embedding
 */
async function fetchImageAsBase64(url) {
  if (!url || typeof url !== 'string') return '';
  if (url.startsWith('data:')) return url;

  return new Promise((resolve) => {
    try {
      const client = url.startsWith('https') ? https : http;
      const req = client.get(url, { timeout: 4000 }, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          // Handle redirect
          return fetchImageAsBase64(res.headers.location).then(resolve);
        }
        if (res.statusCode !== 200) {
          return resolve('');
        }
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => {
          const buf = Buffer.concat(chunks);
          const mime = res.headers['content-type'] || 'image/jpeg';
          resolve(`data:${mime};base64,${buf.toString('base64')}`);
        });
      });
      req.on('error', () => resolve(''));
      req.on('timeout', () => {
        req.destroy();
        resolve('');
      });
    } catch {
      resolve('');
    }
  });
}

/**
 * Generate a Fancy QR Code with circular dots, smooth rounded finder eyes,
 * and a centered circular movie poster badge with Spotify green ring (#1ed760).
 */
function generateFancyQRCodeSvg(value = 'LMTX-PASS', options = {}) {
  const {
    imageUrl = '',
    size = 280,
    dotColor = '#000000',
    eyeColor = '#000000',
    ringColor = '#1ed760',
    bgColor = '#ffffff',
  } = options;

  let qrMatrix;
  try {
    qrMatrix = QRCode.create(value || 'LMTX-PASS', { errorCorrectionLevel: 'H' });
  } catch (err) {
    console.error('Error generating QR matrix:', err);
    throw err;
  }

  const moduleCount = qrMatrix.modules.size;
  const cellSize = 10;
  const padding = 2;
  const totalCells = moduleCount + padding * 2;
  const svgSize = totalCells * cellSize;

  // 1. Finder eye detection (7x7 modules at top-left, top-right, bottom-left)
  const isFinder = (r, c) => {
    if (r < 7 && c < 7) return true;
    if (r < 7 && c >= moduleCount - 7) return true;
    if (r >= moduleCount - 7 && c < 7) return true;
    return false;
  };

  // 2. Center circular badge cutout (~25% radius)
  const centerModule = Math.floor(moduleCount / 2);
  const logoCellRadius = Math.ceil(moduleCount * 0.16);
  const isCenter = (r, c) => {
    const dr = r - centerModule;
    const dc = c - centerModule;
    return Math.sqrt(dr * dr + dc * dc) <= logoCellRadius + 0.4;
  };

  const centerPx = (centerModule + padding + 0.5) * cellSize;
  const logoRadiusPx = (logoCellRadius + 0.3) * cellSize;

  // 3. Build data dots (<circle>)
  let dotsSvg = '';
  for (let r = 0; r < moduleCount; r++) {
    for (let c = 0; c < moduleCount; c++) {
      if (isFinder(r, c) || isCenter(r, c)) continue;
      if (qrMatrix.modules.get(r, c)) {
        const cx = (c + padding + 0.5) * cellSize;
        const cy = (r + padding + 0.5) * cellSize;
        dotsSvg += `<circle cx="${cx}" cy="${cy}" r="${(cellSize * 0.43).toFixed(2)}" fill="${dotColor}" />\n`;
      }
    }
  }

  // 4. Finder eyes coordinates
  const finders = [
    { r: 0, c: 0 },
    { r: 0, c: moduleCount - 7 },
    { r: moduleCount - 7, c: 0 },
  ];

  let findersSvg = '';
  finders.forEach(({ r, c }, idx) => {
    const fx = (c + padding) * cellSize;
    const fy = (r + padding) * cellSize;
    const outerSize = 7 * cellSize;
    const innerOffset = 2 * cellSize;
    const innerSize = 3 * cellSize;

    findersSvg += `
      <g id="finder-${idx}">
        <rect x="${fx + cellSize * 0.45}" y="${fy + cellSize * 0.45}" width="${outerSize - cellSize * 0.9}" height="${outerSize - cellSize * 0.9}" rx="${cellSize * 1.8}" fill="none" stroke="${eyeColor}" stroke-width="${cellSize * 0.9}" />
        <rect x="${fx + innerOffset}" y="${fy + innerOffset}" width="${innerSize}" height="${innerSize}" rx="${cellSize * 0.9}" fill="${eyeColor}" />
      </g>
    `;
  });

  const uniqueId = `qr_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;

  const imageElement = imageUrl
    ? `<image href="${imageUrl}" x="${centerPx - logoRadiusPx}" y="${centerPx - logoRadiusPx}" width="${logoRadiusPx * 2}" height="${logoRadiusPx * 2}" clip-path="url(#qr-clip-${uniqueId})" preserveAspectRatio="xMidYMid slice" />`
    : `
      <g clip-path="url(#qr-clip-${uniqueId})">
        <circle cx="${centerPx}" cy="${centerPx}" r="${logoRadiusPx}" fill="#1ed760" />
        <text x="${centerPx}" y="${centerPx + 5}" text-anchor="middle" font-size="${Math.round(logoRadiusPx * 0.75)}" font-weight="900" fill="#000000" font-family="-apple-system, BlinkMacSystemFont, sans-serif">🎟️</text>
      </g>
    `;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${svgSize} ${svgSize}" width="${size}" height="${size}" style="shape-rendering: geometricPrecision; background: ${bgColor}; border-radius: 16px;">
    <rect width="${svgSize}" height="${svgSize}" fill="${bgColor}" rx="${cellSize * 1.5}" />
    ${dotsSvg}
    ${findersSvg}
    <defs>
      <clipPath id="qr-clip-${uniqueId}">
        <circle cx="${centerPx}" cy="${centerPx}" r="${logoRadiusPx}" />
      </clipPath>
    </defs>
    <circle cx="${centerPx}" cy="${centerPx}" r="${logoRadiusPx + 3}" fill="#ffffff" stroke="${ringColor}" stroke-width="2.5" />
    ${imageElement}
  </svg>`;

  return svg;
}

/**
 * Generate an SVG Data URL for standard client-side image tags and database storage
 */
async function generateBookingQRCode(bookingRef, metadata = {}) {
  let embeddedImage = metadata.imageUrl || '';
  if (embeddedImage && (embeddedImage.startsWith('http://') || embeddedImage.startsWith('https://'))) {
    const b64 = await fetchImageAsBase64(embeddedImage);
    if (b64) embeddedImage = b64;
  }

  const svg = generateFancyQRCodeSvg(bookingRef, {
    imageUrl: embeddedImage,
    size: 280,
  });
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/**
 * Generate ultra-crisp PNG Buffer using @resvg/resvg-js for email inline attachments (Guaranteed Gmail & Outlook compatibility)
 */
async function generateQRCodeBuffer(bookingRef, metadata = {}) {
  let embeddedImage = metadata.imageUrl || '';
  if (embeddedImage && (embeddedImage.startsWith('http://') || embeddedImage.startsWith('https://'))) {
    const b64 = await fetchImageAsBase64(embeddedImage);
    if (b64) embeddedImage = b64;
  }

  const svg = generateFancyQRCodeSvg(bookingRef, {
    imageUrl: embeddedImage,
    size: 400,
  });

  try {
    const resvg = new Resvg(svg, {
      fitTo: {
        mode: 'width',
        value: 400,
      },
    });
    const pngData = resvg.render();
    return pngData.asPng();
  } catch (err) {
    console.warn('Resvg rendering fallback to SVG buffer:', err.message);
    return Buffer.from(svg, 'utf-8');
  }
}

module.exports = {
  generateFancyQRCodeSvg,
  generateBookingQRCode,
  generateQRCodeBuffer,
  fetchImageAsBase64,
};
