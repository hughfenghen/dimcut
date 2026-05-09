import {
  type Component,
  For,
  Show,
  createSignal,
  createMemo,
  createEffect,
  on,
  onCleanup,
} from "solid-js";
import type {
  DeletedRange,
  Item,
  RowItemSlice,
  RowLayout,
  TimelineProps,
} from "./types.ts";
import { DEFAULT_PIXELS_PER_SECOND, TIME_LABEL_WIDTH } from "./constants.ts";
import { computeRows, assignItemsToRows, packItemsInRow } from "./layout.ts";
import { pixelToTime } from "./time-utils.ts";
import { mergeDeletedRanges } from "./time-utils.ts";
import { TimelineRow } from "./TimelineRow.tsx";
import { ThumbnailExtractor } from "./thumbnail-extractor.ts";
import { WaveformExtractor } from "./waveform-extractor.ts";

export const Timeline: Component<TimelineProps> = (props) => {
  const pps = () => props.pixelsPerSecond ?? DEFAULT_PIXELS_PER_SECOND;

  const totalDuration = () =>
    props.initData.mainTrackConf.item.endTime -
    props.initData.mainTrackConf.item.startTime;

  const [items, setItems] = createSignal<Item[]>(props.initData.items);
  const [deletedRanges, setDeletedRanges] = createSignal<DeletedRange[]>(
    props.initData.deletedRanges ?? [],
  );

  createEffect(
    on(
      () => props.initData.items,
      (externalItems) => {
        const current = items();
        const currentById = new Map(current.map((it) => [it.id, it]));
        const externalIds = new Set(externalItems.map((it) => it.id));

        const removed = current.filter((it) => !externalIds.has(it.id));
        const added = externalItems.filter((it) => !currentById.has(it.id));

        if (removed.length === 0 && added.length === 0) return;

        const next = current
          .filter((it) => externalIds.has(it.id))
          .concat(added);
        setItems(next);
      },
    ),
  );

  const emitChange = (
    nextItems = items(),
    nextDeletedRanges = deletedRanges(),
  ) => {
    props.onChange?.({
      mainTrackConf: props.initData.mainTrackConf,
      items: nextItems,
      deletedRanges: nextDeletedRanges,
    });
  };

  const [containerWidth, setContainerWidth] = createSignal(800);
  let containerRef: HTMLDivElement | undefined;

  const setupResizeObserver = (el: HTMLDivElement) => {
    containerRef = el;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });
    observer.observe(el);
    onCleanup(() => observer.disconnect());
  };

  const rows = createMemo(() =>
    computeRows(totalDuration(), containerWidth(), pps()),
  );

  const mainTrackItem = () => props.initData.mainTrackConf.item;

  const itemsByRow = createMemo(() => assignItemsToRows(items(), rows()));

  const mainSlicesByRow = createMemo(() => {
    const mainItem = mainTrackItem();
    const fakeItems: Item[] = [mainItem as Item];
    return assignItemsToRows(fakeItems, rows());
  });

  const layersByRow = createMemo(() => {
    const result = new Map<number, RowItemSlice[][]>();
    for (const row of rows()) {
      const slices = itemsByRow().get(row.rowIndex) ?? [];
      result.set(row.rowIndex, packItemsInRow(slices));
    }
    return result;
  });

  // --- Thumbnail extractor ---
  const [extractor, setExtractor] = createSignal<
    ThumbnailExtractor | undefined
  >();

  createEffect(
    on(
      () => props.initData.mainTrackConf.item,
      (item) => {
        // Dispose previous extractor
        extractor()?.dispose();
        setExtractor(undefined);

        if (item.type === "video" && "file" in item) {
          const ext = new ThumbnailExtractor(item.file);
          ext.init().then(() => setExtractor(ext));
        }
      },
    ),
  );

  onCleanup(() => {
    extractor()?.dispose();
  });

  // --- Waveform extractor ---
  const [waveformExt, setWaveformExt] = createSignal<
    WaveformExtractor | undefined
  >();

  createEffect(
    on(
      () => props.initData.mainTrackConf.item,
      (item) => {
        waveformExt()?.dispose();
        setWaveformExt(undefined);

        if ("file" in item) {
          const ext = new WaveformExtractor(item.file);
          ext.init().then(() => setWaveformExt(ext));
        }
      },
    ),
  );

  onCleanup(() => {
    waveformExt()?.dispose();
  });

  // --- Overlay audio waveform extractors ---
  const [itemWaveformExtractors, setItemWaveformExtractors] = createSignal<
    Map<string, WaveformExtractor>
  >(new Map());

  createEffect(
    on(items, (currentItems) => {
      const prev = itemWaveformExtractors();
      const next = new Map<string, WaveformExtractor>();

      for (const item of currentItems) {
        if (item.type === "audio" && "file" in item) {
          const existing = prev.get(item.id);
          if (existing) {
            next.set(item.id, existing);
          } else {
            const ext = new WaveformExtractor((item as any).file);
            ext.init().then(() => {
              setItemWaveformExtractors((m) => {
                if (!m.has(item.id)) return m;
                const updated = new Map(m);
                updated.set(item.id, ext);
                return updated;
              });
            });
            next.set(item.id, ext);
          }
        }
      }

      for (const [id, ext] of prev) {
        if (!next.has(id)) {
          ext.dispose();
        }
      }

      setItemWaveformExtractors(next);
    }),
  );

  onCleanup(() => {
    for (const [, ext] of itemWaveformExtractors()) {
      ext.dispose();
    }
  });

  // --- Drag state (id-based) ---
  const [dragItemId, setDragItemId] = createSignal<string | null>(null);
  const [dragStartMouseTime, setDragStartMouseTime] = createSignal(0);
  const [dragOrigStart, setDragOrigStart] = createSignal(0);
  const [dragDuration, setDragDuration] = createSignal(0);

  const handleItemDragStart = (e: MouseEvent, item: Item) => {
    e.preventDefault();
    setDragItemId(item.id);
    setDragStartMouseTime(mouseToTime(e.clientX, e.clientY));
    setDragOrigStart(item.startTime);
    setDragDuration(item.endTime - item.startTime);

    // Clear any active selection when starting a drag
    setHasSelection(false);

    const startX = e.clientX;
    const startY = e.clientY;
    let moved = false;

    const onMove = (me: MouseEvent) => {
      const dx = me.clientX - startX;
      const dy = me.clientY - startY;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
        moved = true;
      }
      if (!moved) return;
      const id = dragItemId();
      if (!id) return;
      const currentMouseTime = mouseToTime(me.clientX, me.clientY);
      const dt = currentMouseTime - dragStartMouseTime();
      const dur = dragDuration();
      let newStart = dragOrigStart() + dt;
      newStart = Math.max(0, Math.min(newStart, totalDuration() - dur));
      const newItems = items().map((it) =>
        it.id === id
          ? { ...it, startTime: newStart, endTime: newStart + dur }
          : it,
      );
      setItems(newItems as Item[]);
      emitChange(newItems as Item[]);
    };

    const onUp = () => {
      setDragItemId(null);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      // If no drag happened, treat as seek
      if (!moved && props.onSeek) {
        const time = mouseToTime(startX, startY);
        props.onSeek(time);
      }
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  // --- Selection state ---
  const [selectionStart, setSelectionStart] = createSignal(0);
  const [selectionEnd, setSelectionEnd] = createSignal(0);
  const [isSelecting, setIsSelecting] = createSignal(false);
  const [hasSelection, setHasSelection] = createSignal(false);
  const [selectionSource, setSelectionSource] = createSignal<
    "media" | "asr" | null
  >(null);

  const selectionRange = createMemo(() => {
    if (!isSelecting() && !hasSelection()) return null;
    const s = Math.min(selectionStart(), selectionEnd());
    const e = Math.max(selectionStart(), selectionEnd());
    if (e - s < 0.01) return null;
    return { start: s, end: e };
  });

  const handleAsrSelectionChange = () => {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || sel.rangeCount === 0) {
      if (selectionSource() === "asr") {
        setHasSelection(false);
        setSelectionSource(null);
      }
      return;
    }

    const range = sel.getRangeAt(0);
    const startNode = range.startContainer;
    const endNode = range.endContainer;

    const startEl =
      startNode instanceof HTMLElement
        ? startNode.closest("[data-asr-word]")
        : (startNode.parentElement?.closest("[data-asr-word]") ?? null);
    const endEl =
      endNode instanceof HTMLElement
        ? endNode.closest("[data-asr-word]")
        : (endNode.parentElement?.closest("[data-asr-word]") ?? null);

    if (!startEl || !endEl) {
      if (selectionSource() === "asr") {
        setHasSelection(false);
        setSelectionSource(null);
      }
      return;
    }

    const startTime = parseFloat(
      startEl.getAttribute("data-asr-word-start") ?? "0",
    );
    const endTime = parseFloat(endEl.getAttribute("data-asr-word-end") ?? "0");

    if (endTime - startTime < 0.001) return;

    setSelectionSource("asr");
    setSelectionStart(startTime);
    setSelectionEnd(endTime);
    setIsSelecting(false);
    setHasSelection(true);
  };

  document.addEventListener("selectionchange", handleAsrSelectionChange);
  onCleanup(() =>
    document.removeEventListener("selectionchange", handleAsrSelectionChange),
  );

  // Convert mouse position to global time using row DOM elements
  const mouseToTime = (clientX: number, clientY: number): number => {
    if (!containerRef) return 0;
    const rowEls =
      containerRef.querySelectorAll<HTMLElement>("[data-row-index]");
    const currentRows = rows();
    if (rowEls.length === 0 || currentRows.length === 0) return 0;

    // Find which row the mouse is in
    let targetRow: RowLayout | undefined;
    let targetEl: HTMLElement | undefined;

    for (let i = 0; i < rowEls.length; i++) {
      const rect = rowEls[i].getBoundingClientRect();
      if (clientY >= rect.top && clientY <= rect.bottom) {
        targetRow = currentRows[i];
        targetEl = rowEls[i];
        break;
      }
    }

    // Clamp to first/last row if mouse is above/below
    if (!targetRow) {
      const firstRect = rowEls[0].getBoundingClientRect();
      const lastRect = rowEls[rowEls.length - 1].getBoundingClientRect();
      if (clientY < firstRect.top) {
        targetRow = currentRows[0];
        targetEl = rowEls[0];
      } else if (clientY > lastRect.bottom) {
        targetRow = currentRows[currentRows.length - 1];
        targetEl = rowEls[rowEls.length - 1];
      } else {
        targetRow = currentRows[0];
        targetEl = rowEls[0];
      }
    }

    // Find the content area (skip time label)
    const contentEl =
      targetEl!.querySelector<HTMLElement>("[data-row-content]");
    if (!contentEl) return targetRow.startTime;

    const contentRect = contentEl.getBoundingClientRect();
    const px = Math.max(0, clientX - contentRect.left);
    const time = pixelToTime(px, targetRow.startTime, pps());
    return Math.max(0, Math.min(time, totalDuration()));
  };

  const handleRangeSelectStart = (e: MouseEvent, rowStartTime: number) => {
    window.getSelection()?.removeAllRanges();
    const contentEl = e.currentTarget as HTMLElement;
    const rect = contentEl.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const time = pixelToTime(px, rowStartTime, pps());
    const clampedTime = Math.max(0, Math.min(time, totalDuration()));

    const startX = e.clientX;
    const startY = e.clientY;

    setSelectionStart(clampedTime);
    setSelectionEnd(clampedTime);
    setIsSelecting(true);
    setHasSelection(false);
    setSelectionSource("media");

    let moved = false;

    const onMove = (me: MouseEvent) => {
      const dx = me.clientX - startX;
      const dy = me.clientY - startY;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
        moved = true;
      }
      const t = mouseToTime(me.clientX, me.clientY);
      setSelectionEnd(t);
    };

    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      setIsSelecting(false);

      const s = Math.min(selectionStart(), selectionEnd());
      const end = Math.max(selectionStart(), selectionEnd());
      if (end - s >= 0.1) {
        setHasSelection(true);
      } else {
        setHasSelection(false);
        // If no drag happened, treat as seek
        if (!moved && props.onSeek) {
          props.onSeek(clampedTime);
        }
      }
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  const handleRemoveDeletedRange = (range: DeletedRange) => {
    const nextDeletedRanges = deletedRanges().filter((r) => r !== range);
    setDeletedRanges(nextDeletedRanges);
    emitChange(items(), nextDeletedRanges);
  };

  const handleDeleteSelection = () => {
    const sel = selectionRange();
    if (!sel) return;
    const merged = mergeDeletedRanges([
      ...deletedRanges(),
      { start: sel.start, end: sel.end },
    ]);
    setDeletedRanges(merged);
    emitChange(items(), merged);
    setHasSelection(false);
    setSelectionSource(null);
    window.getSelection()?.removeAllRanges();
  };

  // Compute floating menu position
  const menuPosition = createMemo(() => {
    const sel = selectionRange();
    if (!sel || !hasSelection() || !containerRef) return null;

    const containerRect = containerRef.getBoundingClientRect();

    if (selectionSource() === "asr") {
      const domSel = window.getSelection();
      if (!domSel || domSel.rangeCount === 0) return null;
      const rangeRect = domSel.getRangeAt(0).getBoundingClientRect();
      return {
        x: rangeRect.left + rangeRect.width / 2 - containerRect.left,
        y: rangeRect.top - containerRect.top,
      };
    }

    const currentRows = rows();
    let lastOverlapRowIdx = -1;
    for (let i = 0; i < currentRows.length; i++) {
      const row = currentRows[i];
      if (sel.end > row.startTime && sel.start < row.endTime) {
        lastOverlapRowIdx = i;
      }
    }
    if (lastOverlapRowIdx < 0) return null;

    let firstOverlapRowIdx = -1;
    for (let i = 0; i < currentRows.length; i++) {
      const row = currentRows[i];
      if (sel.end > row.startTime && sel.start < row.endTime) {
        firstOverlapRowIdx = i;
        break;
      }
    }

    const rowEls =
      containerRef.querySelectorAll<HTMLElement>("[data-row-index]");
    if (firstOverlapRowIdx < 0 || firstOverlapRowIdx >= rowEls.length)
      return null;

    const firstRowEl = rowEls[firstOverlapRowIdx];
    const rowRect = firstRowEl.getBoundingClientRect();

    const firstRow = currentRows[firstOverlapRowIdx];
    const selStartInRow = Math.max(sel.start, firstRow.startTime);
    const selEndInRow = Math.min(sel.end, firstRow.endTime);
    const leftPx =
      (selStartInRow - firstRow.startTime) * pps() + TIME_LABEL_WIDTH;
    const rightPx =
      (selEndInRow - firstRow.startTime) * pps() + TIME_LABEL_WIDTH;
    const centerX = (leftPx + rightPx) / 2;
    let topY = rowRect.top - containerRect.top;

    const asrEl = firstRowEl.querySelector(
      "[data-asr-track]",
    ) as HTMLSpanElement | null;
    if (asrEl) {
      topY += asrEl.offsetHeight;
    }

    return { x: centerX, y: topY };
  });

  // Handle click outside selection to clear it
  const handleContainerMouseDown = (e: MouseEvent) => {
    // If clicking on the menu itself, don't clear
    const target = e.target as HTMLElement;
    if (target.closest("[data-selection-menu]")) return;
  };

  return (
    <div
      ref={setupResizeObserver}
      class="w-full select-none relative"
      onMouseDown={handleContainerMouseDown}
    >
      <For each={rows()}>
        {(row) => {
          const mainSlices = () => mainSlicesByRow().get(row.rowIndex) ?? [];
          const mainSlice = () => mainSlices()[0];
          const overlayLayers = () => layersByRow().get(row.rowIndex) ?? [];

          return (
            <div class="border-b border-gray-200" data-row-index={row.rowIndex}>
              <TimelineRow
                row={row}
                mainTrackSlice={mainSlice()}
                layers={overlayLayers()}
                asrData={props.initData.mainTrackConf.asrData}
                deletedRanges={deletedRanges()}
                pixelsPerSecond={pps()}
                onItemDragStart={handleItemDragStart}
                onRemoveDeletedRange={handleRemoveDeletedRange}
                onRangeSelectStart={handleRangeSelectStart}
                selectionRange={selectionRange() ?? undefined}
                thumbnailExtractor={extractor()}
                waveformExtractor={waveformExt()}
                itemWaveformExtractors={itemWaveformExtractors()}
                currentTime={props.currentTime}
                onSeek={props.onSeek}
                showAsrTrack={props.showAsrTrack}
                showMediaTracks={props.showMediaTracks}
              />
            </div>
          );
        }}
      </For>

      {/* Playhead indicator */}
      <Show when={props.currentTime !== undefined && props.showMediaTracks}>
        <For each={rows()}>
          {(row) => {
            const time = () => props.currentTime!;
            const isInRow = () =>
              time() >= row.startTime && time() < row.endTime;
            return (
              <Show when={isInRow()}>
                {(() => {
                  const leftPx = () =>
                    (time() - row.startTime) * pps() + TIME_LABEL_WIDTH;
                  const rowEl = () =>
                    containerRef?.querySelector<HTMLElement>(
                      `[data-row-index="${row.rowIndex}"]`,
                    );
                  const contentEl = () =>
                    rowEl()?.querySelector<HTMLElement>("[data-row-content]");
                  const top = () => {
                    const el = rowEl();
                    const ce = contentEl();
                    if (!el || !containerRef || !ce) return 0;
                    const mtTop = parseFloat(
                      ce.getAttribute("data-main-track-top") ?? "0",
                    );
                    return el.offsetTop + mtTop;
                  };
                  const height = () => {
                    const el = rowEl();
                    const ce = contentEl();
                    if (!el) return 0;
                    const mtTop = ce
                      ? parseFloat(
                          ce.getAttribute("data-main-track-top") ?? "0",
                        )
                      : 0;
                    return el.offsetHeight - mtTop;
                  };
                  return (
                    <div
                      class="absolute top-0 w-[2px] bg-red-500 pointer-events-none z-50"
                      style={{
                        left: `${leftPx()}px`,
                        top: `${top()}px`,
                        height: `${height()}px`,
                      }}
                    />
                  );
                })()}
              </Show>
            );
          }}
        </For>
      </Show>

      {/* Floating selection menu */}
      <Show when={hasSelection() && menuPosition()}>
        {(pos) => (
          <div
            data-selection-menu
            class="absolute z-[100] flex items-center gap-1 bg-white border border-gray-300 rounded-md shadow-lg px-1 py-0.5"
            style={{
              left: `${pos().x}px`,
              top: `${pos().y}px`,
              transform: "translate(-50%, -100%) translateY(-4px)",
            }}
          >
            {/* Default delete button */}
            <button
              class="w-7 h-7 flex items-center justify-center rounded hover:bg-red-50 text-gray-600 hover:text-red-500"
              title="删除区间"
              onClick={handleDeleteSelection}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                class="w-4 h-4"
              >
                <path
                  fill-rule="evenodd"
                  d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.519.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z"
                  clip-rule="evenodd"
                />
              </svg>
            </button>

            {/* Custom menu items */}
            <For each={props.selectionMenuItems ?? []}>
              {(menuItem) => (
                <button
                  class="w-7 h-7 flex items-center justify-center rounded hover:bg-gray-100 text-gray-600"
                  title={menuItem.label}
                  onClick={() => {
                    const sel = selectionRange();
                    if (sel) {
                      menuItem.onClick(sel);
                      setHasSelection(false);
                    }
                  }}
                >
                  {menuItem.icon()}
                </button>
              )}
            </For>
          </div>
        )}
      </Show>
    </div>
  );
};
