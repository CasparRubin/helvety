/* eslint-disable jsdoc/require-jsdoc */

import { logger } from "@helvety/shared/logger";

import { getMemoryUsagePercent } from "@/lib/memory-utils";
import { getPdfProcessingFlags } from "@/lib/pdf-processing-flags";

import type { PdfProcessingPipeline } from "@/lib/pdf-processing-pipeline";

interface PipelineMetric {
  readonly operation: "extract" | "merge";
  readonly pipeline: PdfProcessingPipeline;
  readonly durationMs: number;
  readonly success: boolean;
  readonly pagesProcessed: number;
  readonly memoryPercent: number | null;
  readonly timestamp: string;
  readonly error?: string;
}

const METRIC_STORAGE_KEY = "helvety-pdf-pipeline-metrics";
const MAX_METRICS = 100;

function readStoredMetrics(): PipelineMetric[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.sessionStorage.getItem(METRIC_STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed as PipelineMetric[];
  } catch {
    return [];
  }
}

function writeStoredMetrics(metrics: PipelineMetric[]): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.sessionStorage.setItem(METRIC_STORAGE_KEY, JSON.stringify(metrics));
  } catch {
    // Ignore storage failures.
  }
}

export function recordPipelineMetric(
  metric: Omit<PipelineMetric, "timestamp" | "memoryPercent">
): void {
  const memoryPercent = getMemoryUsagePercent();
  const fullMetric: PipelineMetric = {
    ...metric,
    memoryPercent,
    timestamp: new Date().toISOString(),
  };

  const flags = getPdfProcessingFlags();
  if (!flags.telemetryEnabled) {
    return;
  }

  const stored = readStoredMetrics();
  const next = [fullMetric, ...stored].slice(0, MAX_METRICS);
  writeStoredMetrics(next);
  logger.log("PDF pipeline metric:", fullMetric);
}

export function getPipelineMetricsSnapshot(): ReadonlyArray<PipelineMetric> {
  return readStoredMetrics();
}
