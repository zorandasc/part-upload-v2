"use client";
import { useState } from "react";
import Image from "next/image";
import styles from "./mediaGallery.module.css";
import { TbPlayerPlayFilled } from "react-icons/tb";
import { MdOutlineNoPhotography } from "react-icons/md";

import MediaModal from "./MediaModal";
import { getImageUrl, getVideoThumbnail } from "@/lib/helper";

//lastImageRef is a React ref callback attached to the last image element in the gallery.
export default function MediaGallery({
  allMedia,
  loading,
  lastMediaRef,
  refreshMediaAfterDelete,
  updateMediaItem,
}) {
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [brokenVideoThumbs, setBrokenVideoThumbs] = useState({});

  return (
    <>
      <section className={styles.uploadedImages}>
        {!loading && allMedia?.length === 0 && (
          <div className={styles.noContent}>
            <MdOutlineNoPhotography />
            Nema sadržaja.
          </div>
        )}
        {allMedia?.map((item, i) => {
          const isLast = i === allMedia.length - 1; //determin last media file so we can attach observer
          const fallbackVideoThumb =
            item.contentType === "video" &&
            (!item.readyToStream || brokenVideoThumbs[item.mediaId]);
          return (
            <div
              key={i}
              className={styles.imageContainer}
              style={{ animationDelay: `${i * 0.1}s` }}
              onClick={() => setSelectedIndex(i)}
              ref={isLast ? lastMediaRef : null} // attach observer on last media file
            >
              {item.contentType === "video" ? (
                <>
                  <Image
                    priority
                    src={
                      fallbackVideoThumb
                        ? "/logo.png"
                        : getVideoThumbnail(item.mediaId)
                    }
                    onError={() =>
                      setBrokenVideoThumbs((prev) => ({
                        ...prev,
                        [item.mediaId]: true,
                      }))
                    }
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
        refreshMediaAfterDelete={refreshMediaAfterDelete}
        updateMediaItem={updateMediaItem}
      ></MediaModal>
    </>
  );
}
