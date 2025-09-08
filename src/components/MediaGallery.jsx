"use client";
import { useState } from "react";
import Image from "next/image";
import styles from "./mediaGallery.module.css";
import { TbPlayerPlayFilled } from "react-icons/tb";

import MediaModal from "./MediaModal";
import { getImageUrl, getVideoThumbnail } from "@/lib/helper";

//lastImageRef is a React ref callback attached to the last image element in the gallery.
export default function MediaGallery({ allMedia, lastMediaRef }) {
  const [selectedIndex, setSelectedIndex] = useState(null);

  return (
    <>
      <section className={styles.uploadedImages}>
        {allMedia?.map((item, i) => {
          const isLast = i === allMedia.length - 1; //determin last media file
          return (
            <div
              key={i}
              className={styles.imageContainer}
              style={{ animationDelay: `${i * 0.1}s` }}
              onClick={() => setSelectedIndex(i)}
              ref={isLast ? lastMediaRef : null} // observe last media file
            >
              {item.contentType === "video" ? (
                <>
                  <Image
                    priority
                    src={getVideoThumbnail(item.mediaId)}
                    alt={item.name || "Video thumbnail"}
                    fill
                    className={styles.image}
                    sizes="100%"
                  />
                  <div className={styles.videoBadge}>
                    <TbPlayerPlayFilled />
                  </div>
                </>
              ) : (
                <Image
                  priority
                  src={getImageUrl(item.mediaId)}
                  alt={item.name || "Image"}
                  fill
                  className={styles.image}
                  sizes="100%"
                />
              )}
            </div>
          );
        })}
      </section>
      <MediaModal
        allMedia={allMedia}
        currentIndex={selectedIndex}
        setCurrentIndex={setSelectedIndex}
        onClose={() => setSelectedIndex(null)}
      ></MediaModal>
    </>
  );
}
