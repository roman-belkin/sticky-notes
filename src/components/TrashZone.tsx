import type { RefObject } from "react";
import styles from "./TrashZone.module.css";

interface TrashZoneProps {
  active: boolean;
  zoneRef: RefObject<HTMLDivElement | null>;
}

export function TrashZone({ active, zoneRef }: TrashZoneProps) {
  const className = active ? `${styles.zone} ${styles.active}` : styles.zone;
  return (
    <div ref={zoneRef} className={className} data-trash aria-label="Trash">
      <span className={styles.label}>Trash</span>
      <span className={styles.hint}>
        {active ? "Release to delete" : "Drop a note here to delete it"}
      </span>
    </div>
  );
}
