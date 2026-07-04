"use client";

import { useCallback, useReducer } from "react";

import {
  editorReducer,
  initialEditorState,
  type EditorAction,
} from "@/lib/editor-reducer";

import type { CropRect, EditorTool } from "@/lib/editor-types";

/** Editor state with `useReducer` plus memoized action dispatchers. */
export function useEditorState() {
  const [state, dispatch] = useReducer(editorReducer, initialEditorState);

  const setTool = useCallback((tool: EditorTool) => {
    dispatch({ type: "SET_TOOL", tool });
  }, []);

  const select = useCallback((id: string | null) => {
    dispatch({ type: "SELECT", id });
  }, []);

  const setCrop = useCallback((crop: CropRect | null) => {
    dispatch({ type: "SET_CROP", crop });
  }, []);

  const resetAnnotations = useCallback(() => {
    dispatch({ type: "RESET_ANNOTATIONS" });
  }, []);

  const dispatchAction = useCallback((action: EditorAction) => {
    dispatch(action);
  }, []);

  return {
    state,
    dispatch: dispatchAction,
    setTool,
    select,
    setCrop,
    resetAnnotations,
  };
}
