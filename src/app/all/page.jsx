"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import MediaGallery from "@/components/MediaGallery";
import UploadButton from "@/components/UploadButton";
import UploadModal from "@/components/UploadModal";
import Spinner from "@/components/Spinner";

export default function All() {
  const [allMedia, setAllMedia] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const [isModalOpen, setModalOpen] = useState(false);

  const observer = useRef();

  //useCallback memorize the function so it doesnot get recreated on every render
  //which is important because react will attach thi asa a ref to the last image
  //DEPENDENCIE [loadine, hasmore] will update function
  const lastMediaRef = useCallback(
    (node) => {
      //While allMedia are currently being loaded, we don’t want to trigger another page load.
      //Stops the observer from being set up while a fetch is in progress.
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

  //to stabilize it and avoid unnecessary effect triggers:
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

  useEffect(() => {
    fetchAllMedia();
  }, [fetchAllMedia]);

  useEffect(() => {
    if (page === 1) window.scrollTo({ top: 0, behavior: "smooth" });
  }, [allMedia]);

  // Handler called when UploadModal is closed after upload
  const handleModalClose = () => {
    setModalOpen(false);
    setAllMedia([]);
    if (page === 1) {
      //AKO SMO VEC NA PAGE 1 SAMO REFECTH ALL
      fetchAllMedia(); // re-fetch immediately
    } else {
      //AKO NISMO VRATI SE NA POCETAK I PKAZI NOVI UNOS NA VRHU
      setPage(1); // triggers useEffect normally
    }
  };

  return (
    <>
      <MediaGallery
        allMedia={allMedia}
        loading={loading}
        lastMediaRef={lastMediaRef}
      />
      {loading && <Spinner />}
      <UploadButton handleClick={() => setModalOpen(true)} />
      <UploadModal
        isOpen={isModalOpen}
        onClose={handleModalClose} // Auto-refresh gallery
      />
    </>
  );
}
