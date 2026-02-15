import { createCspReportHandler } from "@helvety/shared/csp-report";

export const runtime = "nodejs";
export const POST = createCspReportHandler("pdf");
