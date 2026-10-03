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
// The next page is requested as soon as the last chunk comes on screen, so it
// is usually loaded before the user reaches the end of the list.

import { memo, useCallback, useEffect, useRef, useState } from "react";
import { useList } from "../context/ListContext";
import { FiEdit } from "react-icons/fi";

// Chunks kept rendered above and below the ones on screen
const CHUNK_BUFFER = 1;
// Height guess for a card that was never rendered
const ESTIMATED_CARD_HEIGHT = 90;

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

const sameSet = (a, b) => a.size === b.size && [...a].every((v) => b.has(v));

function WindowedCards({ data, config, hasMore, loadMore }) {
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

  const chunks = [];
  for (let start = 0; start < data.length; start += chunkSize) {
    chunks.push(data.slice(start, start + chunkSize));
  }
  const lastChunk = chunks.length - 1;

  const isRendered = (index) => {
    if (!observer) return true;
    for (let i = index - CHUNK_BUFFER; i <= index + CHUNK_BUFFER; i++) {
      if (visible.has(i)) return true;
    }
    return false;
  };

  // Load ahead: the last chunk is on screen → fetch the page after it
  const lastOnScreen = visible.has(lastChunk);
  useEffect(() => {
    if (lastOnScreen && hasMore) loadMore();
  }, [lastOnScreen, hasMore, loadMore, lastChunk]);

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
          items={items}
          config={config}
          rendered={isRendered(index)}
          observer={observer}
          // A never-rendered chunk: the average, scaled for a short last chunk
          height={heights.get(index) ?? (chunkEstimate * items.length) / chunkSize}
          onHeight={onHeight}
        />
      ))}
    </div>
  );
}

export function ListCardView() {
  const { data, config, hasMore, loadMore } = useList();

  if (config.infinite) {
    return (
      <WindowedCards
        data={data}
        config={config}
        hasMore={hasMore}
        loadMore={loadMore}
      />
    );
  }

  return <div>{renderCards(data, config)}</div>;
}
