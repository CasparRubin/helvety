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
  const loadIdRef = useRef(0);

  const revokeUrl = useCallback((url: string | null) => {
    if (url) {
      URL.revokeObjectURL(url);
    }
  }, []);

  const loadFile = useCallback(
    async (file: File): Promise<SourceImageState> => {
      const loadId = loadIdRef.current + 1;
      loadIdRef.current = loadId;
      const previousUrl = objectUrlRef.current;
      const objectUrl = URL.createObjectURL(file);
      objectUrlRef.current = objectUrl;

      try {
        const image = await new Promise<HTMLImageElement>((resolve, reject) => {
          const img = new Image();
          img.onload = () => resolve(img);
          img.onerror = () => reject(new Error("Failed to load image"));
          img.src = objectUrl;
        });

        if (loadId !== loadIdRef.current) {
          throw new DOMException("Superseded load", "AbortError");
        }

        revokeUrl(previousUrl);

        const next: SourceImageState = {
          file,
          objectUrl,
          image,
          naturalWidth: image.naturalWidth,
          naturalHeight: image.naturalHeight,
        };
        setSource(next);
        return next;
      } catch (error) {
        URL.revokeObjectURL(objectUrl);
        if (objectUrlRef.current === objectUrl) {
          objectUrlRef.current = previousUrl;
        }
        throw error;
      }
    },
    [revokeUrl]
  );

  const clear = useCallback(() => {
    loadIdRef.current += 1;
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
