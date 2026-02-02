# Extension Icons

This extension requires icon files for Chrome. You need to create three PNG files:

- `icon16.png` - 16x16 pixels
- `icon48.png` - 48x48 pixels
- `icon128.png` - 128x128 pixels

## Quick Way to Create Icons

### Option 1: Use an Online Tool

1. Go to https://www.favicon-generator.org/
2. Upload or create a 128x128 icon
3. Download all sizes
4. Rename files and place in this directory

### Option 2: Use Figma/Canva

1. Create a 128x128 canvas
2. Design your lock icon (🔒)
3. Export as PNG in 16x16, 48x48, and 128x128
4. Save in this directory

### Option 3: Quick Placeholder (for testing only)

Use this bash script to create simple placeholder icons:

```bash
# macOS (requires ImageMagick)
brew install imagemagick

convert -size 128x128 xc:purple -gravity center \
  -pointsize 80 -fill white -annotate +0+0 "🔒" icon128.png

convert icon128.png -resize 48x48 icon48.png
convert icon128.png -resize 16x16 icon16.png
```

## Recommended Design

- **Colors**: Purple gradient (#667eea to #764ba2)
- **Symbol**: Lock icon or shield
- **Style**: Modern, minimal
- **Background**: Solid or subtle gradient

For production, hire a designer or use tools like:
- Figma
- Canva
- Adobe Illustrator
- Inkscape (free)

Once you have your icons, the extension will load properly in Chrome!
