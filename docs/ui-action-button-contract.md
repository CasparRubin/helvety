# UI action button contract

Canonical placement, icons, labels, and variants for toolbar and row actions across Helvety web zones and the Chromium extension. Complements [`ui-shadcn-integration-policy.md`](./ui-shadcn-integration-policy.md).

## Primitives

- **Button:** `@helvety/ui/button` only (CVA variants: `default`, `outline`, `secondary`, `ghost`, `destructive`, `link`).
- **Row actions:** `@helvety/ui/row-action-button` — web lists use `aria-label`; extension uses `showTooltip`.
- **Icons:** `lucide-react` only. Default size: `@helvety/ui/icon-size` → `ICON_SIZE_CLASS` (`size-4`). List delete: **`Trash2Icon`** (not legacy `TrashIcon`).
- **Toasts:** Zone apps import `toast` from `@helvety/ui/sonner` only (do not add a direct `sonner` app dependency).

## Placement map

| Surface                          | Create                 | Save                | Back             | Delete                                | Export / download               | Settings       |
| -------------------------------- | ---------------------- | ------------------- | ---------------- | ------------------------------------- | ------------------------------- | -------------- |
| E2EE list (`EntityCommandBar`)   | Left, `PlusIcon`, `sm` | —                   | Left when nested | Right, destructive + label            | Right, `outline`, "Export Data" | Right overflow |
| E2EE editor (`EditorCommandBar`) | —                      | Left, dirty-gated   | Left, ghost      | Right, `Trash2Icon`, destructive icon | —                               | Overflow       |
| Public tools (`CommandBar`)      | —                      | —                   | —                | Per-app                               | Right, `default`, "Download …"  | Per-app        |
| Extension list                   | Footer `Add`           | —                   | —                | Row ghost `Trash2Icon`                | N/A                             | Header icons   |
| Extension form                   | —                      | Footer, dirty-gated | Header ghost     | Header ghost `Trash2Icon`             | N/A                             | —              |

Pin command bars **outside** scroll (`CommandBarPageLayout` on web). Extension uses `EntityScreenLayout` footer/header instead of full command bars.

## Icon map

| Action           | Icon                | Notes                                                              |
| ---------------- | ------------------- | ------------------------------------------------------------------ |
| Create           | `PlusIcon` / `Plus` | Always left cluster on web                                         |
| Save             | `SaveIcon`          | Editor: icon-only until dirty, then "Save Changes"                 |
| Back             | `ArrowLeftIcon`     | Ghost; label at `min-[400px]` on web command bars                  |
| Delete (list)    | `Trash2Icon`        | Ghost `icon-sm`, hover destructive                                 |
| Delete (editor)  | `Trash2Icon`        | Destructive variant                                                |
| Export (E2EE)    | `DownloadIcon`      | Label: **Export Data**                                             |
| Download (tools) | `DownloadIcon`      | Label: **Download PDF** / **Download All** / per-card **Download** |
| Open external    | `ExternalLink`      | Links: title click or row icon                                     |
| Refresh          | `RefreshCwIcon`     | Outline `sm`                                                       |

## Responsive labels

Mirror `EntityCommandBar`: icon-only below `min-[400px]`, visible label at `min-[400px]:not-sr-only`. Export hidden below `md` (overflow menu). Links row actions: desktop icon row + mobile `DropdownMenu`.

## Destructive styling

- **Dashboard bulk delete:** `EntityCommandBar` — filled `destructive` + text label.
- **Editor delete:** `EditorCommandBar` — `destructive` icon-only on the right.
- **List row delete:** ghost + `Trash2Icon`, `hover:text-destructive`.

## Rounded containers

System radius is `--radius: 0`. Allowed exceptions: auth/legal callouts (`rounded-lg` alerts), product cards, catalog chips inside forms. Tabs, command bars, and extension chrome stay sharp.

## Extension bounded parity

The side panel omits DnD, search, and full command bars by design. Align **icons, variants, labels, and form spacing** (`@helvety/ui/e2ee-form-layout`, `@helvety/ui/form-field`) with web E2EE editors where viewport allows.

## Canvas tools (PDF, image upscaler, image editor, OCR)

Public canvas apps pin a `CommandBar` above a flex workspace row (`PUBLIC_TOOL_*` classes in `@helvety/ui/public-tool-workspace`). Store section nav is **not** a canvas tool.

### Command bar placement and variants

| Zone      | Buttons                                                                                                                        |
| --------- | ------------------------------------------------------------------------------------------------------------------------------ |
| **Left**  | Add {Files\|Images\|Image\|File} / **Add More**, app process action (e.g. Upscale all), **Clear All** (multi-file apps)        |
| **Right** | Download / Export, mobile settings popover, **More actions** overflow; image editor **Clear Annotations** (partial reset only) |

| Variant       | Use                                                                                      |
| ------------- | ---------------------------------------------------------------------------------------- |
| `default`     | Import, process, download/export                                                         |
| `outline`     | Clear, settings, overflow triggers, inactive tools                                       |
| `destructive` | `AlertDialog` confirm actions and destructive `DropdownMenuItem` in mobile overflow only |

**Labels**

| State         | Multi-file (PDF, upscaler)  | Single-file (image editor, OCR)        |
| ------------- | --------------------------- | -------------------------------------- |
| Empty import  | Add Files / Add Images      | Add Image / Add File                   |
| Loaded import | Add More                    | Add More                               |
| Processing    | Processing...               | Processing...                          |
| Output        | Download PDF / Download All | Export (+ format menu) / Download Text |
| Full reset    | Clear All                   | Clear All                              |
| Partial reset | —                           | Clear Annotations                      |

**Responsive:** icon-only bar labels below `min-[400px]`; desktop inline clear `hidden md:inline-flex`; mobile overflow `md:hidden`; sidebars `hidden lg:block`.

**Dialog titles (title case):** Clear All Files?, Clear All Images?, Clear File?, Clear Annotations?

### Sidebar and card patterns

| Pattern            | Rule                                                                  |
| ------------------ | --------------------------------------------------------------------- |
| Width              | `PUBLIC_TOOL_SIDEBAR_WIDTH_CLASS` + `PUBLIC_TOOL_SIDEBAR_PANEL_CLASS` |
| Section headings   | `text-sm font-semibold` h3 when a panel has named sections            |
| Remove queued file | `ghost` icon, `aria-label="Remove {name}"`                            |
| Delete layer/page  | `ghost` / `icon-sm`, `aria-label="Delete {layer\|page}"`              |
| Per-item process   | `outline` `sm` (e.g. Upscale, Download on card)                       |

### Empty state copy

- Reference **command bar** (never "toolbar").
- Secondary hint when empty: **Or use the command bar above to add your {files\|images\|image}**.
- Optional privacy line: _Processed locally in your browser. No server upload. No account._

### Icon map (canvas)

| Action            | Icon                          | Label                                                                    |
| ----------------- | ----------------------------- | ------------------------------------------------------------------------ |
| Import            | `UploadIcon`                  | Add Files / Add Images / Add Image / Add File / Add More                 |
| Process           | `WandSparklesIcon` (upscaler) | Upscale all                                                              |
| Download          | `DownloadIcon`                | Download PDF / Download All / Export / Download Text / per-card Download |
| Clear workspace   | `Trash2Icon`                  | Clear All                                                                |
| Clear annotations | `Trash2Icon`                  | Clear Annotations                                                        |
| Remove file       | `X`                           | `aria-label` only: Remove {name}                                         |

## Responsive smoke matrix

Manual check at **320px**, **400px**, **768px**, **1280px** per app family before shipping UI consistency changes:

- E2EE: command bar label collapse, links row overflow menu, contact editor `sm:grid-cols-2`.
- Tools: sidebar visibility at `lg`, download button labels, empty-state command-bar hint on all canvas apps.
- Extension: icon tabs, form footer save gating, scrollbar theming in dark mode.
