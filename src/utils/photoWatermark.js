// Utility to stamp Store Code, Date, Time and Category directly onto the photo
export function addWatermarkToPhoto(imageFile, metadata = {}) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');

        // Draw original image
        ctx.drawImage(img, 0, 0);

        // Watermark Banner Configuration
        const bannerHeight = Math.max(36, Math.floor(img.height * 0.08));
        const fontSize = Math.max(14, Math.floor(bannerHeight * 0.42));

        // Semi-transparent black gradient bar at the bottom
        ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
        ctx.fillRect(0, img.height - bannerHeight, img.width, bannerHeight);

        // Gold accent stripe
        ctx.fillStyle = '#F8CB46'; // Blinkit Yellow
        ctx.fillRect(0, img.height - bannerHeight, img.width, 3);

        // Text formatting
        ctx.fillStyle = '#ffffff';
        ctx.font = `bold ${fontSize}px sans-serif`;
        ctx.textBaseline = 'middle';

        const storeText = `🏬 ${metadata.storeCode || 'BLINKIT STORE'}`;
        const typeText = metadata.type ? metadata.type.toUpperCase() : 'AUDIT PHOTO';
        const dateText = `📅 ${metadata.date || new Date().toISOString().split('T')[0]}  ⏰ ${metadata.time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

        const textY = img.height - (bannerHeight / 2) + 2;

        // Left side text: Store Code & Category
        ctx.fillText(`${storeText}  |  ${typeText}`, 15, textY);

        // Right side text: Date & Time
        const rightText = dateText;
        const rightTextWidth = ctx.measureText(rightText).width;
        ctx.fillText(rightText, img.width - rightTextWidth - 15, textY);

        // Return base64 JPEG
        resolve(canvas.toDataURL('image/jpeg', 0.88));
      };
      img.onerror = reject;
      img.src = event.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(imageFile);
  });
}
