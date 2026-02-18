"use client";

import { cn } from "@helvety/shared/utils";
import { Button } from "@helvety/ui/button";
import { Separator } from "@helvety/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@helvety/ui/tooltip";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  BoldIcon,
  ItalicIcon,
  UnderlineIcon,
  StrikethroughIcon,
  Heading1Icon,
  Heading2Icon,
  Heading3Icon,
  PilcrowIcon,
  ListIcon,
  ListOrderedIcon,
  LinkIcon,
  MessageSquarePlusIcon,
  Undo2Icon,
  Redo2Icon,
} from "lucide-react";
import { useCallback, useEffect, useImperativeHandle, type Ref } from "react";

import type { Editor, JSONContent } from "@tiptap/react";

/** Props for the Tiptap rich-text editor. */
export interface TiptapEditorProps {
  /** Initial content as ProseMirror JSON */
  content?: JSONContent | null;
  /** Callback when content changes */
  onChange?: (content: JSONContent) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Whether the editor is disabled */
  disabled?: boolean;
  /** Additional class names for the editor container */
  className?: string;
  /** Whether to auto-focus the editor */
  autoFocus?: boolean;
  /** Ref to access imperative editor methods */
  ref?: Ref<TiptapEditorRef>;
}

/** Imperative handle exposed by the Tiptap editor via ref. */
export interface TiptapEditorRef {
  /** Get current content as JSON */
  getJSON: () => JSONContent | undefined;
  /** Set content from JSON */
  setContent: (content: JSONContent | string | null) => void;
  /** Focus the editor */
  focus: () => void;
  /** Get the editor instance */
  getEditor: () => Editor | null;
}

/**
 * Toolbar button component
 */
function ToolbarButton({
  onClick,
  isActive,
  disabled,
  tooltip,
  children,
}: {
  onClick: () => void;
  isActive?: boolean;
  disabled?: boolean;
  tooltip: string;
  children: React.ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onClick}
          disabled={disabled}
          className={cn(
            "text-muted-foreground hover:text-foreground h-7 w-7 p-0",
            isActive && "bg-accent/50 text-foreground"
          )}
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom" sideOffset={5}>
        {tooltip}
      </TooltipContent>
    </Tooltip>
  );
}

/**
 * Editor toolbar with formatting buttons
 */
function EditorToolbar({
  editor,
  disabled,
}: {
  editor: Editor | null;
  disabled?: boolean;
}) {
  const setLink = useCallback(() => {
    if (!editor) return;

    const previousUrl = editor.getAttributes("link").href;
    const url = window.prompt("Enter URL", previousUrl);

    if (url === null) return;

    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }

    // Block unsafe URL schemes to prevent stored XSS (javascript:, data:, vbscript:, etc.)
    const SAFE_URL_PATTERN = /^(https?:\/\/|mailto:|tel:)/i;
    if (!SAFE_URL_PATTERN.test(url)) {
      return;
    }

    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }, [editor]);

  const insertComment = useCallback(() => {
    if (!editor) return;

    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, "0");
    const timestamp = `${pad(now.getDate())}.${pad(now.getMonth() + 1)}.${now.getFullYear()} ${pad(now.getHours())}:${pad(now.getMinutes())}`;

    editor
      .chain()
      .focus("end")
      .insertContent([
        { type: "paragraph" },
        { type: "horizontalRule" },
        {
          type: "heading",
          attrs: { level: 4 },
          content: [{ type: "text", text: `Comment ${timestamp}` }],
        },
        { type: "paragraph" },
      ])
      .focus()
      .run();
  }, [editor]);

  if (!editor) {
    return null;
  }

  return (
    <TooltipProvider delayDuration={300}>
      <div className="border-border/40 bg-muted/20 flex flex-wrap items-center gap-0.5 rounded-t-md border-b px-1.5 py-0.5 opacity-30 transition-opacity duration-200 focus-within:opacity-100 hover:opacity-100">
        {/* Undo / Redo */}
        <ToolbarButton
          onClick={() => editor.chain().focus().undo().run()}
          // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- boolean OR is intentional
          disabled={disabled || !editor.can().undo()}
          tooltip="Undo"
        >
          <Undo2Icon className="size-3.5" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().redo().run()}
          // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- boolean OR is intentional
          disabled={disabled || !editor.can().redo()}
          tooltip="Redo"
        >
          <Redo2Icon className="size-3.5" />
        </ToolbarButton>

        <Separator orientation="vertical" className="mx-1 h-4 opacity-30" />

        {/* Text formatting */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          isActive={editor.isActive("bold")}
          disabled={disabled}
          tooltip="Bold"
        >
          <BoldIcon className="size-3.5" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          isActive={editor.isActive("italic")}
          disabled={disabled}
          tooltip="Italic"
        >
          <ItalicIcon className="size-3.5" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          isActive={editor.isActive("underline")}
          disabled={disabled}
          tooltip="Underline"
        >
          <UnderlineIcon className="size-3.5" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleStrike().run()}
          isActive={editor.isActive("strike")}
          disabled={disabled}
          tooltip="Strikethrough"
        >
          <StrikethroughIcon className="size-3.5" />
        </ToolbarButton>

        <Separator orientation="vertical" className="mx-1 h-4 opacity-30" />

        {/* Headings */}
        <ToolbarButton
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 1 }).run()
          }
          isActive={editor.isActive("heading", { level: 1 })}
          disabled={disabled}
          tooltip="Heading 1"
        >
          <Heading1Icon className="size-3.5" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
          isActive={editor.isActive("heading", { level: 2 })}
          disabled={disabled}
          tooltip="Heading 2"
        >
          <Heading2Icon className="size-3.5" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 3 }).run()
          }
          isActive={editor.isActive("heading", { level: 3 })}
          disabled={disabled}
          tooltip="Heading 3"
        >
          <Heading3Icon className="size-3.5" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setParagraph().run()}
          isActive={
            editor.isActive("paragraph") &&
            !editor.isActive("bulletList") &&
            !editor.isActive("orderedList")
          }
          disabled={disabled}
          tooltip="Normal Text"
        >
          <PilcrowIcon className="size-3.5" />
        </ToolbarButton>

        <Separator orientation="vertical" className="mx-1 h-4 opacity-30" />

        {/* Lists */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          isActive={editor.isActive("bulletList")}
          disabled={disabled}
          tooltip="Bullet List"
        >
          <ListIcon className="size-3.5" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          isActive={editor.isActive("orderedList")}
          disabled={disabled}
          tooltip="Numbered List"
        >
          <ListOrderedIcon className="size-3.5" />
        </ToolbarButton>

        <Separator orientation="vertical" className="mx-1 h-4 opacity-30" />

        {/* Link */}
        <ToolbarButton
          onClick={setLink}
          isActive={editor.isActive("link")}
          disabled={disabled}
          tooltip="Add Link"
        >
          <LinkIcon className="size-3.5" />
        </ToolbarButton>

        <Separator orientation="vertical" className="mx-1 h-4 opacity-30" />

        {/* New Comment */}
        <ToolbarButton
          onClick={insertComment}
          disabled={disabled}
          tooltip="New Comment"
        >
          <MessageSquarePlusIcon className="size-3.5" />
        </ToolbarButton>
      </div>
    </TooltipProvider>
  );
}

/**
 * Tiptap WYSIWYG editor component
 */
export function TiptapEditor({
  content,
  onChange,
  placeholder = "Start typing...",
  disabled = false,
  className,
  autoFocus = false,
  ref,
}: TiptapEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3, 4],
        },
      }),
      Placeholder.configure({
        placeholder,
        emptyEditorClass:
          "before:content-[attr(data-placeholder)] before:text-muted-foreground before:float-left before:h-0 before:pointer-events-none",
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        // Block unsafe URL schemes (javascript:, data:, vbscript:) to prevent stored XSS
        validate: (href) => /^(https?:\/\/|mailto:|tel:)/i.test(href),
        HTMLAttributes: {
          class: "text-primary underline cursor-pointer",
        },
      }),
    ],
    content: content ?? undefined,
    editable: !disabled,
    autofocus: autoFocus,
    editorProps: {
      attributes: {
        class: cn(
          "prose prose-sm dark:prose-invert max-w-none",
          "min-h-[200px] w-full px-3 py-2",
          "focus:outline-none",
          "[&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mb-4 [&_h1]:mt-6 first:[&_h1]:mt-0",
          "[&_h2]:text-xl [&_h2]:font-semibold [&_h2]:mb-3 [&_h2]:mt-5 first:[&_h2]:mt-0",
          "[&_h3]:text-lg [&_h3]:font-medium [&_h3]:mb-2 [&_h3]:mt-4 first:[&_h3]:mt-0",
          "[&_h4]:text-xs [&_h4]:font-medium [&_h4]:mb-2 [&_h4]:mt-4 [&_h4]:text-muted-foreground first:[&_h4]:mt-0",
          "[&_p]:mb-3 [&_p]:leading-relaxed last:[&_p]:mb-0",
          "[&_ul]:mb-3 [&_ul]:list-disc [&_ul]:pl-6",
          "[&_ol]:mb-3 [&_ol]:list-decimal [&_ol]:pl-6",
          "[&_li]:mb-1",
          "[&_a]:text-primary [&_a]:underline"
        ),
      },
    },
    onUpdate: ({ editor }) => {
      onChange?.(editor.getJSON());
    },
  });

  // Expose methods via ref
  useImperativeHandle(ref, () => ({
    getJSON: () => editor?.getJSON(),
    setContent: (newContent) => {
      if (!editor) return;
      if (newContent === null) {
        editor.commands.clearContent();
      } else {
        editor.commands.setContent(newContent);
      }
    },
    focus: () => editor?.commands.focus(),
    getEditor: () => editor,
  }));

  // Update editable state when disabled changes
  useEffect(() => {
    if (editor) {
      editor.setEditable(!disabled);
    }
  }, [editor, disabled]);

  return (
    <div
      className={cn(
        "border-border/40 bg-background dark:bg-input/30 rounded-md border",
        "focus-within:border-ring/70 focus-within:ring-ring/30 focus-within:ring-[2px]",
        "transition-[color,box-shadow]",
        disabled && "cursor-not-allowed opacity-50",
        className
      )}
    >
      <EditorToolbar editor={editor} disabled={disabled} />
      <EditorContent editor={editor} />
    </div>
  );
}

/**
 * Parse rich text content - handles both JSON and legacy plain text
 */
export function parseRichTextContent(
  content: string | null
): JSONContent | null {
  if (!content) return null;

  try {
    const parsed = JSON.parse(content);
    if (parsed && typeof parsed === "object" && parsed.type === "doc") {
      return parsed;
    }
    return {
      type: "doc",
      content: [
        { type: "paragraph", content: [{ type: "text", text: content }] },
      ],
    };
  } catch {
    return {
      type: "doc",
      content: [
        { type: "paragraph", content: [{ type: "text", text: content }] },
      ],
    };
  }
}

/**
 * Serialize rich text content to string for storage
 */
export function serializeRichTextContent(content: JSONContent): string {
  return JSON.stringify(content);
}

/**
 * Extract plain text from rich text content (handles both JSON and legacy plain text)
 */
export function getRichTextPlainText(content: string | null): string | null {
  if (!content) return null;

  try {
    const parsed = JSON.parse(content);
    if (parsed && typeof parsed === "object" && parsed.type === "doc") {
      const extractText = (node: Record<string, unknown>): string => {
        if (node.type === "text") return (node.text as string) || "";
        if (node.content && Array.isArray(node.content)) {
          return (node.content as Record<string, unknown>[])
            .map(extractText)
            .join("");
        }
        return "";
      };
      const text = extractText(parsed);
      return text || null;
    }
    return content;
  } catch {
    return content;
  }
}
