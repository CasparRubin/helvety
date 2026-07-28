# UI action button contract

Canonical placement, icons, labels, and variants for toolbar and row actions across Helvety web zones and the Chromium extension. Complements [`ui-shadcn-integration-policy.md`](./ui-shadcn-integration-policy.md).

## Primitives

- **Button:** `@helvety/ui/button` only (CVA variants: `default`, `outline`, `secondary`, `ghost`, `destructive`, `link`).
- **Icons:** `lucide-react` only. Prefer `size-4` for toolbar icons. List delete: **`Trash2Icon`** (not legacy `TrashIcon`).
- **Toasts:** Zone apps import `toast` from `@helvety/ui/sonner` only (do not add a direct `sonner` app dependency).

## Placement map

| Surface                     | Create       | Save                | Back         | Delete                    | Export / download              | Settings     |
| --------------------------- | ------------ | ------------------- | ------------ | ------------------------- | ------------------------------ | ------------ |
| Public tools (`CommandBar`) |              |                     |              | Per-app                   | Right, `default`, "Download …" | Per-app      |
| Extension list              | Footer `Add` |                     |              | Row ghost `Trash2Icon`    | N/A                            | Header icons |
| Extension form              |              | Footer, dirty-gated | Header ghost | Header ghost `Trash2Icon` | N/A                            |              |

Pin command bars **outside** scroll (flex sibling above the workspace, or shell `scrollAreaMainPrefix`). External Chromium extensions use `@helvety/extension-chrome` popup shell chrome (header + tab panels) instead of web command bars.

## Icon map

| Action           | Icon                | Notes                                                              |
| ---------------- | ------------------- | ------------------------------------------------------------------ |
| Create           | `PlusIcon` / `Plus` | Always left cluster on web                                         |
| Save             | `SaveIcon`          | Extension forms: icon-only until dirty, then "Save Changes"        |
| Back             | `ArrowLeftIcon`     | Ghost; label at `min-[400px]` on web command bars                  |
| Delete (list)    | `Trash2Icon`        | Ghost `icon-sm`, hover destructive                                 |
| Delete (editor)  | `Trash2Icon`        | Destructive variant                                                |
| Download (tools) | `DownloadIcon`      | Label: **Download PDF** / **Download All** / per-card **Download** |
| Open external    | `ExternalLink`      | Extension / Store external install links                           |
| Refresh          | `RefreshCwIcon`     | Outline `sm`                                                       |

## Responsive labels

Mirror public-tool command bars: icon-only below `min-[400px]`, visible label at `min-[400px]:not-sr-only`. Export/settings overflow menus hide below `md` where used.

## Destructive styling

- **List row delete:** ghost + `Trash2Icon`, `hover:text-destructive`.
- **Clear workspace / clear annotations:** `AlertDialog` confirm; filled `destructive` in the dialog action.

## Rounded containers

System radius is `--radius: 0`. Allowed exceptions: legal callouts (`rounded-lg` alerts), product cards, catalog chips inside forms. Tabs, command bars, and extension chrome stay sharp.

## Extension bounded parity

Shared Chromium extension UI lives in `@helvety/extension-chrome` (theme boot, popup shell, header). Power Platform Configurator is the primary consumer. Align icons, variants, and form spacing with web when the popup viewport allows. Do not assume web-only shells (`CommandBar`, public-tool workspace) exist in the extension.

Public canvas apps pin a `CommandBar` above a flex workspace row (`PUBLIC_TOOL_*` classes in `@helvety/ui/public-tool-workspace`). Store section nav is **not** a canvas tool.

### Command bar placement and variants

| Zone      | Buttons                                                                                                                        |
| --------- | ------------------------------------------------------------------------------------------------------------------------------ |
| **Left**  | Add {Files\|Image\|File} / **Add More**, **Clear All** (multi-file apps)                                                       |
| **Right** | Download / Export, mobile settings popover, **More actions** overflow; image editor **Clear Annotations** (partial reset only) |

| Variant       | Use                                                                                      |
| ------------- | ---------------------------------------------------------------------------------------- |
| `default`     | Import, download/export                                                                  |
| `outline`     | Clear, settings, overflow triggers, inactive tools                                       |
| `destructive` | `AlertDialog` confirm actions and destructive `DropdownMenuItem` in mobile overflow only |

**Labels**

| State         | Multi-file (PDF) | Single-file (image editor, OCR)        |
| ------------- | ---------------- | -------------------------------------- |
| Empty import  | Add Files        | Add Image / Add File                   |
| Loaded import | Add More         | Add More                               |
| Processing    | Processing...    | Processing...                          |
| Output        | Download PDF     | Export (+ format menu) / Download Text |
| Full reset    | Clear All        | Clear All                              |
| Partial reset |                  | Clear Annotations                      |

**Responsive:** icon-only bar labels below `min-[400px]`; desktop inline clear `hidden md:inline-flex`; mobile overflow `md:hidden`; sidebars `hidden lg:block`.

**Dialog titles (title case):** Clear All Files?, Clear File?, Clear Annotations?

### Sidebar and card patterns

| Pattern            | Rule                                                                  |
| ------------------ | --------------------------------------------------------------------- |
| Width              | `PUBLIC_TOOL_SIDEBAR_WIDTH_CLASS` + `PUBLIC_TOOL_SIDEBAR_PANEL_CLASS` |
| Section headings   | `text-sm font-semibold` h3 when a panel has named sections            |
| Remove queued file | `ghost` icon, `aria-label="Remove {name}"`                            |
| Delete layer/page  | `ghost` / `icon-sm`, `aria-label="Delete {layer\|page}"`              |
| Per-item actions   | `outline` `sm` (e.g. Download / Extract on PDF page cards)            |

### Empty state copy

- Reference **command bar** (never "toolbar").
- Secondary hint when empty: **Or use the command bar above to add your {files\|images\|image}**.
- Optional privacy line: _Processed locally in your browser. No server upload. No account._

### Icon map (canvas)

| Action            | Icon           | Label                                                     |
| ----------------- | -------------- | --------------------------------------------------------- |
| Import            | `UploadIcon`   | Add Files / Add Image / Add File / Add More               |
| Download          | `DownloadIcon` | Download PDF / Export / Download Text / per-card Download |
| Clear workspace   | `Trash2Icon`   | Clear All                                                 |
| Clear annotations | `Trash2Icon`   | Clear Annotations                                         |
| Remove file       | `X`            | `aria-label` only: Remove {name}                          |

## Responsive smoke matrix

Manual check at **320px**, **400px**, **768px**, **1280px** per app family before shipping UI consistency changes:

- Tools: sidebar visibility at `lg`, download button labels, empty-state command-bar hint on all canvas apps.
- Extension: icon tabs, form footer save gating, scrollbar theming in dark mode.
