// MentionList.jsx
import React, { forwardRef, useEffect, useImperativeHandle, useState } from 'react';

const MentionList = forwardRef((props, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  // Reset selection when items change (e.g., when typing)
  useEffect(() => setSelectedIndex(0), [props.items]);

  // Handle keyboard events from the editor
  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }) => {
      if (event.key === 'ArrowUp') {
        setSelectedIndex((selectedIndex + props.items.length - 1) % props.items.length);
        return true;
      }
      if (event.key === 'ArrowDown') {
        setSelectedIndex((selectedIndex + 1) % props.items.length);
        return true;
      }
      if (event.key === 'Enter') {
        selectItem(selectedIndex);
        return true;
      }
      return false;
    },
  }));

  const selectItem = (index) => {
    const item = props.items[index];
    if (item) {
      // This sends the selected item back to Tiptap to insert into the editor
      props.command({ 
        id: item[props.idKey], 
        label: item[props.displayKey] 
      });
    }
  };

  return (
    <div className="mention-dropdown">
      {props.items.length > 0 ? (
        props.items.map((item, index) => (
          <button
            className={`mention-item ${index === selectedIndex ? 'is-selected' : ''}`}
            key={index}
            onClick={() => selectItem(index)}
          >
            {item[props.displayKey]}
          </button>
        ))
      ) : (
        <div className="mention-item no-result">No result</div>
      )}
    </div>
  );
});

MentionList.displayName = 'MentionList';
export default MentionList;