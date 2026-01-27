/**
 * Web Worker for rendering PDF pages using OffscreenCanvas.
 * This file is loaded as a separate worker script.
 */

// Import PDF.js - we'll need to handle this differently in a worker
// For now, we'll use a message-based approach where the main thread
// handles PDF.js initialization and we just handle canvas rendering

// Placeholder variables for future PDF.js worker implementation
let _pdfjsLib = null;
let _isInitialized = false;

// Store active render operations for cancellation
const activeRenders = new Map();

/**
 * Initializes PDF.js in the worker context.
 * Note: This is a placeholder for future implementation.
 */
// async function initializePdfJs() {
//   // Placeholder for future PDF.js worker implementation
// }

/**
 * Type guard to check if a message is a valid worker message.
 * Safely validates message structure before processing.
 * 
 * @param {unknown} message - The message to validate
 * @returns {boolean} True if message is a valid worker message
 */
function isWorkerMessage(message) {
  if (typeof message !== 'object' || message === null) {
    return false;
  }
  
  if (!('type' in message) || typeof message.type !== 'string') {
    return false;
  }
  
  const messageType = message.type;
  
  // Validate render request
  if (messageType === 'render') {
    return (
      typeof message.id === 'string' &&
      'fileUrl' in message &&
      'pageNumber' in message &&
      'width' in message &&
      'devicePixelRatio' in message &&
      'rotation' in message
    );
  }
  
  // Validate cancel request
  if (messageType === 'cancel') {
    return typeof message.id === 'string';
  }
  
  return false;
}

/**
 * Main message handler for the worker.
 * 
 * Note: Console usage in workers is acceptable since workers run in a separate
 * context and cannot access the main thread's logger utility. Console methods
 * are the standard way to log in Web Workers.
 */
self.addEventListener('message', (event) => {
  const message = event.data;

  // Validate message structure using type guard
  if (!isWorkerMessage(message)) {
    const messageType = typeof message === 'object' && message !== null && 'type' in message
      ? String(message.type)
      : typeof message;
    console.warn('Invalid worker message received:', messageType, message);
    return;
  }

  switch (message.type) {
    case 'render':
      // For now, return an error indicating this needs to be implemented
      // The main thread will fall back to canvas rendering
      self.postMessage({
        type: 'render-complete',
        id: message.id,
        imageBitmap: null,
        error: 'Worker rendering not yet fully implemented - using fallback',
      });
      break;

    case 'cancel':
      const controller = activeRenders.get(message.id);
      if (controller) {
        controller.abort();
        activeRenders.delete(message.id);
      }
      break;

    default:
      // This should never happen due to type guard, but included for safety
      console.warn('Unhandled message type:', message.type);
  }
});
