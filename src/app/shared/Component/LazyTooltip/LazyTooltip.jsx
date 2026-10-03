// Drop-in for MUI <Tooltip> in long lists.
//
// A closed MUI Tooltip still runs its hooks and emotion styles on every
// render; a ticket card has ~7 of them, so a page of cards mounted hundreds.
// This renders only the child until it is first hovered or focused, then
// mounts the real Tooltip next to it, anchored on the child. The child stays
// in place (not wrapped), so its DOM and state are never remounted.

import { cloneElement, useState } from "react";
import { Tooltip } from "@mui/material";

export default function LazyTooltip({ children, title, ...tooltipProps }) {
  const [anchor, setAnchor] = useState(null);
  const [open, setOpen] = useState(false);
  const hasTitle = typeof title === "number" || !!title;

  const show = (e) => {
    setAnchor(e.currentTarget);
    setOpen(true);
  };
  const hide = () => setOpen(false);

  const child = hasTitle
    ? cloneElement(children, {
        onMouseEnter: (e) => {
          children.props.onMouseEnter?.(e);
          show(e);
        },
        onMouseLeave: (e) => {
          children.props.onMouseLeave?.(e);
          hide();
        },
        onFocus: (e) => {
          children.props.onFocus?.(e);
          show(e);
        },
        onBlur: (e) => {
          children.props.onBlur?.(e);
          hide();
        },
      })
    : children;

  return (
    <>
      {child}
      {hasTitle && anchor && (
        <Tooltip
          {...tooltipProps}
          title={title}
          open={open}
          disableHoverListener
          disableFocusListener
          disableTouchListener
          PopperProps={{ ...tooltipProps.PopperProps, anchorEl: anchor }}
        >
          <span style={{ display: "none" }} />
        </Tooltip>
      )}
    </>
  );
}
