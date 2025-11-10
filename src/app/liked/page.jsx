"use client";

import styles from "./page.module.css";
import React, { useState } from "react";
import Image from "next/image";
import { TbPlayerPlayFilled } from "react-icons/tb";
import { MdOutlineNoPhotography } from "react-icons/md";

import { useLikedContext } from "@/context/LikedContext";
import { getImageUrl, getVideoThumbnail } from "@/lib/helper";
import MediaModal from "@/components/MediaModal";

export default function Liked() {
  const { likedMedia, handleLiked, isLiked } = useLikedContext();
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [loading, setLoading] = useState(false);

  const lastMediaRef = null;

  //RFERESH LIKDE ARRAY IN LOCAL STORAGE
  //AFTER DELETE OF MODAL
  const handelRefreshMedia = (mediaInfo) => {
    const liked = isLiked(mediaInfo?._id);
    if (liked) handleLiked(mediaInfo); //THIS WILL UNSET ITEM IN LIKED ARRAY IN CONTEXT
  };

  return (
    <>
      <section className={styles.uploadedImages}>
        {!loading && likedMedia?.length === 0 && (
          <div className={styles.noContent}>
            <MdOutlineNoPhotography />
            Nema sadržaja.
          </div>
        )}
        {likedMedia?.map((item, i) => {
          const isLast = i === likedMedia.length - 1; //determin last media file so we can attach observer
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
                    src={getVideoThumbnail(item.mediaId)}
                    onError={(e) => {
                      e.currentTarget.src = "/logo.png";
                    }}
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
        allMedia={likedMedia}
        currentIndex={selectedIndex}
        setCurrentIndex={setSelectedIndex}
        onClose={() => setSelectedIndex(null)}
        refreshMediaAfterDelete={handelRefreshMedia}
      ></MediaModal>
    </>
  );
}
