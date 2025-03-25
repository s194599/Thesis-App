import fitz  # PyMuPDF for PDF processing
import requests
import json


# Function to extract text from PDF
def extract_text_from_pdf(pdf_path, max_pages=10):
    doc = fitz.open(pdf_path)
    text = ""

    for page_num in range(min(len(doc), max_pages)):  # Limit to 10 pages
        text += doc[page_num].get_text("text") + "\n"  # Corrected line

    return text.strip()


# Function to generate quiz using Ollama
# Model options: llama3.2 - deepseek-r1:8b - mistral - gemma3:4b
def generate_quiz(pdf_text, num_questions=5, model="mistral"):  # Change model if needed
    OLLAMA_API = "http://localhost:11434/api/generate"

    prompt = f"""
    Generate a multiple-choice quiz base on this text:
    {pdf_text}

    Only return the quiz, no explanations. The quiz shoul have {num_questions} questions and follow this format:

    [Question]
        A) [Option 1]
        B) [Option 2]
        C) [Option 3]
        D) [Option 4]
    Correct answer: [A, B, C, or D]
    """

    payload = {"model": model, "prompt": prompt, "stream": False}

    response = requests.post(OLLAMA_API, json=payload)

    if response.status_code == 200:
        return response.json().get("response", "No response received.")
    else:
        return f"Error: {response.status_code}\n{response.text}"


# Main function
def main():
    num_questions = 4
    pdf_files = [
        # "Files/romantikken.pdf",
        # "Files/kompendium-om-1800-tallet.pdf",
        "Files/Intro-to-Romanticism.pdf"
    ]

    print("Extracting text from PDF...")

    # Extract and combine text from all PDFs
    all_text = ""
    for pdf in pdf_files:
        print(f"Processing: {pdf}")
        all_text += extract_text_from_pdf(pdf) + "\n\n"

    if len(all_text) > 128000:  # 🔹 Limit text length for token constraints
        print(
            "Warning: Combined PDF text is too long. Using only the first 128,000 characters."
        )
        all_text = all_text[:128000]

    print("\nGenerating quiz...\n")
    quiz = generate_quiz(all_text, num_questions, "mistral")

    print(quiz)


# Run the script
if __name__ == "__main__":

    main()
