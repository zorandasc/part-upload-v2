"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import styles from "./imagesGallery.module.css";

import Spinner from "@/components/Spinner";
import ImageModal from "./ImageModal";

//THIS setPage(prev => prev + 1), MEANS Only allow user actions
//to update the page.
export default function ImageGallery() {
  const [images, setImages] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(null);

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
          <section className={styles.uploadedImages}>
            {images?.map((item, i) => {
              return (
                <div
                  key={i}
                  className={styles.imageContainer}
                  style={{ animationDelay: `${i * 0.1}s` }}
                  onClick={() => setSelectedIndex(i)}
                >
                  <Image
                    priority
                    src={item.url}
                    alt="Image"
                    layout="fill"
                    className={styles.image}
                    sizes="100%"
                  />
                </div>
              );
            })}
          </section>
          <ImageModal
            images={images}
            currentIndex={selectedIndex}
            setCurrentIndex={setSelectedIndex}
            onClose={() => setSelectedIndex(null)}
          ></ImageModal>
        </>
      )}
    </>
  );
}
