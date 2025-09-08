"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import MediaGallery from "@/components/MediaGallery";
import UploadModal from "@/components/UploadModal";

export default function Liked() {
  const [allMedia, setAllMedia] = useState([]);
  const [isModalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const lastMediaRef = null

  useEffect(() => {
    const storedMedia = localStorage.getItem("likedMedia");
    if (storedMedia) {
      setAllMedia(JSON.parse(storedMedia));
    }
  }, []);

  return (
    <>
      <MediaGallery allMedia={allMedia} lastMediaRef={lastMediaRef} />
      <UploadModal
        isOpen={isModalOpen}
        onClose={() => setModalOpen(false)}
      ></UploadModal>
    </>
  );
}
