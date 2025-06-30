import fitz  # PyMuPDF for PDF processing
import logging
from config.app_config import logger


def extract_text_from_pdf(pdf_path, max_pages=10):
    """
    Extract text content from a PDF file

    Args:
        pdf_path (str): Path to the PDF file
        max_pages (int): Maximum number of pages to process

    Returns:
        str: Extracted text from the PDF
    """
    try:
        doc = fitz.open(pdf_path)
        text = ""
        for page_num in range(min(len(doc), max_pages)):
            text += doc[page_num].get_text("text") + "\n"
        doc.close()  # Close the document properly
        
        # Check if we actually extracted any meaningful text
        cleaned_text = text.strip()
        if not cleaned_text:
            logger.warning(f"No text content extracted from PDF: {pdf_path}")
            return f"[PDF EXTRACTION WARNING] No readable text content found in PDF file. The PDF might be image-based, encrypted, or corrupted."
        
        logger.info(f"Successfully extracted {len(cleaned_text)} characters from PDF: {pdf_path}")
        return cleaned_text
        
    except Exception as e:
        error_msg = f"[PDF EXTRACTION ERROR] Failed to extract text from PDF '{pdf_path}': {str(e)}"
        logger.error(error_msg)
        return error_msg


def extract_text_from_file(file_path):
    """
    Extract text from a generic text file

    Args:
        file_path (str): Path to the text file

    Returns:
        str: Content of the text file
    """
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()
        
        if not content.strip():
            logger.warning(f"No text content found in file: {file_path}")
            return f"[FILE EXTRACTION WARNING] No readable text content found in file."
        
        logger.info(f"Successfully extracted {len(content)} characters from file: {file_path}")
        return content
        
    except UnicodeDecodeError as e:
        # Try different encodings
        try:
            with open(file_path, "r", encoding="latin-1") as f:
                content = f.read()
            logger.info(f"Successfully extracted text using latin-1 encoding from: {file_path}")
            return content
        except Exception as fallback_error:
            error_msg = f"[FILE EXTRACTION ERROR] Failed to read text file '{file_path}' with multiple encodings: {str(fallback_error)}"
            logger.error(error_msg)
            return error_msg
    except Exception as e:
        error_msg = f"[FILE EXTRACTION ERROR] Failed to read text file '{file_path}': {str(e)}"
        logger.error(error_msg)
        return error_msg
