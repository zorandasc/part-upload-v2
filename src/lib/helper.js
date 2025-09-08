/*When you upload an image to Cloudflare Images, it’s stored in its original form, 
but you can’t access it directly. Instead, you create variants in your Cloudflare 
dashboard — each variant defines rules for resizing, quality, cropping, etc. */
/*https://imagedelivery.net/<accountHash>/<imageId>/public
https://imagedelivery.net/<accountHash>/<imageId>/thumbnail
https://imagedelivery.net/<accountHash>/<imageId>/large

public is just a default variant you probably created (maybe 1024px wide, auto quality).
thumbnail could be a 200×200 square crop.
large could be 1920px wide. */

/*For Videos (Cloudflare Stream)
Cloudflare Stream gives you:
Watch URL (playable in <iframe> or <video>):
https://customer-${customerSubdomain}.cloudflarestream.com/${mediaId}/watch
Thumbnail URL (static image preview):
https://videodelivery.net/${mediaId}/thumbnails/thumbnail.jpg */

export const getImageUrl = (mediaId, variant = "public") =>
  `https://imagedelivery.net/${process.env.NEXT_PUBLIC_CF_ACCOUNT_HASH}/${mediaId}/${variant}`;

export const getVideoThumbnail = (mediaId) =>
  `https://videodelivery.net/${mediaId}/thumbnails/thumbnail.jpg`;

export const getVideoUrl = (mediaId) =>
  `https://iframe.videodelivery.net/${mediaId}`;

export const getVideoDownloadUrl = (mediaId) =>
  `https://videodelivery.net/${mediaId}/downloads/default.mp4`;
