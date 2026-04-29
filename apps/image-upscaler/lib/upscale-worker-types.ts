/* eslint-disable jsdoc/require-jsdoc */

interface UpscaleRequest {
  type: "upscale";
  id: string;
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

interface WorkerErrorResponse {
  type: "error";
  id: string;
  message: string;
}

export type WorkerResponse =
  | UpscaleResponse
  | RuntimeResponse
  | WorkerErrorResponse;
