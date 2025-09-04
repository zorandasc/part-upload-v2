"use client";
import styles from "./imageModal.module.css";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { FaTimesCircle, FaRegHeart, FaHeart } from "react-icons/fa";
import { AiOutlineDownload } from "react-icons/ai";

export default function ImageModal({
  images,
  currentIndex,
  setCurrentIndex,
  onClose,
}) {
  const [isLiked, setIsLiked] = useState(false);
  const [likedImages, setLikedImages] = useState([]);
  const touchStartX = useRef(null);

  const imageInfo =
    currentIndex !== null && images?.[currentIndex]
      ? images[currentIndex]
      : null;

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e) => {
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    if (deltaX > 50 && currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    } else if (deltaX < -50 && currentIndex < images.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "ArrowRight" && currentIndex < images.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else if (e.key === "ArrowLeft" && currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    } else if (e.key === "Escape") {
      onClose();
    }
  };

  const handleLiked = () => {
    if (!imageInfo) return;

    let updated;
    if (isLiked) {
      updated = likedImages.filter((img) => img._id !== imageInfo._id);
    } else {
      updated = [...likedImages, imageInfo];
    }
    localStorage.setItem("likedImages", JSON.stringify(updated));
    setLikedImages(updated);
    setIsLiked(!isLiked);
  };

  const handleDownload = () => {
    const url = imageInfo.ufsUrl ? imageInfo.ufsUrl : imageInfo.url;
    const name = imageInfo.name || "download.jpg";
    // Open API route to trigger server-side download
    window.open(
      `/api/download?url=${encodeURIComponent(url)}&name=${encodeURIComponent(
        name
      )}`
    );
  };

  // Attach key listener
  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [currentIndex]);

  // Sync with localStorage whenever index changes
  useEffect(() => {
    if (!imageInfo) return;
    const stored = localStorage.getItem("likedImages");
    const liked = stored ? JSON.parse(stored) : [];
    setLikedImages(liked);
    setIsLiked(liked.some((img) => img._id === imageInfo._id));
  }, [currentIndex, imageInfo]);

  // 🛑 Guard AFTER hooks, in render
  if (!imageInfo) return null;

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
          <Image
            src={imageInfo.ufsUrl ? imageInfo.ufsUrl : imageInfo.url}
            alt={`Image uploaded by ${imageInfo.userId} on ${new Date(
              imageInfo.uploadedAt
            ).toLocaleString()}`}
            fill
            sizes="90vw"
            className={styles.modalImage}
          />
        </figure>

        <div className={styles.imageInfo}>
          {imageInfo.userId && imageInfo.uploadedAt && (
            <div className={styles.generalije}>
              <span className={styles.user}>{imageInfo.userId}</span>
              <span className={styles.user}>
                {new Date(imageInfo.uploadedAt).toLocaleString()}
              </span>
            </div>
          )}
          <div className={styles.buttonsCotainer}>
            <button
              className={styles.closeButton}
              aria-label="Download Image"
              onClick={handleDownload}
            >
              <AiOutlineDownload />
            </button>
            <button
              className={styles.closeButton}
              onClick={handleLiked}
              aria-label="Like Image"
            >
              {isLiked ? <FaHeart  /> : <FaRegHeart />}
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
