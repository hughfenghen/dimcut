import { type Component, Show, createSignal } from "solid-js";
import type { DeletedRange as DeletedRangeType } from "./types.ts";
import { DELETED_RANGE_COLOR } from "./constants.ts";
import { timeToPixel } from "./time-utils.ts";

export interface DeletedRangeProps {
  range: DeletedRangeType;
  rowStartTime: number;
  rowEndTime: number;
  pixelsPerSecond: number;
  rowHeight: number;
  onRemove?: (range: DeletedRangeType) => void;
}

export const DeletedRangeOverlay: Component<DeletedRangeProps> = (props) => {
  const [hovered, setHovered] = createSignal(false);

  const visibleStart = () => Math.max(props.range.start, props.rowStartTime);
  const visibleEnd = () => Math.min(props.range.end, props.rowEndTime);

  const left = () =>
    timeToPixel(visibleStart(), props.rowStartTime, props.pixelsPerSecond);
  const width = () =>
    timeToPixel(visibleEnd(), props.rowStartTime, props.pixelsPerSecond) - left();

  return (
    <div
      class="absolute top-0 z-50"
      style={{
        left: `${left()}px`,
        width: `${width()}px`,
        height: `${props.rowHeight}px`,
        "background-color": DELETED_RANGE_COLOR,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <Show when={hovered() && props.onRemove}>
        <button
          class="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center hover:bg-red-600"
          onClick={(e) => {
            e.stopPropagation();
            props.onRemove?.(props.range);
          }}
        >
          ×
        </button>
      </Show>
    </div>
  );
};
