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
    <NodeViewWrapper as="span" className="file-wrapper">
      <a
        href={node.attrs.src}
        target="_blank"
        rel="noopener noreferrer"
        className="file-chip"
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
   UPDATED MENTION EXTENSION FACTORY (Unchanged)
=================================================== */
// ... (Keep existing createMentionExtension code) ...
const createMentionExtension = (
  listsRef,
  trigger,
  listKey,
  displayKey,
  idKey,
) => {
  return Mention.extend({
    name: trigger === "@" ? "userMention" : "labelMention",
  }).configure({
    HTMLAttributes: {
      class: trigger === "@" ? "mention-user" : "mention-label",
    },
    suggestion: {
      char: trigger,
      // 1. Filter logic using dynamic displayKey
      items: ({ query }) => {
        const currentList = listsRef.current[listKey] || [];
        return currentList
          .filter((item) =>
            item[displayKey]?.toLowerCase().includes(query.toLowerCase()),
          )
          .slice(0, 5);
      },
      // 2. Render logic to draw the dropdown using Tippy
      render: () => {
        let component;
        let popup;

        return {
          onStart: (props) => {
            component = new ReactRenderer(MentionList, {
              // Pass the keys so MentionList knows what to display
              props: { ...props, displayKey, idKey },
              editor: props.editor,
            });

            if (!props.clientRect) {
              return;
            }

            popup = tippy("body", {
              getReferenceClientRect: props.clientRect,
              appendTo: () => document.body,
              content: component.element,
              showOnCreate: true,
              interactive: true,
              trigger: "manual",
              placement: "bottom-start",
            });
          },
          onUpdate(props) {
            component.updateProps({ ...props, displayKey, idKey });

            if (!props.clientRect) {
              return;
            }

            popup[0].setProps({
              getReferenceClientRect: props.clientRect,
            });
          },
          onKeyDown(props) {
            if (props.event.key === "Escape") {
              popup[0].hide();
              return true;
            }
            return component.ref?.onKeyDown(props);
          },
          onExit() {
            popup[0].destroy();
            component.destroy();
          },
        };
      },
    },
  });
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
  resetKey,
}) => {
  const fileInputRef = useRef(null);
  const [preview, setPreview] = useState(false);
  // 🔥 NEW: State to remember cursor position before clicking upload button
  const [selectionBeforeUpload, setSelectionBeforeUpload] = useState(null);
  const previousMediaRef = useRef([]);
  const listsRef = useRef({ users: userList, labels: labelList });

  useEffect(() => {
    listsRef.current = { users: userList, labels: labelList };
  }, [userList, labelList]);
  // 🔥 3. Helper to extract all image/file URLs from the current editor state
  const extractMediaUrls = (editorInstance) => {
    const urls = [];
    editorInstance.state.doc.descendants((node) => {
      // 🔥 2. Remove the console.log from here to stop the console spam
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
      createMentionExtension(listsRef, "@", "users", "UserName", "UserID"),
      createMentionExtension(listsRef, "#", "labels", "LabelName", "LabelID"),
    ],
    onCreate: ({ editor }) => {
      previousMediaRef.current = extractMediaUrls(editor);
    },
    onUpdate: ({ editor }) => {
      // Trigger parent onChange
      onChange?.(name, editor.getHTML());


      // 🔥 5. Compare current media to previous media to detect deletions
      const currentMediaUrls = extractMediaUrls(editor);
      console.log("itest trigger :", currentMediaUrls);
      const previousMediaUrls = previousMediaRef.current;

      // Find URLs that were in the previous state but are missing now
      const deletedUrls = previousMediaUrls.filter(
        (url) => !currentMediaUrls.includes(url)
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
    },
  });
  /* ===================================================
     RESET SUPPORT
  =================================================== */

  useEffect(() => {
    if (editor && resetKey !== undefined) {
      editor.commands.setContent("");
    }
  }, [resetKey]);

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

  return (
    <div className="editor-container">
      {/* Toolbar */}
      <div className="toolbar">
        {/* ... (Keep existing toolbar buttons: bold, italic, etc.) ... */}
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={editor.isActive("bold") ? "is-active" : ""}
        >
          <FaBold />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={editor.isActive("italic") ? "is-active" : ""}
        >
          <FaItalic />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={editor.isActive("underline") ? "is-active" : ""}
        >
          <FaUnderline />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={editor.isActive("bulletList") ? "is-active" : ""}
        >
          <FaListUl />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={editor.isActive("orderedList") ? "is-active" : ""}
        >
          <FaListOl />
        </button>

        {/* Table Module */}
        <button
          onClick={() =>
            editor
              .chain()
              .focus()
              .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
              .run()
          }
        >
          <FaTable /> Insert
        </button>

        {editor.isActive("table") && (
          <>
            <button
              onClick={() => editor.chain().focus().addColumnBefore().run()}
            >
              Add Col Before
            </button>
            <button
              onClick={() => editor.chain().focus().addColumnAfter().run()}
            >
              Add Col After
            </button>
            <button onClick={() => editor.chain().focus().deleteColumn().run()}>
              Del Col
            </button>
            <button onClick={() => editor.chain().focus().addRowBefore().run()}>
              Add Row Before
            </button>
            <button onClick={() => editor.chain().focus().addRowAfter().run()}>
              Add Row After
            </button>
            <button onClick={() => editor.chain().focus().deleteRow().run()}>
              Del Row
            </button>
            <button onClick={() => editor.chain().focus().deleteTable().run()}>
              Del Table
            </button>
          </>
        )}

        {/* 🔥 UPDATED: Use triggerFileUpload instead of direct click */}
        <button onClick={triggerFileUpload}>
          <FaPaperclip />
        </button>
        <button onClick={triggerFileUpload}>
          <FaImage />
        </button>

        {/* ... (Keep Undo/Redo/Preview buttons) ... */}
        <button
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
        >
          <FaUndo />
        </button>
        <button
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
        >
          <FaRedo />
        </button>
        <button onClick={() => setPreview(!preview)}>
          {preview ? "Edit" : "Preview"}
        </button>
      </div>

      {preview ? (
        <div
          className="preview-mode ProseMirror"
          dangerouslySetInnerHTML={{ __html: editor.getHTML() }}
        />
      ) : (
        <EditorContent editor={editor} />
      )}

      <input
        type="file"
        multiple
        ref={fileInputRef}
        style={{ display: "none" }}
        onChange={handleFileChange}
      />
    </div>
  );
};

export default AdvancedEditor;
