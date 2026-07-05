"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/** Loaded source image plus its object URL and natural dimensions. */
interface SourceImageState {
  file: File;
  objectUrl: string;
  image: HTMLImageElement;
  naturalWidth: number;
  naturalHeight: number;
}

/** Loads a File into an HTMLImageElement and revokes object URLs on cleanup. */
export function useSourceImage() {
  const [source, setSource] = useState<SourceImageState | null>(null);
  const objectUrlRef = useRef<string | null>(null);

  const revokeUrl = useCallback((url: string | null) => {
    if (url) {
      URL.revokeObjectURL(url);
    }
  }, []);

  const loadFile = useCallback(
    async (file: File): Promise<SourceImageState> => {
      revokeUrl(objectUrlRef.current);
      const objectUrl = URL.createObjectURL(file);
      objectUrlRef.current = objectUrl;

      const image = await new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error("Failed to load image"));
        img.src = objectUrl;
      });

      const next: SourceImageState = {
        file,
        objectUrl,
        image,
        naturalWidth: image.naturalWidth,
        naturalHeight: image.naturalHeight,
      };
      setSource(next);
      return next;
    },
    [revokeUrl]
  );

  const clear = useCallback(() => {
    revokeUrl(objectUrlRef.current);
    objectUrlRef.current = null;
    setSource(null);
  }, [revokeUrl]);

  useEffect(() => {
    return () => {
      revokeUrl(objectUrlRef.current);
    };
  }, [revokeUrl]);

  return { source, loadFile, clear };
}
