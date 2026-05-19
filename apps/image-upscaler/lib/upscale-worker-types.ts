import type { UpscaleModelId } from "@/lib/models";

interface UpscaleRequest {
  type: "upscale";
  id: string;
  modelId: UpscaleModelId;
  file: File;
  width: number;
  height: number;
}

interface RuntimeRequest {
  type: "runtime";
  id: string;
}

export type WorkerRequest = UpscaleRequest | RuntimeRequest;

interface UpscaleResponse {
  type: "upscale:success";
  id: string;
  outputBlob: Blob;
}

interface RuntimeResponse {
  type: "runtime:success";
  id: string;
  runtime: string;
}

interface ModelDownloadProgressResponse {
  type: "model:download:progress";
  id: string;
  modelId: UpscaleModelId;
  received: number;
  total: number | null;
}

interface WorkerErrorResponse {
  type: "error";
  id: string;
  message: string;
}

export type WorkerResponse =
  | UpscaleResponse
  | RuntimeResponse
  | ModelDownloadProgressResponse
  | WorkerErrorResponse;
