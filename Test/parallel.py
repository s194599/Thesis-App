import fitz  # PyMuPDF for PDF processing
import requests
import json
import math
from concurrent.futures import ThreadPoolExecutor, as_completed

# Ollama API endpoint
OLLAMA_API = "http://localhost:11434/api/generate"

# Function to extract text from PDF
def extract_text_from_pdf(pdf_path, max_pages=10):
    doc = fitz.open(pdf_path)
    text = ""

    for page_num in range(min(len(doc), max_pages)):  # Limit to 10 pages
        text += doc[page_num].get_text("text") + "\n\n"

    return text.strip()

# Function to split text into equal chunks
def split_text(text, num_chunks):
    chunk_size = math.ceil(len(text) / num_chunks)
    return [text[i:i + chunk_size] for i in range(0, len(text), chunk_size)]

# Function to generate quiz for a single text chunk (used in parallel processing)
def fetch_quiz(chunk, model="mistral"):
    # quiz_format = f"""
    # 1. [Spørgsmål 1]  
    #     A) [Mulighed 1]  
    #     B) [Mulighed 2]  
    #     C) [Mulighed 3]  
    #     D) [Mulighed 4]  
    # Korrekt svar: [Korrekt bogstav]
    # """

    # prompt = f"""
    # Du er en quiz-generator. Baseret på følgende danske tekst skal du lave en **2-spørgsmåls multiple-choice quiz**.  
    # Brug **kun** det præcise format herunder.  

    # **Tekst:**  
    # {chunk}  

    # **Format:**  
    # {quiz_format}

    # Svar **kun** med quizzen. Giv **ingen** forklaringer, opsummeringer eller ekstra tekst. Skriv quizzen på dansk.
    # """

    quiz_format = f"""
    1. [Question 1]  
        A) [Option 1]  
        B) [Option 2]  
        C) [Option 3]  
        D) [Option 4]  
    Correct answer: [Correct letter]
    """

    prompt = f"""
    You are a quiz generator. Based on the following text, create a **2-question multiple-choice quiz**.  
    Use **only** the exact format below.  

    **Text:**  
    {chunk}  

    **Format:**  
    {quiz_format}

    Respond **only** with the quiz. Provide **no** explanations, summaries, or extra text. Write the quiz in English.
    """


    payload = {"model": model, "prompt": prompt, "stream": False}

    try:
        response = requests.post(OLLAMA_API, json=payload, timeout=120)  # 30s timeout
        if response.status_code == 200:
            return response.json().get("response", "")
        else:
            return f"Error: {response.status_code}\n{response.text}"
    except requests.exceptions.RequestException as e:
        return f"Request Error: {str(e)}"

# Function to generate quiz using multiple threads
def generate_quiz_concurrent(pdf_text, num_questions=6, model="mistral"):
    num_questions_per_prompt = 2  # Each API call generates 2 questions
    num_prompts = num_questions // num_questions_per_prompt

    # Split the text into chunks
    text_chunks = split_text(pdf_text, num_prompts)

    print(f"🚀 Sending {num_prompts} requests in parallel...")

    quiz_results = []
    with ThreadPoolExecutor(max_workers=2) as executor:  # Adjust workers as needed
        future_to_chunk = {executor.submit(fetch_quiz, chunk, model): i for i, chunk in enumerate(text_chunks)}

        for future in as_completed(future_to_chunk):
            chunk_index = future_to_chunk[future]
            try:
                quiz_results.append(future.result())
                print(f"✅ Chunk {chunk_index + 1}/{num_prompts} completed")
            except Exception as e:
                print(f"❌ Error processing chunk {chunk_index + 1}: {e}")

    return "\n\n".join(quiz_results)

# Main function
def main():
    num_questions = 4  # Must be even
    pdf_files = [
        "Files/Intro-to-Romanticism.pdf",
        #"Files/kompendium-om-1800-tallet.pdf",
    ]

    print("📄 Extracting text from PDFs...")

    # Extract and combine text from all PDFs
    all_text = ""
    for pdf in pdf_files:
        print(f"🔍 Processing: {pdf}")
        all_text += extract_text_from_pdf(pdf) + "\n\n"

    # Limit text length for token constraints
    if len(all_text) > 128000:
        print("⚠️ Text too long, truncating to 128,000 characters.")
        all_text = all_text[:128000]

    print("\n📝 Generating quiz...\n")
    quiz = generate_quiz_concurrent(all_text, num_questions, "mistral")

    print("\n📢 Final Quiz:\n")
    print(quiz)

# Run the script
if __name__ == "__main__":
    main()
