/**
 * Re-export shared resolver — keep zone-local path for CI/tests that import
 * apps/pdf/scripts/resolve-pdfjs-for-react-pdf.mjs.
 */
export {
  PDFJS_SOURCE_LABEL,
  resolvePdfJsForReactPdf,
} from "../../../scripts/resolve-pdfjs-for-react-pdf.mjs";
