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
        return text.strip()
    except Exception as e:
        logger.error(f"Error extracting text from PDF: {str(e)}")
        raise


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
            return f.read()
    except Exception as e:
        logger.error(f"Error reading text file: {str(e)}")
        raise
