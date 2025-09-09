"use client";
import styles from "./mediaModal.module.css";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { FaTimesCircle, FaRegHeart, FaHeart } from "react-icons/fa";
import { AiOutlineDownload } from "react-icons/ai";
import { FaCogs } from "react-icons/fa";
import { MdOutlineKeyboardDoubleArrowRight } from "react-icons/md";
import { MdOutlineKeyboardDoubleArrowLeft } from "react-icons/md";

import { getImageUrl, getVideoUrl, getVideoDownloadUrl } from "@/lib/helper";

export default function MediaModal({
  allMedia,
  currentIndex,
  setCurrentIndex,
  onClose,
}) {
  const mediaInfo =
    currentIndex !== null && allMedia?.[currentIndex]
      ? allMedia[currentIndex]
      : null;

  //FOR SETTING LIKED HARTS
  const [isLiked, setIsLiked] = useState(false);
  //FOR UPLOADED VIDEO IN PROCESING
  const [isReady, setIsReady] = useState(mediaInfo?.readyToStream || false);

  const [showTooltip, setShowTooltip] = useState(false);

  const touchStartX = useRef(null);

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e) => {
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    if (deltaX > 50 && currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    } else if (deltaX < -50 && currentIndex < allMedia.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "ArrowRight" && currentIndex < allMedia.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else if (e.key === "ArrowLeft" && currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    } else if (e.key === "Escape") {
      onClose();
    }
  };

  const handleLiked = () => {
    if (!mediaInfo) return;

    const stored = localStorage.getItem("likedMedia");
    const likedMedia = stored ? JSON.parse(stored) : [];

    let updated;
    if (isLiked) {
      //AKO JE VEC LAJKOVAN IZBACI IZ LIKE
      updated = likedMedia.filter((media) => media._id !== mediaInfo._id);
    } else {
      //AKO NIJE UBACI U LIKED
      updated = [...likedMedia, mediaInfo];
    }
    //ZAPAMTI PROMJENE
    localStorage.setItem("likedMedia", JSON.stringify(updated));
    //TOGGLE PRIKAZ
    setIsLiked(!isLiked);
  };

  const handleDownload = () => {
    const link = document.createElement("a");
    if (mediaInfo.contentType === "video") {
      link.href = getVideoDownloadUrl(mediaInfo.mediaId);
      link.download = mediaInfo.name?.endsWith(".mp4")
        ? mediaInfo.name
        : `${mediaInfo.name || "video"}.mp4`;
    } else {
      link.href = getImageUrl(mediaInfo.mediaId, "public");
      link.download = mediaInfo.name?.endsWith(".jpg")
        ? mediaInfo.name
        : `${mediaInfo.name || "image"}.jpg`;
    }

    // Append to DOM, trigger, then cleanup (for Safari support)
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Attach key listener
  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [currentIndex]);

  // Sync with localStorage whenever index changes
  //TO CHECK IF MEDIA IS LIKED (IN LOCALSTORAGE), SO THAT HART CAN BE
  //VISUALY CHECKED
  useEffect(() => {
    if (!mediaInfo) return;
    const stored = localStorage.getItem("likedMedia");
    const liked = stored ? JSON.parse(stored) : [];

    setIsLiked(liked.some((img) => img._id === mediaInfo._id));
  }, [currentIndex, mediaInfo]);

  //POLL EVERY 10S FOR VIDEO THAT IS NOT READY
  //TO CHECK IF VIDEO IS READY TO STREAM
  useEffect(() => {
    // ✅ Skip if no mediaInfo yet
    if (!mediaInfo) return;
    //CHECK ONLY FOR VIDEO AND ONLY IF IT NOT READY
    if (mediaInfo.contentType !== "video" || mediaInfo.readyToStream) {
      setIsReady(true);
      return;
    }

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/media-state/${mediaInfo._id}`);
        if (res.ok) {
          const updated = await res.json();

          if (updated.readyToStream) {
            setIsReady(true); // ✅ flip local flag
            clearInterval(interval);
          }
        }
      } catch (err) {
        console.error("Polling video status failed:", err);
      }
    }, 10000); //every 10s

    return () => clearInterval(interval);
  }, [currentIndex, mediaInfo, setCurrentIndex]);

  // 🛑 Guard AFTER hooks, in render
  if (!mediaInfo) return null;

  const isDisabled = currentIndex >= allMedia.length - 1;

  return (
    <div
      className={styles.modalOverlay}
      onClick={onClose}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      role="dialog"
      aria-labelledby="modal-title"
      aria-modal="true"
    >
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <h2 id="modal-title" className={styles.visuallyHidden}>
          Image Modal
        </h2>
        <figure className={styles.imageWrapper}>
          {mediaInfo.contentType === "video" ? (
            isReady ? (
              <iframe
                src={getVideoUrl(mediaInfo.mediaId)}
                className={styles.modalVideo}
                allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
                allowFullScreen
              ></iframe>
            ) : (
              <div className={styles.videoPlaceholder}>
                <FaCogs className={styles.spin} />
                <span className={styles.pulse}>Video obrada u toku...</span>
              </div>
            )
          ) : (
            <Image
              src={getImageUrl(mediaInfo.mediaId, "public")}
              alt={`Image uploaded by ${mediaInfo.userId} on ${new Date(
                mediaInfo.createdAt
              ).toLocaleString()}`}
              fill
              sizes="90vw"
              className={styles.modalImage}
            />
          )}
        </figure>

        <button
          disabled={currentIndex < 1}
          className={styles.leftArrow}
          onClick={() => setCurrentIndex((prev) => Math.max(prev - 1, 0))}
        >
          <MdOutlineKeyboardDoubleArrowLeft />
        </button>

        <button
          className={styles.rightArrow}
          disabled={isDisabled}
          onClick={() =>
            setCurrentIndex((prev) => Math.min(prev + 1, allMedia.length - 1))
          }
          onTouchStart={() => isDisabled && setShowTooltip(true)}
          onTouchEnd={() => setShowTooltip(false)}
          title={
            currentIndex >= allMedia.length - 1
              ? "Scroll the gallery to load more items"
              : "Next"
          }
        >
          <MdOutlineKeyboardDoubleArrowRight />
        </button>

        {isDisabled && showTooltip && (
          <div className={styles.tooltip}>
            Dobavite još stavki iz galerije.
          </div>
        )}
        <div className={styles.imageInfo}>
          <div className={styles.generalije}>
            <span className={styles.user}>{mediaInfo.userId}</span>
            <span className={styles.user}>
              {new Date(mediaInfo.createdAt).toLocaleString()}
            </span>
          </div>

          <div className={styles.buttonsCotainer}>
            <button
              className={styles.closeButton}
              aria-label="Download Media"
              onClick={handleDownload}
            >
              <AiOutlineDownload />
            </button>
            <button
              className={styles.closeButton}
              onClick={handleLiked}
              aria-label="Like Media"
            >
              {isLiked ? <FaHeart /> : <FaRegHeart />}
            </button>
            <button
              className={styles.closeButton}
              onClick={onClose}
              aria-label="Close modal"
            >
              <FaTimesCircle />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
