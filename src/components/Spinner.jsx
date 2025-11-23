import styles from "./spinner.module.css";

export default function Spinner({ fullScreen = false }) {
  // If fullScreen is true, use .overlay. Otherwise use .inline
  const containerClass = fullScreen ? styles.overlay : styles.inline;
  
  // If fullScreen, make it large. If inline, make it small.
  const sizeClass = fullScreen ? styles.large : styles.small;

  return (
    <div className={containerClass}>
      <div className={`${styles.spinner} ${sizeClass}`}></div>
    </div>
  );
}
