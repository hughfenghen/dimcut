import { type Component } from "solid-js";
import type { Item } from "./types.ts";
import { ITEM_COLORS, OVERLAY_AUDIO_COLOR, ROW_ITEM_HEIGHT } from "./constants.ts";

export interface TrackItemProps {
  item: Item;
  left: number;
  width: number;
  isMainTrack?: boolean;
  onDragStart?: (e: MouseEvent, item: Item) => void;
}

export const TrackItem: Component<TrackItemProps> = (props) => {
  const color = () => {
    if (props.item.type === "audio" && !props.isMainTrack) {
      return OVERLAY_AUDIO_COLOR;
    }
    return ITEM_COLORS[props.item.type] ?? "#999";
  };

  const handleMouseDown = (e: MouseEvent) => {
    if (props.isMainTrack) return;
    props.onDragStart?.(e, props.item);
  };

  return (
    <div
      class="absolute rounded-sm overflow-hidden select-none"
      style={{
        left: `${props.left}px`,
        width: `${props.width}px`,
        height: `${ROW_ITEM_HEIGHT}px`,
        "background-color": color(),
        cursor: props.isMainTrack ? "default" : "grab",
      }}
      onMouseDown={handleMouseDown}
    >
      {props.item.type === "text" && (
        <span
          class="px-1 text-xs leading-8 text-white truncate block"
        >
          {(props.item as { text: string }).text}
        </span>
      )}
    </div>
  );
};
