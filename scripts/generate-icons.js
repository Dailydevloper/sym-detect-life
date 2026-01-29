import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Simple icon generator using Canvas (requires node-canvas package)
// Or you can use this as a reference and manually create icons

const iconSizes = [16, 32, 72, 96, 128, 144, 152, 192, 384, 512];

const generateSVGIcon = (size) => {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0ea5e9;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#06b6d4;stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <!-- Background with rounded corners -->
  <rect width="${size}" height="${size}" rx="${size * 0.15}" fill="url(#grad)"/>
  
  <!-- Medical Cross -->
  <g transform="translate(${size / 2}, ${size / 2})">
    <!-- Vertical bar -->
    <rect x="${-size * 0.08}" y="${-size * 0.24}" width="${size * 0.16}" height="${size * 0.48}" rx="${size * 0.02}" fill="white"/>
    <!-- Horizontal bar -->
    <rect x="${-size * 0.24}" y="${-size * 0.08}" width="${size * 0.48}" height="${size * 0.16}" rx="${size * 0.02}" fill="white"/>
  </g>
  
  <!-- Heart pulse line -->
  <path d="M ${size * 0.2} ${size * 0.7} L ${size * 0.3} ${size * 0.7} L ${size * 0.36} ${size * 0.6} L ${size * 0.42} ${size * 0.8} L ${size * 0.48} ${size * 0.7} L ${size * 0.8} ${size * 0.7}" 
        stroke="white" 
        stroke-width="${size * 0.024}" 
        stroke-linecap="round" 
        stroke-linejoin="round" 
        fill="none"
        opacity="0.8"/>
</svg>`;
};

// Create icons directory if it doesn't exist
const iconsDir = path.join(__dirname, "../public/icons");
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Generate SVG icons
console.log("🎨 Generating placeholder icons...\n");

iconSizes.forEach((size) => {
  const svgContent = generateSVGIcon(size);
  const filename = `icon-${size}x${size}.png`; // We'll generate as SVG but name as PNG for compatibility
  const svgFilename = `icon-${size}x${size}.svg`;
  const filepath = path.join(iconsDir, svgFilename);

  fs.writeFileSync(filepath, svgContent);
  console.log(`✅ Generated ${svgFilename}`);
});

console.log("\n✨ Icon generation complete!");
console.log("\n⚠️  Note: These are SVG placeholders.");
console.log("For production, convert to PNG using:");
console.log("   - Online tools: https://www.pwabuilder.com/imageGenerator");
console.log("   - ImageMagick: magick convert icon.svg icon.png");
console.log("   - Or use design software (Figma, Photoshop, etc.)\n");

// Generate a simple HTML file to view all icons
const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>PWA Icons Preview</title>
  <style>
    body {
      font-family: system-ui, -apple-system, sans-serif;
      max-width: 1200px;
      margin: 0 auto;
      padding: 40px 20px;
      background: #f5f5f5;
    }
    h1 {
      text-align: center;
      color: #333;
    }
    .icons-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 20px;
      margin-top: 40px;
    }
    .icon-card {
      background: white;
      border-radius: 12px;
      padding: 20px;
      text-align: center;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .icon-card img {
      max-width: 100%;
      height: auto;
      border-radius: 8px;
    }
    .icon-size {
      margin-top: 12px;
      font-weight: 600;
      color: #0ea5e9;
    }
    .usage {
      margin-top: 8px;
      font-size: 12px;
      color: #666;
    }
  </style>
</head>
<body>
  <h1>🎨 SymDetect Life - PWA Icons</h1>
  <p style="text-align: center; color: #666;">Generated placeholder icons for Progressive Web App</p>
  
  <div class="icons-grid">
    ${iconSizes
      .map(
        (size) => `
    <div class="icon-card">
      <img src="/icons/icon-${size}x${size}.svg" alt="Icon ${size}x${size}">
      <div class="icon-size">${size}x${size}</div>
      <div class="usage">${size <= 32 ? "Favicon" : size <= 152 ? "Mobile" : "Android/Chrome"}</div>
    </div>
    `,
      )
      .join("")}
  </div>
  
  <div style="margin-top: 40px; padding: 20px; background: white; border-radius: 12px;">
    <h2>📝 Next Steps:</h2>
    <ol>
      <li>These are SVG placeholders for development</li>
      <li>For production, convert to PNG using online tools</li>
      <li>Recommended: <a href="https://www.pwabuilder.com/imageGenerator" target="_blank">PWA Builder Image Generator</a></li>
      <li>Or use: <a href="https://realfavicongenerator.net/" target="_blank">Real Favicon Generator</a></li>
    </ol>
  </div>
</body>
</html>`;

fs.writeFileSync(
  path.join(__dirname, "../public/icons/preview.html"),
  htmlContent,
);
console.log(
  "📄 Generated preview.html - Open /icons/preview.html in browser to view icons\n",
);
