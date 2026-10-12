// Card list.
//
// Rows are memoised (CardItem): when new data lands, only the rows whose item
// changed re-render, so a silent refresh doesn't repaint the whole list.
//
// Infinite lists (config.infinite) are rendered in chunks of one page
// (config.pageSize, 20): only the chunks on screen plus one above and one
// below are in the DOM (~60 cards). The others become empty blocks of their
// measured height, so the scroll position and scrollbar don't move. Scrolling
// back up re-renders them from memory, without a request.
// Server lists (showPages): the chunks on screen are reported and the list
// keeps 1 page above and 2 below them loaded (ticket list: pages 1-3 on
// open, at most 5 kept). Local lists: the next slice is shown when the end of
// the list comes within LOAD_AHEAD_PX of the viewport.

import {
  memo,
  startTransition,
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useList } from "../context/ListContext";
import { FiEdit } from "react-icons/fi";

// Chunks kept rendered above and below the ones on screen
const CHUNK_BUFFER = 1;
// Height guess for a card that was never rendered
const ESTIMATED_CARD_HEIGHT = 90;
// Next page is fetched when the list's end is this close below the viewport
const LOAD_AHEAD_PX = 200;

const DEFAULT_ITEM_CLASSES =
  "p-1.5 border-b border-ghBorder bg-white hover:bg-ghHover transition-colors duration-150 last:border-b-0 w-full overflow-hidden break-words relative cursor-pointer";

const CardItem = memo(function CardItem({ item, config, disabled, selected }) {
  const itemClasses = config.theme?.cardItem || DEFAULT_ITEM_CLASSES;
  const advanced = config.enableCardControls;

  const controls = advanced
    ? {
        disabled,
        renderCheckbox: config.enableSelection
          ? () => (
              <input
                type="checkbox"
                className="cursor-pointer w-4 h-4"
                defaultChecked={selected}
                onClick={(e) => {
                  e.stopPropagation();
                  config.onSelectionChange &&
                    config.onSelectionChange(item, e.target.checked);
                }}
              />
            )
          : null,

        renderEdit: config.enableEdit
          ? () => (
              <FiEdit
                className="cursor-pointer text-gray-500 hover:text-blue-600"
                onClick={(e) => {
                  e.stopPropagation();
                  config.onEditClick && config.onEditClick(item);
                }}
              />
            )
          : null,
      }
    : null;

  return (
    <div
      className={itemClasses}
      onClick={() => config.onItemClick && config.onItemClick(item)}
    >
      {/* OLD MODE CONTROLS */}
      {!advanced && config.enableSelection && (
        <div
          className="absolute left-3 top-2 flex items-center"
          onClick={(e) => e.stopPropagation()}
        >
          <input
            type="checkbox"
            className="cursor-pointer w-4 h-4"
            defaultChecked={selected}
            onChange={(e) =>
              config.onSelectionChange &&
              config.onSelectionChange(item, e.target.checked)
            }
          />
        </div>
      )}

      {!advanced && config.enableEdit && (
        <div
          className="absolute right-3 top-2 flex items-center"
          onClick={(e) => e.stopPropagation()}
        >
          <FiEdit
            onClick={(e) => {
              e.stopPropagation();
              config.onEditClick && config.onEditClick(item);
            }}
          />
        </div>
      )}

      {/* CARD CONTENT */}
      <div
        className={`w-full ${!advanced && config.enableSelection ? "pl-7" : ""}`}
      >
        {advanced
          ? config.cardRenderer(item, controls, config)
          : config.cardRenderer(item)}
      </div>
    </div>
  );
});

function renderCards(items, config) {
  return items.map((item, index) => (
    <CardItem
      key={item.id ?? item.issueId ?? index}
      item={item}
      config={config}
      disabled={config.disabledIds?.includes(item.id || item.issueId) || false}
      selected={config.selectedIds?.includes(item.id) || false}
    />
  ));
}

/** One page of cards; when hidden, an empty block of the same height. */
function CardChunk({ index, items, config, rendered, observer, height, onHeight }) {
  const ref = useRef(null);

  // Visibility is tracked for the chunk's block, rendered or not
  useEffect(() => {
    const node = ref.current;
    if (!node || !observer) return undefined;
    observer.observe(node);
    return () => observer.unobserve(node);
  }, [observer]);

  // Height while rendered, kept for the empty block once hidden
  useEffect(() => {
    const node = ref.current;
    if (!rendered || !node || typeof ResizeObserver === "undefined") return undefined;
    const ro = new ResizeObserver(() => {
      if (node.offsetHeight) onHeight(index, node.offsetHeight);
    });
    ro.observe(node);
    return () => ro.disconnect();
  }, [rendered, index, onHeight]);

  return (
    <div ref={ref} data-chunk={index} style={rendered ? undefined : { height }}>
      {rendered && renderCards(items, config)}
    </div>
  );
}

/**
 * false on mount, true once the browser has painted that first frame.
 * Opening a list (a tab or menu click) then paints the page around it at
 * once, and the cards render in the next task, outside the click's frame.
 */
function useAfterFirstPaint() {
  const [painted, setPainted] = useState(false);
  useEffect(() => {
    let timer;
    // rAF runs just before the paint, the timeout just after it
    const frame = requestAnimationFrame(() => {
      timer = setTimeout(() => setPainted(true));
    });
    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(timer);
    };
  }, []);
  return painted;
}

const sameSet = (a, b) => a.size === b.size && [...a].every((v) => b.has(v));

function WindowedCards({ data, config, hasMore, loadMore, showPages, pageOffset = 0 }) {
  const chunkSize = config.pageSize || 20;
  const [visible, setVisible] = useState(() => new Set([0]));
  const [heights, setHeights] = useState(() => new Map());

  // One observer for every chunk (none in old browsers / tests)
  const [observer] = useState(() =>
    typeof IntersectionObserver === "undefined"
      ? null
      : new IntersectionObserver((entries) => {
          setVisible((prev) => {
            const next = new Set(prev);
            entries.forEach((entry) => {
              const index = Number(entry.target.dataset.chunk);
              if (entry.isIntersecting) next.add(index);
              else next.delete(index);
            });
            return sameSet(next, prev) ? prev : next;
          });
        }),
  );
  useEffect(() => () => observer?.disconnect(), [observer]);

  const onHeight = useCallback((index, height) => {
    setHeights((prev) =>
      prev.get(index) === height ? prev : new Map(prev).set(index, height),
    );
  }, []);

  // Chunk index = page index in the whole list. Pages the server list dropped
  // above (pageOffset) stay as empty blocks of their measured height, so the
  // cards on screen don't move when a page is dropped or fetched again.
  const chunks = Array.from({ length: pageOffset }, () => null);
  for (let start = 0; start < data.length; start += chunkSize) {
    chunks.push(data.slice(start, start + chunkSize));
  }
  const lastChunk = chunks.length - 1;

  // Opening the list: first frame without cards (empty blocks of the
  // estimated height), then only the chunks on screen, then the buffer
  // chunks at low priority.
  const painted = useAfterFirstPaint();
  const [buffered, setBuffered] = useState(false);
  useEffect(() => {
    if (!painted) return undefined;
    const id = setTimeout(() => startTransition(() => setBuffered(true)));
    return () => clearTimeout(id);
  }, [painted]);
  const buffer = buffered ? CHUNK_BUFFER : 0;

  const isRendered = (index) => {
    if (!painted || !chunks[index]) return false;
    if (!observer) return true;
    for (let i = index - buffer; i <= index + buffer; i++) {
      if (visible.has(i)) return true;
    }
    return false;
  };

  // Next page only when the end of the list is near the viewport. (Paging on
  // "last chunk on screen" fetched pages 2 and 3 on open: page 1 is a single
  // chunk, and the top of page 2's chunk peeks in under 20 compact cards.)
  const sentinelRef = useRef(null);
  const [nearEnd, setNearEnd] = useState(false);
  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || typeof IntersectionObserver === "undefined") return undefined;
    const io = new IntersectionObserver(
      ([entry]) => setNearEnd(entry.isIntersecting),
      { rootMargin: `0px 0px ${LOAD_AHEAD_PX}px 0px` },
    );
    io.observe(node);
    return () => io.disconnect();
  }, []);
  // data.length: still near the end after a short page lands → next one
  useEffect(() => {
    if (!showPages && painted && nearEnd && hasMore) loadMore();
  }, [showPages, painted, nearEnd, hasMore, loadMore, data.length]);

  // Server lists: report the pages on screen; the list keeps the ones around
  // them loaded. (A chunk removed while on screen leaves its index in
  // `visible`: an unobserved node gets no "left the screen" entry.)
  let top = Infinity;
  let bottom = -1;
  visible.forEach((index) => {
    if (index > lastChunk) return;
    top = Math.min(top, index);
    bottom = Math.max(bottom, index);
  });
  // showPages changes once each page request ends → re-checked
  useEffect(() => {
    if (showPages && painted && bottom >= 0) showPages(top, bottom);
  }, [showPages, painted, top, bottom]);

  const measured = [...heights.values()];
  const chunkEstimate = measured.length
    ? measured.reduce((sum, h) => sum + h, 0) / measured.length
    : chunkSize * ESTIMATED_CARD_HEIGHT;

  return (
    <div>
      {chunks.map((items, index) => (
        <CardChunk
          key={index}
          index={index}
          items={items ?? []}
          config={config}
          rendered={isRendered(index)}
          observer={observer}
          // A never-rendered chunk: the average, scaled for a short last chunk
          height={
            heights.get(index) ??
            (chunkEstimate * (items?.length ?? chunkSize)) / chunkSize
          }
          onHeight={onHeight}
        />
      ))}
      <div ref={sentinelRef} aria-hidden="true" style={{ height: 1 }} />
    </div>
  );
}

function PlainCards({ data, config }) {
  const painted = useAfterFirstPaint();
  return <div>{painted && renderCards(data, config)}</div>;
}

export function ListCardView() {
  const { data: currentData, config, hasMore, loadMore, showPages, pageOffset, isStale } =
    useList();
  // A filter click paints the dropdown / chips at once; the cards follow as
  // interruptible background work instead of blocking that frame.
  // The rows and their page offset change together (a page dropped above)
  const current = useMemo(
    () => ({ data: currentData, pageOffset: pageOffset ?? 0 }),
    [currentData, pageOffset],
  );
  const shown = useDeferredValue(current);
  const { data } = shown;
  // Dim while other rows (a filter change) are pending, not for paging
  const dimmed =
    isStale ||
    (shown !== current &&
      shown.pageOffset === current.pageOffset &&
      data[0] !== currentData[0]);

  return (
    <div
      className={`transition-opacity duration-150 ${dimmed ? "opacity-50" : "opacity-100"}`}
    >
      {config.infinite ? (
        <WindowedCards
          data={data}
          config={config}
          hasMore={hasMore}
          loadMore={loadMore}
          showPages={showPages}
          pageOffset={shown.pageOffset}
        />
      ) : (
        <PlainCards data={data} config={config} />
      )}
    </div>
  );
}
