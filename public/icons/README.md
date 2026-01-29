# Icon Generation Instructions

## Icons Needed for PWA

The app requires icons in the following sizes:

- 16x16 (favicon)
- 32x32 (favicon)
- 72x72 (iOS)
- 96x96 (Android)
- 128x128 (Android)
- 144x144 (Windows)
- 152x152 (iOS)
- 192x192 (Android, Chrome)
- 384x384 (Android)
- 512x512 (Android, Chrome splash)

## Quick Icon Generation

### Option 1: Use Online Tool (Easiest)

1. Go to https://www.pwabuilder.com/imageGenerator
2. Upload the `icon-source.svg` file
3. Download the generated icon package
4. Extract to `/public/icons/` folder

### Option 2: Use Favicon Generator

1. Go to https://realfavicongenerator.net/
2. Upload the `icon-source.svg` file
3. Customize settings if needed
4. Generate icons
5. Download and extract to `/public/icons/` folder

### Option 3: Manual Creation (Design Software)

If you have a design tool (Figma, Adobe Illustrator, Photoshop):

1. Create a 512x512 canvas
2. Design your app icon with:
   - Medical/health theme
   - Clear, recognizable symbol
   - Good contrast
   - Works well at small sizes
3. Export all required sizes
4. Save to `/public/icons/` folder

### Option 4: Use ImageMagick (Command Line)

If you have a PNG icon (512x512):

```bash
# Install ImageMagick first
# Windows: choco install imagemagick

cd public/icons

# Generate all sizes
magick icon-512x512.png -resize 16x16 icon-16x16.png
magick icon-512x512.png -resize 32x32 icon-32x32.png
magick icon-512x512.png -resize 72x72 icon-72x72.png
magick icon-512x512.png -resize 96x96 icon-96x96.png
magick icon-512x512.png -resize 128x128 icon-128x128.png
magick icon-512x512.png -resize 144x144 icon-144x144.png
magick icon-512x512.png -resize 152x152 icon-152x152.png
magick icon-512x512.png -resize 192x192 icon-192x192.png
magick icon-512x512.png -resize 384x384 icon-384x384.png
```

## Temporary Solution

For testing PWA functionality without custom icons:

1. Use placeholder icons from a CDN
2. Or use generic medical icons from icon libraries
3. Replace later with branded icons

## Icon Design Guidelines

- **Simple & Clear**: Should be recognizable at small sizes
- **High Contrast**: Good visibility on all backgrounds
- **Medical Theme**: Use health/medical symbols (cross, heart, pulse, etc.)
- **Brand Colors**: Use your app's theme colors (#0ea5e9 - cyan)
- **Safe Area**: Keep important elements in center 80%
- **Maskable**: Design for circular masks (Android)

## Testing Icons

After generating icons:

1. Clear browser cache
2. Reload the app
3. Check manifest in DevTools (Application tab)
4. Test install prompt on mobile/desktop
5. Verify icon appears correctly when installed
