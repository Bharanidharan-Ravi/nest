// MentionList.jsx
import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';

// Props (besides Tiptap suggestion props):
//   getId      → (item) => id stored on the mention node
//   getLabel   → (item) => label stored on the mention node
//   renderItem → (item) => text shown in the dropdown row (defaults to getLabel)
//   getBadge   → (item) => short tag shown before the row text (optional)

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Wrap every query word found in the text with <mark>
const Highlight = ({ text, query }) => {
  const tokens = String(query ?? '').trim().split(/\s+/).filter(Boolean);
  if (!text || tokens.length === 0) return text ?? null;

  const pattern = new RegExp(`(${tokens.map(escapeRegExp).join('|')})`, 'gi');
  return String(text)
    .split(pattern)
    .map((part, i) =>
      i % 2 === 1 ? <mark key={i} className="mention-match">{part}</mark> : part,
    );
};

const MentionList = forwardRef((props, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [prevQuery, setPrevQuery] = useState(props.query);
  const listRef = useRef(null);
  const renderItem = props.renderItem || props.getLabel;

  // New query → start again from the top result
  if (prevQuery !== props.query) {
    setPrevQuery(props.query);
    setSelectedIndex(0);
  }

  const maxIndex = Math.max(props.items.length - 1, 0);
  const activeIndex = Math.min(selectedIndex, maxIndex);

  // Keep the keyboard selection visible
  useEffect(() => {
    listRef.current
      ?.querySelector('.mention-item.is-selected')
      ?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex, props.items]);

  const selectItem = (index) => {
    const item = props.items[index];
    if (item) {
      // This sends the selected item back to Tiptap to insert into the editor
      props.command({
        id: props.getId(item),
        label: props.getLabel(item),
      });
    }
  };

  // Handle keyboard events from the editor
  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }) => {
      if (props.items.length === 0) {
        return false;
      }

      if (event.key === 'ArrowUp') {
        setSelectedIndex((activeIndex + props.items.length - 1) % props.items.length);
        return true;
      }
      if (event.key === 'ArrowDown') {
        setSelectedIndex((activeIndex + 1) % props.items.length);
        return true;
      }
      if (event.key === 'Enter' || event.key === 'Tab') {
        selectItem(activeIndex);
        return true;
      }
      return false;
    },
  }));

  return (
    <div className="mention-dropdown" ref={listRef}>
      {props.items.length > 0 ? (
        props.items.map((item, index) => {
          const badge = props.getBadge?.(item);
          return (
            <button
              type="button"
              className={`mention-item ${index === activeIndex ? 'is-selected' : ''}`}
              key={props.getId(item) ?? index}
              onMouseEnter={() => setSelectedIndex(index)}
              onMouseDown={(e) => e.preventDefault()} // keep editor focus
              onClick={() => selectItem(index)}
            >
              {badge && (
                <span className="mention-item-badge">
                  <Highlight text={badge} query={props.query} />
                </span>
              )}
              <span className="mention-item-text">
                <Highlight text={renderItem(item)} query={props.query} />
              </span>
            </button>
          );
        })
      ) : (
        <div className="mention-item no-result">No result</div>
      )}
    </div>
  );
});

MentionList.displayName = 'MentionList';
export default MentionList;
