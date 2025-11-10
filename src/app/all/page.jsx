"use client";

import styles from "./page.module.css";
import { useState, useEffect, useRef, useCallback } from "react";
import { TbPlayerPlayFilled } from "react-icons/tb";
import { MdOutlineNoPhotography } from "react-icons/md";
import Image from "next/image";
import { useLikedContext } from "@/context/LikedContext";
import { getImageUrl, getVideoThumbnail } from "@/lib/helper";
import MediaModal from "@/components/MediaModal";
import UploadButton from "@/components/UploadButton";
import UploadModal from "@/components/UploadModal";
import Spinner from "@/components/Spinner";

export default function All() {
  const [allMedia, setAllMedia] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [hasMore, setHasMore] = useState(true);

  const [isModalOpen, setModalOpen] = useState(false);

  const { handleLiked, isLiked } = useLikedContext();

  const observer = useRef();

  //useCallback memorize the function so it doesnot get recreated on every render
  //which is important because react will attach thi asa a ref to the last image
  //DEPENDENCIE [loadine, hasmore] will update function
  const lastMediaRef = useCallback(
    (node) => {
      //While allMedia are currently being loaded, we don’t want to trigger another page load.
      //Stops the observer from being set up while a fetch is in progress.
      //prevents double loading.
      if (loading || !hasMore) return;
      //observer.current stores the previous IntersectionObserver instance.
      //disconnect() removes it from the previously observed element.
      //This prevents multiple observers from stacking up, which can cause multiple page increments.
      if (observer.current) observer.current.disconnect();

      //Create a new IntersectionObserver
      /*IntersectionObserver watches a DOM element and triggers a callback when it enters or leaves the viewport.
      entries[0] refers to the observed element (the last image).
      isIntersecting is true when the element is visible on screen.
      If it’s visible and there are more allMedia (hasMore), we increment page to fetch the next set of allMedia.*/
      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          //this automatically triggers your useEffect(fetchAllMedia)
          setPage((prev) => prev + 1);
        }
      });

      //Observe the node
      /*node is the actual DOM element passed by React when this ref is attached.
      Only attach the observer if the element exists.
      This is usually the last image in your gallery, so when the user scrolls to it, the callback fires */
      if (node) observer.current.observe(node);
    },
    [loading, hasMore]
  );

  useEffect(() => {
    return () => {
      if (observer.current) observer.current.disconnect();
    };
  }, []);

  //useCallback to stabilize it and avoid unnecessary effect triggers:
  const fetchAllMedia = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/get-all-media?page=${page}&limit=20`);
      const data = await res.json();

      setAllMedia((prev) =>
        page === 1 ? data.files : [...prev, ...data.files]
      );
      setTotalCount(data.totalCount);
      setHasMore(data.hasMore);
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setLoading(false);
    }
  }, [page]);

  //WHEN SCROLING TO THE END OF PAGE IN MODAL VIEW.
  //WE NEED TO GET MORE ITEMS
  //THIS FUNCTION RETUERN PROMISE SO CALLER (MEDIAMODAL) can awaited
  //SO IF WE AWAIT IN MODAL, CURRENT INDEX WILL NOT GO TO UNDEFINED
  const loadMoreModalItems = async () => {
    return new Promise((resolve) => {
      //SET NEXT PAGE
      setPage((p) => p + 1);
      //BUT Wait for next fetchAllMedia to complete
      //odnsono da loading bude false
      const interval = setInterval(() => {
        if (!loading) {
          clearInterval(interval);
          resolve();
        }
      }, 200);
      // safety stop, prevents infinite waiting
      setTimeout(() => clearInterval(interval), 5000);
    });
  };

  // Handler called when UploadModal is closed after upload
  const handleModalClose = (didUpload = false) => {
    setModalOpen(false);
    if (didUpload) {
      //OBRISI STARO STANJE
      setAllMedia([]);
      if (page === 1) {
        //AKO SMO VEC NA PAGE 1, ONDA SAMO REFECTH ALL
        fetchAllMedia(); // re-fetch explicitly
      } else {
        //AKO NISMO VRATI SE NA POCETAK I PKAZI NOVI UNOS NA VRHU
        setPage(1); // triggers useEffect normally, implicit refetch
      }
    }
  };

  //AFTER MODAL DELETE,
  //REMOVE FROM LOCALSTORAGE LIKED STORED IN CONTEXT
  //AND REFETCH ALL
  const handelRefreshMedia = async (mediaInfo) => {
    const liked = isLiked(mediaInfo?._id);
    if (liked) handleLiked(mediaInfo);
    await fetchAllMedia();
  };

  //AFTER MODAL INTERVAL DETECT VIDEO IS READY TO STREAM
  //UPDATE THAT ITEM IN ALL GALLERY
  const updateMediaItem = (id, updatedFields) => {
    setAllMedia((prev) =>
      prev.map((item) =>
        item._id === id ? { ...item, ...updatedFields } : item
      )
    );
  };

  useEffect(() => {
    fetchAllMedia();
  }, [fetchAllMedia]);

  useEffect(() => {
    if (page === 1) window.scrollTo({ top: 0, behavior: "smooth" });
  }, [allMedia]);

  return (
    <>
      {loading && <Spinner />}
      <section className={styles.uploadedImages}>
        {!loading && allMedia?.length === 0 && (
          <div className={styles.noContent}>
            <MdOutlineNoPhotography />
            Nema sadržaja.
          </div>
        )}
        {allMedia?.map((item, i) => {
          const isLast = i === allMedia.length - 1; //determin last media file so we can attach observer
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
                    src={getVideoThumbnail(item.mediaId)}
                    onError={(e) => {
                      e.currentTarget.src = "/logo.png";
                    }}
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
        allMedia={allMedia}
        currentIndex={selectedIndex}
        setCurrentIndex={setSelectedIndex}
        onClose={() => setSelectedIndex(null)}
        loadMoreItems={loadMoreModalItems}
        hasMore={hasMore}
        refreshMediaAfterDelete={handelRefreshMedia}
        updateMediaItem={updateMediaItem}
      ></MediaModal>
      <UploadButton
        handleClick={() => setModalOpen(true)}
        totalCount={totalCount}
      />
      <UploadModal
        isOpen={isModalOpen}
        onClose={handleModalClose} // Auto-refresh gallery
      />
    </>
  );
}
