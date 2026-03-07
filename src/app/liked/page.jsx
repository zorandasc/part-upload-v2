"use client";

import styles from "./page.module.css";
import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { TbPlayerPlayFilled } from "react-icons/tb";
import { MdOutlineNoPhotography } from "react-icons/md";
import { toast } from "react-hot-toast";

import { useLikedContext } from "@/context/LikedContext";
import { getImageUrl, getVideoThumbnail } from "@/lib/helper";
import MediaModal from "@/components/MediaModal";

export default function Liked() {
  const { likedMedia, setLikedMedia, handleLiked, isLiked } = useLikedContext();
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [loading, setLoading] = useState(false);
  const [brokenVideoThumbs, setBrokenVideoThumbs] = useState({});
  const hasPrunedStaleLiked = useRef(false);

  const lastMediaRef = null;

  //AKO JE NEKI SADRAZJ UKLJONJEN OD STRANE ADMIN USERA
  useEffect(() => {
    const pruneStaleLikedMedia = async () => {
      //Run prune only when page first visit
      if (hasPrunedStaleLiked.current) return;
      hasPrunedStaleLiked.current = true;

      //provijeri dali likedMedia uopste postiji kao array
      if (!Array.isArray(likedMedia) || likedMedia.length === 0) return;

      //Od cijelog likedMedia dobavi sve id-ijeve
      const ids = likedMedia.map((item) => item?._id).filter(Boolean);
      if (ids.length === 0) return;

      //Posalje sve id-ijeve likedMedia na backend routu
      //koja ce provijeriti i vraitit sve id-ijev koji i
      //dalje postoje na cloudflare
      try {
        const res = await fetch("/api/check-liked-media", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids }),
        });

        if (!res.ok) return;

        const data = await res.json();
        const existingIds = new Set(data.existingIds || []);
        //Prikazi samo one koji postoje na cloudflare
        //obrisisi ostale postu su broken in localstorage
        const pruned = likedMedia.filter((item) => existingIds.has(item._id));

        if (pruned.length !== likedMedia.length) {
          setLikedMedia(pruned);
          toast("Neki od sviđanih sadržaj više ne postoji i uklonjen je.");
        }
      } catch (error) {
        console.error("Failed to prune stale liked media:", error);
      }
    };

    pruneStaleLikedMedia();
  }, [likedMedia, setLikedMedia]);

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
        allMedia={likedMedia}
        currentIndex={selectedIndex}
        setCurrentIndex={setSelectedIndex}
        onClose={() => setSelectedIndex(null)}
        refreshMediaAfterDelete={handelRefreshMedia}
      ></MediaModal>
    </>
  );
}
