import React, { useEffect, useRef, useState } from "react";
import {
  useEditor,
  EditorContent,
  ReactNodeViewRenderer,
  NodeViewWrapper,
  ReactRenderer,
} from "@tiptap/react";
import tippy from "tippy.js";

import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Image from "@tiptap/extension-image";
import Mention from "@tiptap/extension-mention";
import Placeholder from "@tiptap/extension-placeholder";
import Table from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import Link from "@tiptap/extension-link";

import { Node, mergeAttributes } from "@tiptap/core";
import {
  FaBold,
  FaItalic,
  FaUnderline,
  FaListUl,
  FaListOl,
  FaUndo,
  FaRedo,
  FaImage,
  FaPaperclip,
  FaTable,
} from "react-icons/fa";

import "./AdvanceEditor.css";
import MentionList from "./MentionList/MentionList";

/* ===================================================
   FILE ATTACHMENT NODE (Unchanged)
=================================================== */

const FileAttachmentComponent = ({ node }) => {
  // ... (Keep existing FileAttachmentComponent code) ...
  return (
    <NodeViewWrapper as="span" className="file-wrapper" contentEditable={false}>
      <a
        href={node.attrs.src}
        target="_blank"
        rel="noopener noreferrer"
        className="file-chip bg-blue-100 text-blue-800 px-2 py-1 rounded inline-flex items-center gap-1 no-underline hover:bg-blue-200 cursor-pointer"
      >
        📎 {node.attrs.fileName}
      </a>
    </NodeViewWrapper>
  );
};

const FileAttachment = Node.create({
  // ... (Keep existing FileAttachment definition code) ...
  name: "fileAttachment",
  group: "inline",
  inline: true,
  atom: true,
  selectable: true,

  addAttributes() {
    return {
      src: { default: null },
      fileName: { default: "file" },
    };
  },

  parseHTML() {
    return [{ tag: 'a[data-type="file-attachment"]' }];
  },

  renderHTML({ node, HTMLAttributes }) {
    return [
      "a",
      mergeAttributes(HTMLAttributes, {
        "data-type": "file-attachment",
        href: node.attrs.src,
        target: "_blank",
      }),
      node.attrs.fileName,
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(FileAttachmentComponent);
  },
});

/* ===================================================
   GENERIC MENTION EXTENSION FACTORY
   ---------------------------------------------------
   A mention source describes one trigger. The editor knows nothing about
   what the items are — the app builds sources and passes them in.

   {
     char:       "#",                     // trigger character
     name:       "ticketMention",         // node name → saved as data-type
     items:      (query) => Item[] | Promise<Item[]>,
     getId:      (item) => id,            // saved as data-id
     getLabel:   (item) => string,        // saved as data-label
     renderItem: (item) => string,        // dropdown row text (optional)
     getBadge:   (item) => string,        // small tag before the row text (optional)
     renderText: ({ id, label, char }) => string, // chip text (optional)
     className:  "mention-ticket",        // chip class (optional)
     limit:      5,                       // max rows (optional)
     allowSpaces: false,                  // query may contain spaces (optional)
   }

   With allowSpaces the query runs to the end of the line, so the popup is
   hidden once a multi-word query stops matching and typing continues normally.

   Sources are read through a ref, so their data (e.g. `items`) may change
   between renders. The set of chars/names is fixed when the editor mounts.
=================================================== */
const defaultRenderText = ({ label, id, char }) => `${char}${label ?? id}`;

// Own trigger matcher for allowSpaces sources, so multi-word queries don't
// depend on Tiptap's built-in regex. Looks back from the cursor (same
// paragraph) for the nearest trigger char at line start / after whitespace.
// The query may contain single spaces; it ends on a double space, a newline,
// another trigger char, or once it grows past MAX_SPACED_QUERY.
const MAX_SPACED_QUERY = 60;

const findSpacedSuggestionMatch = ({ char, $position }) => {
  if (!$position.parent.isTextblock) return null;

  // Leaf nodes (chips, hard breaks) count as one char, keeping offsets aligned
  const textBefore = $position.parent.textBetween(
    0,
    $position.parentOffset,
    undefined,
    "￼",
  );

  const index = textBefore.lastIndexOf(char);
  if (index === -1) return null;

  const prefix = textBefore.charAt(index - 1);
  if (index > 0 && !/\s/.test(prefix)) return null; // e.g. "abc#1"

  const query = textBefore.slice(index + char.length);
  if (
    query.length > MAX_SPACED_QUERY ||
    /^\s/.test(query) || // "# " is not a mention
    /\s{2,}|\n|￼/.test(query)
  ) {
    return null;
  }

  const from = $position.start() + index;
  return {
    range: { from, to: $position.pos },
    query,
    text: char + query,
  };
};

const createMentionExtension = (sourcesRef, initialSource) => {
  const { char, name } = initialSource;
  // Always read the latest version of this source (data may have refreshed)
  const getSource = () =>
    sourcesRef.current.find((s) => s.name === name) || initialSource;

  const chipText = (node) =>
    (getSource().renderText || defaultRenderText)({
      id: node.attrs.id,
      label: node.attrs.label,
      char,
    });

  return Mention.extend({ name }).configure({
    HTMLAttributes: {
      class: initialSource.className || "mention-chip",
    },
    renderText: ({ node }) => chipText(node),
    renderHTML: ({ options, node }) => [
      "span",
      options.HTMLAttributes,
      chipText(node),
    ],
    suggestion: {
      char,
      allowSpaces: Boolean(initialSource.allowSpaces),
      ...(initialSource.allowSpaces && {
        findSuggestionMatch: findSpacedSuggestionMatch,
      }),
      // 1. Items come from the source (sync or async)
      items: async ({ query }) => {
        const source = getSource();
        const result = await source.items?.(query ?? "");
        return (Array.isArray(result) ? result : []).slice(
          0,
          source.limit ?? 5,
        );
      },
      // 2. Render logic to draw the dropdown using Tippy
      render: () => {
        let component;
        let popup;
        const listProps = () => {
          const source = getSource();
          return {
            getId: source.getId,
            getLabel: source.getLabel,
            renderItem: source.renderItem,
            getBadge: source.getBadge,
          };
        };

        // A multi-word query with no match means the user is just typing
        // text after a "#", so get out of the way instead of showing "No result"
        const shouldHide = (props) =>
          props.items.length === 0 && /\s/.test(props.query ?? "");

        let dismissed = false; // Escape keeps it closed until the next "#"

        const syncVisibility = (props) => {
          const instance = popup?.[0];
          if (!instance) return;
          if (dismissed || shouldHide(props)) instance.hide();
          else instance.show();
        };

        return {
          onStart: (props) => {
            dismissed = false;
            component = new ReactRenderer(MentionList, {
              props: { ...props, ...listProps() },
              editor: props.editor,
            });

            if (!props.clientRect) {
              return;
            }

            popup = tippy("body", {
              getReferenceClientRect: props.clientRect,
              appendTo: () => document.body,
              content: component.element,
              showOnCreate: !shouldHide(props),
              interactive: true,
              trigger: "manual",
              placement: "bottom-start",
              maxWidth: "none",
              duration: [120, 80],
              offset: [0, 6],
            });
          },
          onUpdate(props) {
            component.updateProps({ ...props, ...listProps() });

            if (!props.clientRect) {
              return;
            }

            popup?.[0]?.setProps({
              getReferenceClientRect: props.clientRect,
            });
            syncVisibility(props);
          },
          onKeyDown(props) {
            const instance = popup?.[0];
            if (props.event.key === "Escape") {
              dismissed = true;
              instance?.hide();
              return true;
            }
            // Hidden popup must not swallow Enter / arrows
            if (!instance?.state.isVisible) return false;
            return component.ref?.onKeyDown(props);
          },
          onExit() {
            popup?.[0]?.destroy();
            component?.destroy();
          },
        };
      },
    },
  });
};

// Back-compat sources for callers that still pass userList / labelList.
const buildFallbackSources = (userList = [], labelList = []) => {
  const activeByName = (list, key) => (query) =>
    list.filter(
      (item) =>
        item.Status === "Active" &&
        item[key]?.toLowerCase().includes(query.toLowerCase()),
    );

  return [
    {
      char: "@",
      name: "userMention",
      className: "mention-user",
      items: activeByName(userList, "UserName"),
      getId: (item) => item.UserID,
      getLabel: (item) => item.UserName,
    },
    {
      char: "~",
      name: "labelMention",
      className: "mention-label",
      items: activeByName(labelList, "LabelName"),
      getId: (item) => item.LabelID,
      getLabel: (item) => item.LabelName,
    },
  ];
};

/* ===================================================
   MAIN EDITOR
=================================================== */

const AdvancedEditor = ({
  name,
  value = "",
  onChange,
  uploadFile,
  onFileDelete,
  userList = [],
  labelList = [],
  mentionSources,
  resetKey,
  error,
  theme = {},
}) => {
  const fileInputRef = useRef(null);
  const [preview, setPreview] = useState(false);
  const [selectionBeforeUpload, setSelectionBeforeUpload] = useState(null);

  // FIX 2: State for Image Modal
  const [modalImage, setModalImage] = useState(null);

  const previousMediaRef = useRef([]);
  // Explicit mentionSources win; otherwise fall back to userList / labelList
  const resolvedSources = mentionSources || buildFallbackSources(userList, labelList);
  // Trigger set is fixed at mount; data is kept fresh through the ref
  const [initialSources] = useState(resolvedSources);
  const sourcesRef = useRef(resolvedSources);

  useEffect(() => {
    sourcesRef.current = resolvedSources;
  }, [resolvedSources]);

  const extractMediaUrls = (editorInstance) => {
    const urls = [];
    editorInstance.state.doc.descendants((node) => {
      if (node.type.name === "image" || node.type.name === "fileAttachment") {
        if (node.attrs.src) urls.push(node.attrs.src);
      }
    });
    return urls;
  };
  /* ===================================================
      🔥 FIXED HELPER: Process and Insert Files
   =================================================== */
  const processAndInsertFiles = async (files, insertPos = null) => {
    if (!editor || files.length === 0) return;

    try {
      // 1. Upload all files at the exact same time (Parallel)
      const uploadPromises = files.map(async (file) => {
        const publicUrl = await uploadFile(file);
        return { file, publicUrl };
      });

      const uploadedResults = await Promise.all(uploadPromises);

      // 2. Build an array of all the nodes we want to insert
      const contentToInsert = uploadedResults.map(({ file, publicUrl }) => {
        if (file.type.startsWith("image/")) {
          return {
            type: "image",
            attrs: { src: publicUrl },
          };
        } else {
          return {
            type: "fileAttachment",
            attrs: { src: publicUrl, fileName: file.name },
          };
        }
      });

      // 🔥 FIX: Add an empty paragraph at the end so the cursor has a place to blink
      // and it automatically creates space after the images.
      contentToInsert.push({ type: "paragraph" });

      // 3. Insert all of them at once!
      if (contentToInsert.length > 0) {
        let chain = editor.chain().focus();

        if (insertPos !== null) {
          chain = chain.setTextSelection(insertPos);
        }

        chain.insertContent(contentToInsert).run();
      }
    } catch (error) {
      console.error("Failed to upload multiple files:", error);
    }
  };

  const editor = useEditor({
    content: value,
    autofocus: true,
    extensions: [
      StarterKit,
      Underline,
      Placeholder.configure({
        placeholder: "Write a comment...",
      }),
      Image,
      Link,
      Table.configure({ resizable: true }),
      TableRow,
      TableCell,
      TableHeader,
      FileAttachment,
      ...initialSources.map((source) =>
        createMentionExtension(sourcesRef, source),
      ),
    ],
    onCreate: ({ editor }) => {
      previousMediaRef.current = extractMediaUrls(editor);
    },
    onUpdate: ({ editor }) => {
      // Trigger parent onChange
      onChange?.(name, editor.getHTML());

      // 🔥 5. Compare current media to previous media to detect deletions
      const currentMediaUrls = extractMediaUrls(editor);
      const previousMediaUrls = previousMediaRef.current;

      // Find URLs that were in the previous state but are missing now
      const deletedUrls = previousMediaUrls.filter(
        (url) => !currentMediaUrls.includes(url),
      );

      if (deletedUrls.length > 0 && onFileDelete) {
        deletedUrls.forEach((url) => {
          onFileDelete(url); // Trigger API call for each deleted file
        });
      }

      // Update the ref for the next keystroke/update
      previousMediaRef.current = currentMediaUrls;
    },
    editorProps: {
      handleDrop: (view, event, slice, moved) => {
        if (!moved && event.dataTransfer?.files?.length) {
          event.preventDefault();
          const files = Array.from(event.dataTransfer.files);

          // Get exact cursor drop coordinates
          const coordinates = view.posAtCoords({
            left: event.clientX,
            top: event.clientY,
          });
          const dropPos = coordinates ? coordinates.pos : null;

          // Call our new helper
          processAndInsertFiles(files, dropPos);
          return true;
        }
        return false;
      },

      handlePaste: (view, event) => {
        const items = Array.from(event.clipboardData?.items || []);
        const fileItems = items.filter((item) => item.kind === "file");
        if (fileItems.length === 0) return false; // Let TipTap handle it if there are no files

        if (fileItems.length > 0) {
          event.preventDefault();
          const files = fileItems
            .map((item) => item.getAsFile())
            .filter(Boolean);
          const insertPos = view.state.selection.anchor;
          processAndInsertFiles(files, insertPos);
          return true; // We handled the paste event
        }
      },
    },
    handleClick: (view, pos, event) => {
      if (event.target && event.target.tagName === "IMG") {
        setModalImage(event.target.src);
        return true; // Tells TipTap we handled this click
      }
      return false;
    },
  });
  /* ===================================================
     RESET SUPPORT
  =================================================== */
  // useEffect(() => {
  //   if (editor && value) {
  //     // Check if the editor's current content is different from the incoming value.
  //     // This prevents the cursor from jumping to the end of the line while the user is actively typing.
  //     if (editor.getHTML() !== value) {
  //       editor.commands.setContent(value);
  //     }
  //   }
  // }, [editor, value]);
  // useEffect(() => {
  //   if (editor && resetKey !== undefined) {
  //     editor.commands.setContent("");
  //   }
  // }, [resetKey]);
  useEffect(() => {
    if (!editor) return;

    // 1. Handle Form Reset: If value is empty/undefined, clear the editor
    if (!value) {
      if (!editor.isEmpty) {
        editor.commands.setContent("");
      }
      return;
    }

    // 2. Handle External Updates (e.g., loading saved data):
    // Only update if the content actually differs from what is currently in the editor
    if (editor.getHTML() !== value) {
      editor.commands.setContent(value);
    }
  }, [editor, value]);

  /* ===================================================
     🔥 UPDATED: File Select Upload (Button Click)
  =================================================== */

  // 1. Helper to save selection before opening file dialog
  const triggerFileUpload = () => {
    if (editor) {
      // Save the current cursor position/selection
      setSelectionBeforeUpload(editor.state.selection);
    }
    fileInputRef.current.click();
  };

  // 2. Handle file selection from dialog
  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    // Restore saved selection if it exists, so insertion happens at original cursor pos
    if (selectionBeforeUpload) {
      editor.commands.setTextSelection(selectionBeforeUpload);
      setSelectionBeforeUpload(null); // Clear after use
    }

    // Process files (position will default to current restored selection)
    await processAndInsertFiles(files);

    // Reset input for next use
    e.target.value = "";
  };

  if (!editor) return null;
  // const theme = theme.theme || {};
  // 1. A helper function to keep the button code clean
  const ToolbarButton = ({
    onClick,
    isActive,
    disabled,
    children,
    title,
    customClass = "",
  }) => (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`p-1.5 rounded-md flex items-center justify-center transition-colors ${
        isActive
          ? "bg-gray-300 text-gray-900"
          : "text-gray-600 hover:bg-gray-200 hover:text-gray-900 bg-transparent"
      } ${disabled ? "opacity-50 cursor-not-allowed" : ""} ${customClass}`}
    >
      {children}
    </button>
  );
  return (
    <>
      <div
        className={
          error
            ? `border rounded-md border-red-300`
            : theme.editorContainer || "border border-gray-300 rounded-md"
        }
      >
        {/* GitHub Style Toolbar: Transparent background, bottom border, flex layout */}
        <div
          className={
            theme.editorToolbar ||
            "flex flex-wrap items-center gap-1 p-2 border-b bg-gray-50"
          }
        >
          {/* ... (Keep existing toolbar buttons: bold, italic, etc.) ... */}
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            isActive={editor.isActive("bold")}
          >
            <FaBold />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            isActive={editor.isActive("italic")}
          >
            <FaItalic />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            isActive={editor.isActive("underline")}
          >
            <FaUnderline />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            isActive={editor.isActive("bulletList")}
          >
            <FaListUl />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            isActive={editor.isActive("orderedList")}
          >
            <FaListOl />
          </ToolbarButton>

          {/* Table Module */}
          <ToolbarButton
            onClick={() =>
              editor
                .chain()
                .focus()
                .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
                .run()
            }
          >
            <FaTable /> Insert
          </ToolbarButton>
          <div className="w-px h-5 bg-gray-300 mx-1"></div>

          {editor.isActive("table") ? (
            // Show simplified table controls when active
            <div className="flex items-center gap-1 text-xs font-medium text-ghMuted">
              <button
                onClick={() => editor.chain().focus().addColumnBefore().run()}
                className="hover:text-ghText"
              >
                Add Col
              </button>
              <span className="text-gray-300">|</span>
              <button
                onClick={() => editor.chain().focus().addRowAfter().run()}
                className="hover:text-ghText"
              >
                Add Row
              </button>
              <span className="text-gray-300">|</span>
              <button
                onClick={() => editor.chain().focus().deleteTable().run()}
                className="text-red-500 hover:text-red-700"
              >
                Del Table
              </button>
            </div>
          ) : (
            <ToolbarButton
              onClick={() =>
                editor
                  .chain()
                  .focus()
                  .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
                  .run()
              }
              title="Insert Table"
            >
              <FaTable size={14} />
            </ToolbarButton>
          )}
          <div className="w-px h-5 bg-gray-300 mx-1"></div>
          {/* 🔥 UPDATED: Use triggerFileUpload instead of direct click */}
          <ToolbarButton onClick={triggerFileUpload}>
            <FaPaperclip />
          </ToolbarButton>
          <ToolbarButton onClick={triggerFileUpload}>
            <FaImage />
          </ToolbarButton>

          {/* ... (Keep Undo/Redo/Preview buttons) ... */}
          <ToolbarButton
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
          >
            <FaUndo />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
          >
            <FaRedo />
          </ToolbarButton>
          <ToolbarButton onClick={() => setPreview(!preview)}>
            {preview ? "Edit" : "Preview"}
          </ToolbarButton>
        </div>

        <div
          className="p-3 min-h-[150px] text-sm text-ghText"
          onClick={(e) => {
            // If the clicked element is an image, open the modal
            if (e.target && e.target.tagName === "IMG") {
              setModalImage(e.target.src);
            }
          }}
        >
          {preview ? (
            <div
              className="preview-mode ProseMirror"
              dangerouslySetInnerHTML={{ __html: editor.getHTML() }}
            />
          ) : (
            <EditorContent editor={editor} />
          )}
        </div>

        <input
          type="file"
          multiple
          ref={fileInputRef}
          style={{ display: "none" }}
          onChange={handleFileChange}
        />
        {modalImage && (
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-80 cursor-pointer"
            onClick={() => setModalImage(null)}
          >
            <img
              src={modalImage}
              alt="Expanded view"
              className="max-w-[90vw] max-h-[90vh] object-contain shadow-2xl rounded"
            />
            {/* Close Button */}
            <button
              className="absolute top-4 right-4 text-white text-4xl font-bold hover:text-gray-300"
              onClick={() => setModalImage(null)}
            >
              &times;
            </button>
          </div>
        )}
      </div>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </>
  );
};

export default AdvancedEditor;
