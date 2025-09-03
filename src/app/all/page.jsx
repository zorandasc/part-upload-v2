"use client";

import { useState, useEffect } from "react";
import ImageGallery from "@/components/ImageGallery";
import UploadButton from "@/components/UploadButton";
import UploadModal from "@/components/UploadModal";
import Spinner from "@/components/Spinner";

export default function All() {
  const [images, setImages] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const [isModalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    const fetchImages = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/images");
        const data = await res.json();

        setImages(data.files);
        setTotalCount(data.totalCount);
      } catch (error) {
        console.error("Fetch error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchImages();
  }, []);

  return (
    <>
      {loading ? (
        <Spinner></Spinner>
      ) : (
        <>
          <ImageGallery images={images}></ImageGallery>
          <UploadButton handleClick={() => setModalOpen(true)}></UploadButton>
          <UploadModal
            isOpen={isModalOpen}
            onClose={() => setModalOpen(false)}
          ></UploadModal>
        </>
      )}
    </>
  );
}
