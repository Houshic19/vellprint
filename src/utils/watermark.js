const { Jimp } = require('jimp');
const path = require('path');
const fs = require('fs');

async function applyWatermark(imagePath) {
  try {
    const fullPath = path.join(__dirname, '../../public', imagePath);
    const logoPath = path.join(__dirname, '../../public/logo.png');
    
    if (!fs.existsSync(fullPath) || !fs.existsSync(logoPath)) {
      return;
    }
    
    // Using Jimp to read
    const image = await Jimp.read(fullPath);
    const logo = await Jimp.read(logoPath);
    
    // Resize logo to be 25% of the main image width
    const logoWidth = Math.floor(image.bitmap.width * 0.25);
    logo.resize({ w: logoWidth });
    
    // Position it in bottom right corner with some padding
    const padding = 20;
    const x = image.bitmap.width - logo.bitmap.width - padding;
    const y = image.bitmap.height - logo.bitmap.height - padding;
    
    // Use composite with 50% opacity
    image.composite(logo, x, y, {
      mode: Jimp.BLEND_SOURCE_OVER,
      opacitySource: 0.5
    });
    
    await image.write(fullPath);
    console.log(`Watermark applied to ${imagePath}`);
  } catch (err) {
    console.error('Error applying watermark:', err);
  }
}

module.exports = applyWatermark;
