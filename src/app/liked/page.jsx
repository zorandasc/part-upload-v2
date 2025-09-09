"use client";

import React, { useState, useEffect } from "react";
import MediaGallery from "@/components/MediaGallery";

export default function Liked() {
  const [allMedia, setAllMedia] = useState([]);
  const [loading, setLoading] = useState(false);

  const lastMediaRef = null;

  useEffect(() => {
    const storedMedia = localStorage.getItem("likedMedia");
    if (storedMedia) {
      setAllMedia(JSON.parse(storedMedia));
    }
  }, []);

  return <MediaGallery allMedia={allMedia} loading={loading} lastMediaRef={lastMediaRef} />;
}
