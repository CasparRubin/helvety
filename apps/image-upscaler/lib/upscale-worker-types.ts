/* eslint-disable jsdoc/require-jsdoc */

export interface UpscaleRequest {
  type: "upscale";
  id: string;
  file: File;
  width: number;
  height: number;
}

export interface RuntimeRequest {
  type: "runtime";
  id: string;
}

export type WorkerRequest = UpscaleRequest | RuntimeRequest;

export interface UpscaleResponse {
  type: "upscale:success";
  id: string;
  outputBlob: Blob;
}

export interface RuntimeResponse {
  type: "runtime:success";
  id: string;
  runtime: string;
}

export interface WorkerErrorResponse {
  type: "error";
  id: string;
  message: string;
}

export type WorkerResponse =
  | UpscaleResponse
  | RuntimeResponse
  | WorkerErrorResponse;
