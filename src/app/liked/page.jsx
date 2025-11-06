"use client";

import React, { useState } from "react";
import { useLikedContext } from "@/context/LikedContext";
import MediaGallery from "@/components/MediaGallery";

export default function Liked() {
  const { likedMedia, handleLiked, isLiked } = useLikedContext();
  const [loading, setLoading] = useState(false);

  const lastMediaRef = null;

  //RFERESH LIKDE ARRAY IN LOCAL STORAGE
  //AFTER DELETE OF MODAL
  const handelRefreshMedia = (mediaInfo) => {
    const liked = isLiked(mediaInfo?._id);
    if (liked) handleLiked(mediaInfo);
  };

  return (
    <MediaGallery
      allMedia={likedMedia}
      refreshMediaAfterDelete={handelRefreshMedia}
      loading={loading}
      lastMediaRef={lastMediaRef}
    />
  );
}
