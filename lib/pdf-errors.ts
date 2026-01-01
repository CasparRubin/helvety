/**
 * Formats file processing errors (PDFs and images) into user-friendly messages.
 * 
 * @param error - The error object (can be Error, string, or unknown)
 * @param context - Context string for the error (e.g., "Can't load 'filename.pdf':" or "Can't extract page:")
 * @returns A formatted error message suitable for display to users
 */
export function formatPdfError(error: unknown, context: string): string {
  const errorMessage = error instanceof Error ? error.message.toLowerCase() : ""
  let userMessage = context
  
  if (errorMessage.includes("password") || errorMessage.includes("encrypted")) {
    userMessage += " password-protected. Please remove the password and try again."
  } else if (errorMessage.includes("corrupt") || errorMessage.includes("invalid")) {
    userMessage += " file may be corrupted. Please ensure the file is not damaged and try a different file."
  } else if (errorMessage.includes("network") || errorMessage.includes("fetch") || errorMessage.includes("failed to fetch")) {
    userMessage += " network error occurred. Please check your connection and try again."
  } else if (errorMessage.includes("timeout") || errorMessage.includes("timed out")) {
    userMessage += " request timed out. Please try again with a smaller file or check your connection."
  } else {
    userMessage += " an error occurred. Please ensure the file is valid and not corrupted or password-protected, then try again."
  }
  
  return userMessage
}

