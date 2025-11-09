"use client";
import styles from "./mediaModal.module.css";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useUserContext } from "@/context/UserContext";
import { useLikedContext } from "@/context/LikedContext";
import { FaTimesCircle, FaRegHeart, FaHeart } from "react-icons/fa";
import { AiOutlineDownload } from "react-icons/ai";
import { FaCogs } from "react-icons/fa";
import { MdOutlineKeyboardDoubleArrowRight } from "react-icons/md";
import { MdOutlineKeyboardDoubleArrowLeft } from "react-icons/md";
import { RiDeleteBin6Line } from "react-icons/ri";

import { getImageUrl, getVideoUrl, getVideoDownloadUrl } from "@/lib/helper";

export default function MediaModal({
  allMedia,
  currentIndex,
  setCurrentIndex,
  onClose,
  refreshMediaAfterDelete,
}) {
  const mediaInfo =
    currentIndex !== null && allMedia?.[currentIndex]
      ? allMedia[currentIndex]
      : null;

  console.log(mediaInfo);

  //FOR DISPLAYING DELETE BUTTON IF LOGGED IN
  const { user } = useUserContext();
  const { handleLiked, isLiked } = useLikedContext();
  const liked = isLiked(mediaInfo?._id);

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

  const handleDownload = async () => {
    try {
      let fileUrl;
      let fileName;

      if (mediaInfo.contentType === "video") {
        fileUrl = getVideoDownloadUrl(mediaInfo.mediaId);
        fileName = `${mediaInfo.name || mediaInfo.mediaId}.mp4`;
      } else {
        fileUrl = getImageUrl(mediaInfo.mediaId, "original");

        // Fetch the image first
        const res = await fetch(fileUrl);
        const blob = await res.blob();

        // Determine extension from MIME type
        const mimeToExt = {
          "image/jpeg": "jpg",
          "image/png": "png",
          "image/webp": "webp",
          "image/gif": "gif",
        };

        const ext = mimeToExt[blob.type] || "jpg";

        // Use mediaInfo.name base or fallback to mediaId
        fileName = `${
          mediaInfo.name?.split(".")[0] || mediaInfo.mediaId
        }.${ext}`;

        const blobUrl = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = blobUrl;
        link.download = fileName;

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(blobUrl);
        return;
      }

      // Video download (direct, no blob)
      const link = document.createElement("a");
      link.href = fileUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Download failed:", err);
    }
  };

  /* const handleDownload = () => {
    const link = document.createElement("a");
    if (mediaInfo.contentType === "video") {
      link.href = getVideoDownloadUrl(mediaInfo.mediaId);
      link.download = mediaInfo.name?.endsWith(".mp4")
        ? mediaInfo.name
        : `${mediaInfo.name || "video"}.mp4`;
    } else {
      link.href = getImageUrl(mediaInfo.mediaId, "original");
      const ext = mediaInfo.name?.split(".").pop()?.toLowerCase();
      const safeExt = ["jpg", "jpeg", "png", "webp"].includes(ext)
        ? ext
        : "jpg";
      link.download = `${mediaInfo.name?.split(".")[0] || "image"}.${safeExt}`;
    }

    // Append to DOM, trigger, then cleanup (for Safari support)
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }; */

  const handleDelete = async () => {
    if (!mediaInfo?._id) return;
    try {
      //DELETE FROM DB AND FROM CLOUDFLARE
      const res = await fetch("/api/delete-media", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ _id: mediaInfo._id }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        console.error("❌ Media delete failed:", data.error || res.statusText);
        alert("Failed to delete media. Please try again.");
        return;
      }
      console.log("✅ Media deleted successfully");

      // ✅ re-fetch (REFRESH) parent befor MODAL close
      await refreshMediaAfterDelete(mediaInfo);

      // close modal
      onClose();
    } catch (error) {
      console.error("Delete failed:", error);
    }
  };

  // Attach key listener
  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [currentIndex]);

  //POLL EVERY 10S FOR VIDEO THAT IS NOT READY
  //TO CHECK IF VIDEO IS READY TO STREAM
  useEffect(() => {
    // ✅ Skip if no mediaInfo yet
    if (!mediaInfo) return;
    //setIsReady(true) WILL BE EXESUTED ALWAYS FOR IMAGE
    //AND FOR VIDEO IF READYTOSTREAM
    if (mediaInfo.contentType !== "video" || mediaInfo.readyToStream) {
      setIsReady(true);
      return;
    }
    //INTERVAL WILL START IF MEDIA IS: VIDEO AND readyToStream=FALSE
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/get-media-state/${mediaInfo._id}`);
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
  }, [currentIndex, mediaInfo?._id, setCurrentIndex]);

  // 🛑 Guard AFTER hooks, in render
  if (!mediaInfo) return null;

  //DISABLE SCROLER U DESNO AKO NEMA VISE CONTENTA
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
          <div className={styles.tooltip}>Dobavite još stavki iz galerije.</div>
        )}
        <div className={styles.imageInfo}>
          <div className={styles.generalije}>
            <span className={styles.user}>{mediaInfo.userId}</span>
            <span className={styles.user}>
              {new Date(mediaInfo.createdAt).toLocaleString()}
            </span>
          </div>

          <div className={styles.buttonsCotainer}>
            {user && (
              <button
                className={styles.closeButton}
                aria-label="Delete Media"
                onClick={handleDelete}
              >
                <RiDeleteBin6Line />
              </button>
            )}
            <button
              className={styles.closeButton}
              aria-label="Download Media"
              onClick={handleDownload}
            >
              <AiOutlineDownload />
            </button>
            <button
              className={styles.closeButton}
              onClick={() => handleLiked(mediaInfo)}
              aria-label="Like Media"
            >
              {liked ? <FaHeart /> : <FaRegHeart />}
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
