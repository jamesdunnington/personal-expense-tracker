import sharp from 'sharp'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Create a simple SVG icon
const svgIcon = `
<svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" rx="128" fill="#6366f1"/>
  <text x="256" y="340" font-family="Arial, sans-serif" font-size="280" font-weight="bold" fill="white" text-anchor="middle">$</text>
</svg>
`

const publicDir = path.join(__dirname, 'public')

// Ensure public directory exists
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true })
}

const sizes = [192, 512]

async function generateIcons() {
  console.log('Generating PWA icons...')
  
  for (const size of sizes) {
    const outputPath = path.join(publicDir, `pwa-${size}x${size}.png`)
    
    await sharp(Buffer.from(svgIcon))
      .resize(size, size)
      .png()
      .toFile(outputPath)
    
    console.log(`✓ Generated ${size}x${size} icon`)
  }
  
  // Also generate apple-touch-icon
  await sharp(Buffer.from(svgIcon))
    .resize(180, 180)
    .png()
    .toFile(path.join(publicDir, 'apple-touch-icon.png'))
  console.log('✓ Generated apple-touch-icon.png')
  
  // Generate favicon
  await sharp(Buffer.from(svgIcon))
    .resize(32, 32)
    .png()
    .toFile(path.join(publicDir, 'favicon.ico'))
  console.log('✓ Generated favicon.ico')
  
  console.log('All icons generated successfully!')
}

generateIcons().catch(console.error)
