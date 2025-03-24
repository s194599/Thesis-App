import fitz  # PyMuPDF for PDF processing
import requests
import json
import os
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def extract_text_from_pdf(pdf_path, max_pages=10):
    """
    Extract text content from a PDF file
    
    Args:
        pdf_path: Path to the PDF file
        max_pages: Maximum number of pages to process (default: 10)
        
    Returns:
        Extracted text as a string
    """
    try:
        doc = fitz.open(pdf_path)
        text = ""

        for page_num in range(min(len(doc), max_pages)):
            text += doc[page_num].get_text("text") + "\n"

        return text.strip()
    except Exception as e:
        logger.error(f"Error extracting text from PDF: {str(e)}")
        raise

def generate_quiz(content):
    """Generate a simple 3-question quiz using Ollama"""
    try:
        OLLAMA_API = "http://localhost:11434/api/generate"

        prompt = f"""
        Generate a multiple-choice quiz with exactly 3 questions based on this text:
        {content}

        Format each question exactly like this:
        [Question] Write the question here
        A) First option
        B) Second option
        C) Third option
        D) Fourth option
        Correct answer: [A, B, C, or D]
        """

        payload = {
            "model": "mistral",
            "prompt": prompt,
            "stream": False
        }

        logger.info("Sending request to Ollama")
        response = requests.post(OLLAMA_API, json=payload)

        if response.status_code == 200:
            return response.json().get("response", "No response received.")
        else:
            error_msg = f"Error from Ollama API: {response.status_code}\n{response.text}"
            logger.error(error_msg)
            raise Exception(error_msg)

    except Exception as e:
        logger.error(f"Error generating quiz: {str(e)}")
        raise

# Main function for testing
def main():
    try:
        # Test content
        test_content = "This is a test content for quiz generation."
        quiz = generate_quiz(test_content)
        print("\nGenerated Quiz:\n")
        print(quiz)

    except Exception as e:
        logger.error(f"Error in main: {str(e)}")

if __name__ == "__main__":
    main() 