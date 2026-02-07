"use client";

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
  ListIcon,
  ListOrderedIcon,
  LinkIcon,
  Undo2Icon,
  Redo2Icon,
} from "lucide-react";
import { useCallback, useEffect, forwardRef, useImperativeHandle } from "react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

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
            "h-8 w-8 p-0",
            isActive && "bg-accent text-accent-foreground"
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

    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }, [editor]);

  if (!editor) {
    return null;
  }

  return (
    <TooltipProvider delayDuration={300}>
      <div className="border-border bg-muted/30 flex flex-wrap items-center gap-0.5 rounded-t-md border-b px-2 py-1">
        {/* Undo / Redo */}
        <ToolbarButton
          onClick={() => editor.chain().focus().undo().run()}
          // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- boolean OR is intentional
          disabled={disabled || !editor.can().undo()}
          tooltip="Undo"
        >
          <Undo2Icon className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().redo().run()}
          // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- boolean OR is intentional
          disabled={disabled || !editor.can().redo()}
          tooltip="Redo"
        >
          <Redo2Icon className="size-4" />
        </ToolbarButton>

        <Separator orientation="vertical" className="mx-1 h-6" />

        {/* Text formatting */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          isActive={editor.isActive("bold")}
          disabled={disabled}
          tooltip="Bold"
        >
          <BoldIcon className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          isActive={editor.isActive("italic")}
          disabled={disabled}
          tooltip="Italic"
        >
          <ItalicIcon className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          isActive={editor.isActive("underline")}
          disabled={disabled}
          tooltip="Underline"
        >
          <UnderlineIcon className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleStrike().run()}
          isActive={editor.isActive("strike")}
          disabled={disabled}
          tooltip="Strikethrough"
        >
          <StrikethroughIcon className="size-4" />
        </ToolbarButton>

        <Separator orientation="vertical" className="mx-1 h-6" />

        {/* Headings */}
        <ToolbarButton
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 1 }).run()
          }
          isActive={editor.isActive("heading", { level: 1 })}
          disabled={disabled}
          tooltip="Heading 1"
        >
          <Heading1Icon className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
          isActive={editor.isActive("heading", { level: 2 })}
          disabled={disabled}
          tooltip="Heading 2"
        >
          <Heading2Icon className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 3 }).run()
          }
          isActive={editor.isActive("heading", { level: 3 })}
          disabled={disabled}
          tooltip="Heading 3"
        >
          <Heading3Icon className="size-4" />
        </ToolbarButton>

        <Separator orientation="vertical" className="mx-1 h-6" />

        {/* Lists */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          isActive={editor.isActive("bulletList")}
          disabled={disabled}
          tooltip="Bullet List"
        >
          <ListIcon className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          isActive={editor.isActive("orderedList")}
          disabled={disabled}
          tooltip="Numbered List"
        >
          <ListOrderedIcon className="size-4" />
        </ToolbarButton>

        <Separator orientation="vertical" className="mx-1 h-6" />

        {/* Link */}
        <ToolbarButton
          onClick={setLink}
          isActive={editor.isActive("link")}
          disabled={disabled}
          tooltip="Add Link"
        >
          <LinkIcon className="size-4" />
        </ToolbarButton>
      </div>
    </TooltipProvider>
  );
}

/**
 * Tiptap WYSIWYG editor component
 */
export const TiptapEditor = forwardRef<TiptapEditorRef, TiptapEditorProps>(
  (
    {
      content,
      onChange,
      placeholder = "Start typing...",
      disabled = false,
      className,
      autoFocus = false,
    },
    ref
  ) => {
    const editor = useEditor({
      immediatelyRender: false,
      extensions: [
        StarterKit.configure({
          heading: {
            levels: [1, 2, 3],
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
          "border-input bg-background dark:bg-input/30 rounded-md border shadow-xs",
          "focus-within:border-ring focus-within:ring-ring/50 focus-within:ring-[3px]",
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
);

TiptapEditor.displayName = "TiptapEditor";

/**
 * Parse description content - handles both JSON and legacy plain text
 */
export function parseDescriptionContent(
  description: string | null
): JSONContent | null {
  if (!description) return null;

  try {
    // Try to parse as JSON (ProseMirror document)
    const parsed = JSON.parse(description);
    // Basic validation that it looks like a ProseMirror doc
    if (parsed && typeof parsed === "object" && parsed.type === "doc") {
      return parsed;
    }
    // If it's JSON but not a valid doc, treat as plain text
    return {
      type: "doc",
      content: [
        { type: "paragraph", content: [{ type: "text", text: description }] },
      ],
    };
  } catch {
    // Not valid JSON - wrap plain text in a paragraph
    return {
      type: "doc",
      content: [
        { type: "paragraph", content: [{ type: "text", text: description }] },
      ],
    };
  }
}

/**
 * Serialize editor content to string for storage
 */
export function serializeDescriptionContent(content: JSONContent): string {
  return JSON.stringify(content);
}

/**
 * Extract plain text from a description string (handles both JSON and legacy plain text)
 * Useful for displaying descriptions in lists/tables where rich formatting isn't needed
 */
export function getDescriptionPlainText(
  description: string | null
): string | null {
  if (!description) return null;

  try {
    const parsed = JSON.parse(description);
    if (parsed && typeof parsed === "object" && parsed.type === "doc") {
      // Recursively extract text from all content nodes
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
    // Not a doc structure, return as-is
    return description;
  } catch {
    // Not valid JSON - return plain text as-is
    return description;
  }
}
