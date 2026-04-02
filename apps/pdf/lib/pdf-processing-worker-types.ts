export interface WorkerSourceFile {
  readonly id: string;
  readonly name: string;
  readonly type: "pdf" | "image";
  readonly mimeType: string;
  readonly bytes: ArrayBuffer;
  readonly inherentRotations?: Readonly<Record<number, number>>;
}

export interface WorkerUnifiedPage {
  readonly unifiedPageNumber: number;
  readonly fileId: string;
  readonly originalPageNumber: number;
}

export interface ExtractPageRequestPayload {
  readonly sourceFile: WorkerSourceFile;
  readonly originalPageNumber: number;
  readonly unifiedPageNumber: number;
  readonly userRotation: number;
}

export interface MergeRequestPayload {
  readonly files: ReadonlyArray<WorkerSourceFile>;
  readonly pages: ReadonlyArray<WorkerUnifiedPage>;
  readonly activePageOrder: ReadonlyArray<number>;
  readonly pageRotations: Readonly<Record<number, number>>;
}

export interface WorkerProcessingOptions {
  readonly useGpuPreprocess: boolean;
  readonly useWorkerPipeline: boolean;
}

export interface ExtractPageResponsePayload {
  readonly bytes: ArrayBuffer;
}

export interface MergeResponsePayload {
  readonly bytes: ArrayBuffer;
  readonly failedPages: ReadonlyArray<{
    readonly pageNum: number;
    readonly error: string;
  }>;
}

export type WorkerRequest =
  | {
      readonly id: string;
      readonly kind: "extract-page";
      readonly options: WorkerProcessingOptions;
      readonly payload: ExtractPageRequestPayload;
    }
  | {
      readonly id: string;
      readonly kind: "merge-pages";
      readonly options: WorkerProcessingOptions;
      readonly payload: MergeRequestPayload;
    }
  | {
      readonly id: string;
      readonly kind: "cancel";
    };

export type WorkerResponse =
  | {
      readonly id: string;
      readonly ok: true;
      readonly kind: "extract-page";
      readonly payload: ExtractPageResponsePayload;
    }
  | {
      readonly id: string;
      readonly ok: true;
      readonly kind: "merge-pages";
      readonly payload: MergeResponsePayload;
    }
  | {
      readonly id: string;
      readonly ok: false;
      readonly error: string;
    };
