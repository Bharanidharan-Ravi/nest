// MentionList.jsx
import React, { forwardRef, useImperativeHandle, useState } from 'react';

const MentionList = forwardRef((props, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const maxIndex = Math.max(props.items.length - 1, 0);
  const activeIndex = Math.min(selectedIndex, maxIndex);

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

  // Handle keyboard events from the editor
  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }) => {
      if (props.items.length === 0) {
        return false;
      }

      if (event.key === 'ArrowUp') {
        setSelectedIndex((prev) => (prev + props.items.length - 1) % props.items.length);
        return true;
      }
      if (event.key === 'ArrowDown') {
        setSelectedIndex((prev) => (prev + 1) % props.items.length);
        return true;
      }
      if (event.key === 'Enter') {
        selectItem(activeIndex);
        return true;
      }
      return false;
    },
  }));

  return (
    <div className="mention-dropdown">
      {props.items.length > 0 ? (
        props.items.map((item, index) => (
          <button
            className={`mention-item ${index === activeIndex ? 'is-selected' : ''}`}
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
