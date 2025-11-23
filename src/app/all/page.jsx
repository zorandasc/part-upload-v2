"use client";

import styles from "./page.module.css";
import { useState, useEffect, useRef, useCallback } from "react";
import { TbPlayerPlayFilled } from "react-icons/tb";
import { MdOutlineNoPhotography } from "react-icons/md";
import Image from "next/image";
import { useLikedContext } from "@/context/LikedContext";
import {
  getImageBlurThumb,
  getImageUrl,
  getVideoBlurThumb,
  getVideoThumbnail,
} from "@/lib/helper";
import MediaModal from "@/components/MediaModal";
import UploadButton from "@/components/UploadButton";
import UploadModal from "@/components/UploadModal";
import Spinner from "@/components/Spinner";

export default function All() {
  const [allMedia, setAllMedia] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
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
      observer.current = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && hasMore) {
            //this automatically triggers your useEffect(fetchAllMedia)
            setPage((prev) => prev + 1);
          }
        },
        {
          //Add rootMargin to load BEFORE user hits bottom
          // ✅ IMPORTANT: This triggers fetch when user is within
          // 1000px (approx 2-3 screen heights) of the bottom.
          // The user will likely never see the loading spinner.
          rootMargin: "150px",//MAYBE ALSO 200px
        }
      );

      //Observe the node
      /*node is the actual DOM element passed by React when this ref is attached.
      Only attach the observer if the element exists.
      This is usually the last image in your gallery, so when the user scrolls to it, the callback fires */
      if (node) observer.current.observe(node);
    },
    [loading, hasMore]
  );

  //useCallback to stabilize it and avoid unnecessary effect triggers:
  const fetchAllMedia = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/get-all-media?page=${page}&limit=20`);
      const data = await res.json();

      setAllMedia((prev) => {
        //If page 1, replace. If page > 1, append.
        const newFiles = page === 1 ? data.files : [...prev, ...data.files];
        // Optional: Filter duplicates based on _id just to be safe
        return Array.from(
          new Map(newFiles.map((item) => [item._id, item])).values()
        );
      });
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
      //this will triger useEffect(fetchAllMedia)
      setPage((p) => p + 1);
      //BUT Wait for loading da bude false
      //odnsono da fetchAllMedia to complete
      const interval = setInterval(() => {
        if (!loading) {
          clearInterval(interval);
          //then resolve
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
  //JER KAD MODAL DETEKTUJE DA VIDEO READY BAZA CE BITI UPDEJTOVANA
  //ALI LOKALNO STANJE NECE JER NEMA REFRESHA, MODAL JE DIO ALL-PAGE.
  const updateMediaItem = (id, updatedFields) => {
    setAllMedia((prev) =>
      prev.map((item) =>
        item._id === id ? { ...item, ...updatedFields } : item
      )
    );
  };

  useEffect(() => {
    return () => {
      if (observer.current) observer.current.disconnect();
    };
  }, []);

  useEffect(() => {
    fetchAllMedia();
  }, [fetchAllMedia]);

  useEffect(() => {
    if (page === 1) window.scrollTo({ top: 0, behavior: "smooth" });
  }, [allMedia, page]);

  
  return (
    <>
      {/*Only show full screen spinner on Initial Load (Page 1) */}
      {loading && page === 1 && allMedia.length === 0 && (
        <Spinner fullScreen={true} />
      )}
      <section className={styles.uploadedImages}>
        {!loading && allMedia?.length === 0 && (
          <div className={styles.noContent}>
            <MdOutlineNoPhotography />
            Nema sadržaja.
          </div>
        )}
        {allMedia?.map((item, i) => {
          //determin last media file so we can attach observer
          const isLast = i === allMedia.length - 1;

          //FOR ANIMATION
          const DELAY_INCREMENT = 0.1;
          // For the next 20 items (i=20 to 39), localIndex = i % 20 (i.e., 0 to 19)
          // For the first 20 items (i=0 to 19), localIndex = i.
          //FOR ANIMATION
          const localIndex = i % 20;

          //Calculate the total animation delay
          const delay = `${localIndex * DELAY_INCREMENT}s`;
          return (
            <div
              key={`${item._id}-${i}`}
              className={styles.imageContainer}
              style={{ animationDelay: delay }}
              onClick={() => setSelectedIndex(i)}
              ref={isLast ? lastMediaRef : null} // attach observer on last media file
            >
              {item.contentType === "video" ? (
                <>
                  <Image
                    //priority
                    src={getVideoThumbnail(item.mediaId)}
                    onError={(e) => {
                      e.currentTarget.src = "/logo.png";
                    }}
                    alt={item.name || "Video thumbnail"}
                    fill
                    placeholder="blur"
                    blurDataURL={getVideoBlurThumb(item.mediaId)}
                    className={styles.image}
                    sizes="100%"
                  />
                  <div className={styles.videoBadge}>
                    <TbPlayerPlayFilled />
                  </div>
                </>
              ) : (
                <Image
                  //priority
                  src={getImageUrl(item.mediaId)}
                  alt={item.name || "Image"}
                  fill
                  placeholder="blur"
                  blurDataURL={getImageBlurThumb(item.mediaId)}
                  className={styles.image}
                  sizes="100%"
                />
              )}
            </div>
          );
        })}
      </section>
      {/*Show a small loading indicator at the BOTTOM for pages > 1 */}
      {loading && page > 1 && <Spinner fullScreen={false} />}

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
