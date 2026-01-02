// External libraries
import { PDFDocument } from "pdf-lib"

// Types
import type { PdfFile } from "./types"

/**
 * Determines the file type from a File object or PdfFile.
 * 
 * @param file - The File object to check
 * @param pdfFile - Optional PdfFile object that may already have type information
 * @returns 'pdf' if the file is a PDF, 'image' otherwise
 */
export function getFileType(file: File, pdfFile?: PdfFile): 'pdf' | 'image' {
  if (pdfFile?.type) return pdfFile.type
  return file.type === 'application/pdf' ? 'pdf' : 'image'
}

/**
 * Loads a PDF document from a File object.
 * 
 * @param file - The PDF file to load
 * @returns A promise that resolves to the loaded PDFDocument
 * @throws Error if the file cannot be loaded
 */
export async function loadPdfFromFile(file: File): Promise<PDFDocument> {
  const arrayBuffer = await file.arrayBuffer()
  return await PDFDocument.load(arrayBuffer)
}

/**
 * Converts an image file to a single-page PDF document.
 * Supports PNG, JPEG, and other formats (via Canvas conversion if needed).
 * 
 * @param file - The image file to convert
 * @returns A promise that resolves to a PDFDocument containing the image as a single page
 * @throws Error if the image cannot be loaded or converted
 */
export async function convertImageToPdf(file: File): Promise<PDFDocument> {
  const arrayBuffer = await file.arrayBuffer()
  const pdf = await PDFDocument.create()
  
  // Detect image format from MIME type or file extension
  const mimeType = file.type.toLowerCase()
  const fileName = file.name.toLowerCase()
  
  let imageEmbed: { embed: Awaited<ReturnType<typeof pdf.embedPng>> | Awaited<ReturnType<typeof pdf.embedJpg>>; width: number; height: number }
  
  try {
    // Try PNG first
    if (mimeType === 'image/png' || fileName.endsWith('.png')) {
      const pngImage = await pdf.embedPng(arrayBuffer)
      imageEmbed = {
        embed: pngImage,
        width: pngImage.width,
        height: pngImage.height,
      }
    }
    // Try JPEG
    else if (mimeType === 'image/jpeg' || mimeType === 'image/jpg' || fileName.endsWith('.jpg') || fileName.endsWith('.jpeg')) {
      const jpgImage = await pdf.embedJpg(arrayBuffer)
      imageEmbed = {
        embed: jpgImage,
        width: jpgImage.width,
        height: jpgImage.height,
      }
    }
    // For other formats (WebP, GIF, etc.), convert via Canvas
    else {
      // Ensure we're in a browser environment
      if (typeof document === 'undefined' || typeof Image === 'undefined') {
        throw new Error('Image conversion requires a browser environment')
      }
      
      // Create an image element to load and convert the image
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const image = new Image()
        const blob = new Blob([arrayBuffer], { type: file.type || 'image/png' })
        const url = URL.createObjectURL(blob)
        
        image.onload = () => {
          URL.revokeObjectURL(url)
          resolve(image)
        }
        image.onerror = () => {
          URL.revokeObjectURL(url)
          reject(new Error(`Failed to load image: ${file.name}`))
        }
        image.src = url
      })
      
      // Convert image to PNG via Canvas
      const canvas = document.createElement('canvas')
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        throw new Error('Failed to get canvas context')
      }
      ctx.drawImage(img, 0, 0)
      
      // Convert canvas to blob, then to array buffer
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob)
          } else {
            reject(new Error('Failed to convert image to blob'))
          }
        }, 'image/png')
      })
      
      const pngBuffer = await blob.arrayBuffer()
      const pngImage = await pdf.embedPng(pngBuffer)
      imageEmbed = {
        embed: pngImage,
        width: pngImage.width,
        height: pngImage.height,
      }
    }
    
    // Create a page with the image dimensions
    const page = pdf.addPage([imageEmbed.width, imageEmbed.height])
    page.drawImage(imageEmbed.embed, {
      x: 0,
      y: 0,
      width: imageEmbed.width,
      height: imageEmbed.height,
    })
    
    return pdf
  } catch (error) {
    throw new Error(`Failed to convert image to PDF: ${error instanceof Error ? error.message : String(error)}`)
  }
}

/**
 * Extracts a page from a PDF document and creates a new PDF with that page.
 * 
 * @param pdf - The source PDF document
 * @param pageIndex - The zero-based index of the page to extract
 * @returns A promise that resolves to a new PDFDocument containing only the extracted page
 */
export async function extractPageFromPdf(
  pdf: PDFDocument,
  pageIndex: number
): Promise<PDFDocument> {
  const newPdf = await PDFDocument.create()
  const [copiedPage] = await newPdf.copyPages(pdf, [pageIndex])
  newPdf.addPage(copiedPage)
  return newPdf
}

