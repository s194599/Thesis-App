import fitz  # PyMuPDF for PDF processing
import requests
import json
<<<<<<< Updated upstream
import os
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Function to extract text from PDF
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
        logger.error(f"Error extracting text from PDF {pdf_path}: {str(e)}")
        raise Exception(f"Failed to process PDF: {str(e)}")


# Function to generate quiz using Ollama
def generate_quiz(content, num_questions=5, model="mistral", language="danish", student_level="highSchool"):
    """
    Generate a quiz using the local Ollama LLM
    
    Args:
        content: Text content to generate quiz from
        num_questions: Number of questions to generate (default: 5)
        model: LLM model to use (default: "mistral")
        language: Language for the quiz (default: "danish")
        student_level: Student level for difficulty (default: "highSchool")
        
    Returns:
        Generated quiz as text
    """
    OLLAMA_API = "http://localhost:11434/api/generate"
    
    # Verify content length
    if len(content) > 128000:
        logger.warning("Content too long. Truncating to 128,000 characters.")
        content = content[:128000]
    
    # Adjust language in prompt if needed
    language_instruction = ""
    if language and language.lower() != "english":
        language_instruction = f"The quiz should be in {language}. "
    
    # Adjust difficulty based on student level
    difficulty_instruction = ""
    if student_level:
        if student_level == "elementarySchool":
            difficulty_instruction = "Make the questions easy for elementary school students. "
        elif student_level == "middleSchool":
            difficulty_instruction = "Make the questions suitable for middle school students. "
        elif student_level == "highSchool":
            difficulty_instruction = "Make the questions suitable for high school students. "
        elif student_level == "university":
            difficulty_instruction = "Make the questions challenging for university students. "

    # Create the prompt
    prompt = f"""
    Generate a multiple-choice quiz based on this text:
    {content}

    {language_instruction}{difficulty_instruction}Generate {num_questions} questions.
    Only return the quiz with absolutely no explanations or introductions before or after.
    Follow this exact format:
=======

# Function to extract text from PDF
def extract_text_from_pdf(pdf_path, max_pages=10):
    doc = fitz.open(pdf_path)
    text = ""

    for page_num in range(min(len(doc), max_pages)):  # Limit to 10 pages
        text += doc[page_num].get_text("text") + "\n"  # Corrected line

    return text.strip()


# Function to generate quiz using Ollama
# Model options: llama3.2 - deepseek-r1:8b - mistral - gemma3:4b
def generate_quiz(pdf_text, num_questions = 5, model="mistral"):  # Change model if needed
    OLLAMA_API = "http://localhost:11434/api/generate"

    prompt = f"""
    Generate a multiple-choice quiz base on this text:
    {pdf_text}

    Only return the quiz, no explanations. The quiz shoul have {num_questions} questions and follow this format:
>>>>>>> Stashed changes

    [Question]
        A) [Option 1]
        B) [Option 2]
        C) [Option 3]
        D) [Option 4]
    Correct answer: [A, B, C, or D]
    """

<<<<<<< Updated upstream
    try:
        payload = {"model": model, "prompt": prompt, "stream": False}
        logger.info(f"Sending request to Ollama API using model: {model}")
        
        response = requests.post(OLLAMA_API, json=payload, timeout=120)  # 2-minute timeout

        if response.status_code == 200:
            quiz_text = response.json().get("response", "")
            if not quiz_text:
                raise Exception("Empty response from LLM")
            return quiz_text
        else:
            error_msg = f"API Error: {response.status_code}\n{response.text}"
            logger.error(error_msg)
            raise Exception(error_msg)
            
    except requests.RequestException as e:
        logger.error(f"Request error: {str(e)}")
        raise Exception(f"Failed to connect to Ollama API: {str(e)}")
    except json.JSONDecodeError:
        logger.error("Invalid JSON response from Ollama API")
        raise Exception("Invalid response format from Ollama API")
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        raise Exception(f"Quiz generation failed: {str(e)}")


# Process multiple PDF files and combine their text
def process_pdf_files(pdf_files, max_pages_per_file=10):
    """
    Process multiple PDF files and combine their text
    
    Args:
        pdf_files: List of PDF file paths
        max_pages_per_file: Maximum pages to process per file (default: 10)
        
    Returns:
        Combined text from all PDFs
    """
    all_text = ""
    
    for pdf_path in pdf_files:
        logger.info(f"Processing PDF: {pdf_path}")
        
        if not os.path.exists(pdf_path):
            logger.warning(f"File not found: {pdf_path}")
            continue
            
        try:
            pdf_text = extract_text_from_pdf(pdf_path, max_pages_per_file)
            all_text += pdf_text + "\n\n"
        except Exception as e:
            logger.error(f"Error processing {pdf_path}: {str(e)}")
    
    return all_text.strip()


# Main function (used when running the script directly)
=======
    payload = {"model": model, "prompt": prompt, "stream": False}

    response = requests.post(OLLAMA_API, json=payload)

    if response.status_code == 200:
        return response.json().get("response", "No response received.")
    else:
        return f"Error: {response.status_code}\n{response.text}"


# Main function
>>>>>>> Stashed changes
def main():
    num_questions = 4
    pdf_files = [
        # "Files/romantikken.pdf", 
        # "Files/kompendium-om-1800-tallet.pdf",
        "Files/Intro-to-Romanticism.pdf"
    ]

    print("Extracting text from PDF...")
    
    # Extract and combine text from all PDFs
<<<<<<< Updated upstream
    all_text = process_pdf_files(pdf_files)

    if not all_text:
        print("Error: No text was extracted from the PDFs.")
        return
=======
    all_text = ""
    for pdf in pdf_files:
        print(f"Processing: {pdf}")
        all_text += extract_text_from_pdf(pdf) + "\n\n"

    if len(all_text) > 128000:  # 🔹 Limit text length for token constraints
        print("Warning: Combined PDF text is too long. Using only the first 128,000 characters.")
        all_text = all_text[:128000]
>>>>>>> Stashed changes

    print("\nGenerating quiz...\n")
    quiz = generate_quiz(all_text, num_questions, "mistral")
    
    print(quiz)

# Run the script
if __name__ == "__main__":
<<<<<<< Updated upstream
=======

>>>>>>> Stashed changes
    main()
