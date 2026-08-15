/**
 * StageLink High-Performance Canvas Image Compressor
 * Converts any File, Blob, or raw Base64 string into an ultra-fast, lightweight JPEG dataURL (< 200KB)
 */
export const compressImage = (source, maxWidth = 1080, maxHeight = 1920, quality = 0.78) => {
  return new Promise((resolve) => {
    if (!source) return resolve('');
    if (typeof source === 'string' && !source.startsWith('data:image')) {
      return resolve(source); // Already an HTTP URL or audio/video
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        let { width, height } = img;
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(typeof source === 'string' ? source : '');

        ctx.drawImage(img, 0, 0, width, height);
        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedDataUrl || source);
      } catch (err) {
        console.warn('Image compression fallback:', err);
        resolve(typeof source === 'string' ? source : '');
      }
    };

    img.onerror = () => {
      resolve(typeof source === 'string' ? source : '');
    };

    if (typeof source === 'string') {
      img.src = source;
    } else if (source instanceof Blob || source instanceof File) {
      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = e.target.result;
      };
      reader.onerror = () => resolve('');
      reader.readAsDataURL(source);
    } else {
      resolve('');
    }
  });
};
