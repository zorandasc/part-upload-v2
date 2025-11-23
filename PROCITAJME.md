# VIDEO NOT FOUND WHEN UPLOAD BUG:
# -------------------------------------------------------------
POLL EVERY 10S FOR VIDEO TO CHECK IF VIDEO IS READY TO STREAM.
FOR VIDEO TO BE READY TO STREAM, MUST BE:
- CLOUDFLARE MUST SET FLAG readyToStream TO TRUE
- CDN NETWORK MUST POBAGATE CONTEN

THIS API IS CALLED INSIDE usEFFECT HOOK BY MediaModal.jsx COMPONENT,
AND IT WILL CHECK:
IF CLOUDFLARE IS READYTOSTREMA
AND IF CDN NETWORK IS PROPAGATED

```js
const res = await fetch(`/api/get-media-state/${mediaInfo._id}`);
```

IF IT IS READY:
Tell parent gallery to update that one item
BECAUSE Modal IS NOT PAGE AND IT CLOSE WILL NOT TRIGER AllGallery refresh
updateMediaItem(mediaInfo._id, { readyToStream: true });

//AFTER MODAL INTERVAL DETECT VIDEO IS READY TO STREAM
  //UPDATE THAT ITEM IN ALL GALLERY
  //JER KAD MODAL DETEKTUJE DA VIDEO READY BAZA CE BITI UPDEJTOVANA
  //ALI LOKALNO STANJE NECE JER NEMA REFRESHA, MODAL JE DIO ALL-PAGE.
INSIDE ALLGALERY PAGE:
```js
 const updateMediaItem = (id, updatedFields) => {
    setAllMedia((prev) =>
      prev.map((item) =>
        item._id === id ? { ...item, ...updatedFields } : item
      )
    );
  };
  ```
INSIDE api/get-media-state/[id]:

 // Only poll Cloudflare if  FALSE in DB,not ready yet,
 ```js
    if (!mediaInDb.readyToStream) {
      //1. Get readyToStream FROM CLOUDFLARE
      const cfStatus = await getCloudflareVideoStatus(mediaInDb.mediaId);

      console.log("cfStatus.readyToStrea", cfStatus.readyToStream);

      if (cfStatus.readyToStream && cfStatus.status === "ready") {
        //2. Before marking ready, probe CDN availability
        // CHANGED: Probe the HLS manifest, not the iframe HTML
        // The manifest is the source of truth for playback
        const manifestUrl = `https://videodelivery.net/${mediaInDb.mediaId}/manifest/video.m3u8`;
         try {
          // 2. Probe
          const probe = await fetch(manifestUrl, { method: "HEAD" });

          if (probe.ok) {
            console.log("✅ CDN fully propagated (Video + Thumb)");
            //if BOTH CLOUDFLARE AND CDN NETWORK true
            //THEN UPDTE IN DB AND RESPONSe

            //TRY TO ENABLE VIDOE TO BE DOWLOADABLE
            await enableCloudflareVideoDownload(mediaInDb.mediaId);
```

# INFINITE SCROLL LAG BUG
# --------------------------------------------------------------------------------

Currently, your IntersectionObserver only fires when the user hits the exact pixel of the last element. This forces the user to wait for the network request.

The Fix: Add a rootMargin to the observer. This tells the browser: "Trigger the fetch when the user is 500px AWAY from the bottom." This way, the data loads before the user actually scrolls to it.

```js
const lastMediaRef = useCallback(
    (node) => {
      if (loading || !hasMore) return;
      if (observer.current) observer.current.disconnect();

      observer.current = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && hasMore) {
            setPage((prev) => prev + 1);
          }
        },
        {
          // ✅ IMPORTANT: This triggers fetch when user is within 
          // 200px) of the bottom.
          // The user will likely never see the loading spinner.
          rootMargin: "200px", 
        }
      );
```
Why you MUST Index createdAt
Your API route has this line:

JavaScript

.sort({ createdAt: -1 })
Without an index, MongoDB performs a COLLSCAN (Collection Scan).

It goes to the disk.

It reads every single document in your media collection into memory.

It sorts them in memory.

Only then does it apply .skip() and .limit().

With 60 items: You won't notice a difference. With 1,000+ items: The query will become noticeably slow (100ms+). With 10,000+ items: Your CPU will spike, and the query might take seconds.

With an Index: MongoDB creates a sorted list in the background. When you ask for "Page 1", it just grabs the first 20 pointers from that list. It is instant, regardless of how many items you have.

How to do it in Mongo Atlas:
Go to your Cluster -> Browse Collections.

Select the party database and media collection.

Click the Indexes tab.

Click Create Index.

In the fields box, type:

JSON
```json
{ "createdAt": -1 }
```

CSS OPTIMIZACIJA:

```css
.imageContainer {
  width: 100%;
  position: relative;
  border-radius: 8px; /* 12px is huge for small mobile columns */
  overflow: hidden;
  
  /* ✅ 1. MODERN ASPECT RATIO */
  /* Replaces padding-top: 100%. Tells browser EXACT height immediately. */
  aspect-ratio: 1 / 1; 
  
  /* ✅ 2. SKELETON BACKGROUND */
  /* User sees this gray box while image is downloading */
  background-color: #e0e0e0; 
  
  /* ✅ 3. PERFORMANCE BOOST */
  /* Tells browser: "If this is off-screen, don't worry about rendering it perfectly" */
  /* This significantly reduces lag on lists with 100+ items */
  content-visibility: auto; 
  contain: paint;

  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);

  /* Animation setup */
  opacity: 0;
  transform: scale(0.9); /* 0.8 is a bit too dramatic */
  animation: popIn 0.4s ease-out forwards;
}
```

ANIMATION OPTIMIZATION:

I wanted to keep  style={{ animationDelay: `${i * 0.1}s` }} but it seams dellay gets bigger. How to keep animation ?

```js
{allMedia?.map((item, i) => {
          const isLast = i === allMedia.length - 1;
          
          // ✅ 1. Get the delay base value (0.1s)
          const DELAY_INCREMENT = 0.1;
          
          // ✅ 2. Calculate the local index for the current batch (assuming limit=20)
          // For the first 20 items (i=0 to 19), localIndex = i.
          // For the next 20 items (i=20 to 39), localIndex = i % 20 (i.e., 0 to 19).
          const localIndex = i % 20; 
          
          // ✅ 3. Calculate the total animation delay
          const delay = `${localIndex * DELAY_INCREMENT}s`;
          
          return (
            <div
              key={item._id}
              className={styles.imageContainer}
              // Use the newly calculated 'delay'
              style={{ animationDelay: delay }} 
              onClick={() => setSelectedIndex(i)}
              ref={isLast ? lastMediaRef : null}
            >
              {/* ... rest of your Image/Video code ... */}
            </div>
          );
        })}
```

CSS OPTIMIZATION FO ANIMATION

```css
/* page.module.css */
.imageContainer {
  /* ... existing styles ... */
  
  /* Apply animation delay ONLY on initial appearance */
  animation: popIn 0.4s ease-out forwards;
  
  /* ✅ OPTIMIZATION: Stop the animation after it finishes once */
  animation-fill-mode: forwards;
}

@keyframes popIn {
  0% {
    transform: scale(0.9);
    opacity: 0;
  }
  100% {
    transform: scale(1);
    opacity: 1;
    /* ✅ OPTIMIZATION: Add visibility: visible to ensure it stays */
    visibility: visible; 
  }
}
```

# HANDLE DELETE OF MEDIA INISIDE MODAL
# ------------------------------------------------------------------------

MediaModal.jsx inputs:

```js
export default function MediaModal({
  allMedia,
  currentIndex,
  setCurrentIndex,
  onClose,
  loadMoreItems,
  hasMore,
  //function to update allgalery item when item deleted
  refreshMediaAfterDelete,
  //function to update allgalery item when video ready to stream
  updateMediaItem,
}) {

```

```js
const handleDelete = async () => {

     const res = await fetch("/api/delete-media", {

         // ✅ re-fetch (REFRESH) parent befor MODAL close
      await refreshMediaAfterDelete(mediaInfo);
```

ALL GALLERY page.jsx:

```js
//AFTER MODAL DELETE,
  //REMOVE FROM LOCALSTORAGE LIKED STORED IN CONTEXT
  //AND REFETCH ALL
  const handelRefreshMedia = async (mediaInfo) => {
    const liked = isLiked(mediaInfo?._id);
    if (liked) handleLiked(mediaInfo);
    await fetchAllMedia();
  };

```

# SCROLING TO THE END IN MODDAL VIEW:
# -----------------------------------------------------------------

```js
  const handleNextItem = async () => {
    if (currentIndex < allMedia.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else if (hasMore) {
      await loadMoreItems();
      setCurrentIndex((prev) => prev + 1);
    }
  };
```
IN ALLGAALLERY PAGE.JSX:

```js
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
```