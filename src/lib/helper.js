/*When you upload an image to Cloudflare Images, it’s stored in its original form, 
but you can’t access it directly. Instead, you create variants in your Cloudflare 
dashboard — each variant defines rules for resizing, quality, cropping, etc. */
/*https://imagedelivery.net/<accountHash>/<imageId>/public
https://imagedelivery.net/<accountHash>/<imageId>/thumbnail
https://imagedelivery.net/<accountHash>/<imageId>/large

public is just a default variant you probably created (maybe 1024px wide, auto quality).
thumbnail could be a 200×200 square crop.
large could be 1920px wide. */

//TO GET IMAGE IN ALL GALERY AND IN MODAL
//AND TO DOWNLOAD IMAGE IN ORGINAL FORM
export const getImageUrl = (mediaId, variant = "public") => {
  const base = `https://imagedelivery.net/${process.env.NEXT_PUBLIC_CF_ACCOUNT_HASH}/${mediaId}`;
  if (variant === "original") {
    // Flexible variant syntax for original
    return `${base}/w=0`;
  }
  return `${base}/${variant}`;
};

/*For Videos (Cloudflare Stream)
Cloudflare Stream gives you:
Watch URL (playable in <iframe> or <video>):
https://customer-${customerSubdomain}.cloudflarestream.com/${mediaId}/watch
Thumbnail URL (static image preview):
https://videodelivery.net/${mediaId}/thumbnails/thumbnail.jpg */

//TO GET VIDEO THUMBNAIL USED IN ALL GALERY
export const getVideoThumbnail = (mediaId) =>
  `https://videodelivery.net/${mediaId}/thumbnails/thumbnail.jpg`;

//TO PLAY VIDEO IN MODAL
export const getVideoUrl = (mediaId) =>
  `https://iframe.videodelivery.net/${mediaId}`;

//TO DOWNLOAD VIDEO AS MP4
export const getVideoDownloadUrl = (mediaId) =>
  `https://customer-a2dln967kq1b7opm.cloudflarestream.com/${mediaId}/downloads/default.mp4`;
