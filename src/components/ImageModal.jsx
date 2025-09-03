"use client";

import styles from "./imageModal.module.css";
import { useEffect, useRef } from "react";
import Image from "next/image";
import { FaTimes } from "react-icons/fa";

export default function ImageModal({
  images,
  currentIndex,
  setCurrentIndex,
  onClose,
}) {
  const touchStartX = useRef(null);

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

  //ATACH KEY LISTENER
  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [currentIndex]);

  //NEMA IZBARANE SLIKE
  if (currentIndex === null || !images[currentIndex]) return null;

  //IZABRANA SLIKA
  const imageInfo = images[currentIndex];

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
            //imageInfo.ufsUrl SE KORITI KOD UPLOAD, TO VRACA handleOnUploadComplete
            //KOD ALLIMAGES, /homepage, VRACA SE imageInfo.url
            src={imageInfo.ufsUrl ? imageInfo.ufsUrl : imageInfo.url}
            alt={`Image uploaded by ${imageInfo.userId} on ${new Date(
              imageInfo.uploadedAt
            ).toLocaleString()}`}
            fill
            sizes="90vw"
            //quality={80}
            className={styles.modalImage}
          />
        </figure>
        {imageInfo.userId && imageInfo.uploadedAt && (
          <div className={styles.imageInfo}>
            <span className={styles.user}>{imageInfo.userId}</span>
            <span className={styles.user}>
              {new Date(imageInfo.uploadedAt).toLocaleString()}
            </span>
          </div>
        )}
        <button
          className={styles.closeButton}
          onClick={onClose}
          aria-label="Close modal"
        >
          <FaTimes />
        </button>
      </div>
    </div>
  );
}
