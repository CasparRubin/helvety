/**
 * Web Worker for rendering PDF pages using OffscreenCanvas.
 * 
 * This worker is a placeholder for future implementation. PDF.js integration
 * in workers requires additional setup and complexity. Currently, rendering
 * is handled on the main thread using react-pdf with canvas rendering.
 * 
 * The worker infrastructure is in place but not actively used. When worker
 * rendering is implemented, this file will handle PDF rendering off the main
 * thread to improve performance for large documents.
 */

// Worker message types
interface RenderRequest {
  type: 'render'
  id: string
  fileUrl: string
  pageNumber: number
  width: number
  devicePixelRatio: number
  rotation: number
}

interface CancelRequest {
  type: 'cancel'
  id: string
}

type WorkerMessage = RenderRequest | CancelRequest

interface RenderResponse {
  type: 'render-complete'
  id: string
  imageBitmap: ImageBitmap | null
  error?: string
}

interface RenderProgress {
  type: 'render-progress'
  id: string
  progress: number
}

// Store active render operations for cancellation
const activeRenders = new Map<string, AbortController>()

/**
 * Type guard to check if a message is a valid WorkerMessage.
 * Safely validates message structure before processing.
 * 
 * @param message - The message to validate
 * @returns True if message is a valid WorkerMessage
 */
function isWorkerMessage(message: unknown): message is WorkerMessage {
  if (typeof message !== 'object' || message === null) {
    return false
  }
  
  // Type guard helper to check if property exists and has correct type
  const hasProperty = (obj: object, prop: string, type: 'string' | 'number'): boolean => {
    return prop in obj && typeof (obj as Record<string, unknown>)[prop] === type
  }
  
  if (!hasProperty(message, 'type', 'string')) {
    return false
  }
  
  const msg = message as { type: string; id?: unknown; fileUrl?: unknown; pageNumber?: unknown; width?: unknown; devicePixelRatio?: unknown; rotation?: unknown }
  const messageType = msg.type
  
  // Validate render request with stricter type checking
  if (messageType === 'render') {
    return (
      typeof msg.id === 'string' &&
      msg.id.length > 0 &&
      hasProperty(message, 'fileUrl', 'string') &&
      hasProperty(message, 'pageNumber', 'number') &&
      hasProperty(message, 'width', 'number') &&
      hasProperty(message, 'devicePixelRatio', 'number') &&
      hasProperty(message, 'rotation', 'number') &&
      typeof msg.pageNumber === 'number' &&
      typeof msg.width === 'number' &&
      typeof msg.devicePixelRatio === 'number' &&
      typeof msg.rotation === 'number'
    )
  }
  
  // Validate cancel request
  if (messageType === 'cancel') {
    return typeof msg.id === 'string' && msg.id.length > 0
  }
  
  return false
}

/**
 * Handles render requests from the main thread.
 * 
 * This is a placeholder implementation. When worker rendering is implemented,
 * this function will handle PDF page rendering using PDF.js in the worker context.
 * 
 * @param request - Render request with PDF file URL, page number, and rendering parameters
 */
async function handleRenderRequest(request: RenderRequest): Promise<void> {
  const { id } = request
  
  // Placeholder: return error indicating worker rendering is not implemented
  // The main thread will fall back to canvas rendering
  self.postMessage({
    type: 'render-complete',
    id,
    imageBitmap: null,
    error: 'Worker rendering not yet implemented - using canvas fallback',
  } as RenderResponse)
}

/**
 * Handles cancel requests from the main thread.
 */
function handleCancelRequest(request: CancelRequest): void {
  const { id } = request
  const controller = activeRenders.get(id)
  
  if (controller) {
    controller.abort()
    activeRenders.delete(id)
  }
}

/**
 * Main message handler for the worker.
 * 
 * Note: Console usage in workers is acceptable since workers run in a separate
 * context and cannot access the main thread's logger utility. Console methods
 * are the standard way to log in Web Workers.
 */
self.addEventListener('message', (event: MessageEvent<unknown>) => {
  const message = event.data

  // Validate message structure using type guard
  if (!isWorkerMessage(message)) {
    const messageType = typeof message === 'object' && message !== null && 'type' in message
      ? String((message as { type: unknown }).type)
      : typeof message
    console.warn('Invalid worker message received:', messageType, message)
    return
  }

  switch (message.type) {
    case 'render':
      handleRenderRequest(message).catch((error) => {
        self.postMessage({
          type: 'render-complete',
          id: message.id,
          imageBitmap: null,
          error: error instanceof Error ? error.message : String(error),
        } as RenderResponse)
      })
      break

    case 'cancel':
      handleCancelRequest(message)
      break

    default:
      // This should never happen due to type guard, but TypeScript requires exhaustive check
      console.warn('Unhandled message type:', (message as WorkerMessage).type)
  }
})

// Export types for use in main thread
export type { RenderRequest, CancelRequest, RenderResponse, RenderProgress }
