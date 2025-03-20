import fitz  # PyMuPDF for PDF processing
import requests
import json

# Function to extract text from PDF
def extract_text_from_pdf(pdf_path, max_pages=10):
    doc = fitz.open(pdf_path)
    text = ""

    for page_num in range(min(len(doc), max_pages)):  # Limit to 10 pages
        text += doc[page_num].get_text("text") + "\n\n"

    return text.strip()


# Function to generate quiz using Ollama
# Model options: llama3.2 - deepseek-r1:8b - mistral - gemma3:4b
def generate_quiz(pdf_text, num_questions = 5, model="mistral"):  # Change model if needed
    OLLAMA_API = "http://localhost:11434/api/generate"

    # Dynamically generate the format for the specified number of questions
    # quiz_format = ""
    
    # quiz_format = f"""
    # n) [Spørgsmål n]  
    #     A) [Mulighed 1]  
    #     B) [Mulighed 2]  
    #     C) [Mulighed 3]  
    #     D) [Mulighed 4]  
    # Korrekt svar: [Korrekt mulighed bogstav]
    # """

    # prompt = f"""
    # Du er en quiz-generator. Baseret på følgende danske tekst skal du lave en **multiple-choice quiz**.  
    # Brug formatet herunder.  

    # **Tekst:**  
    # {pdf_text}  

    # **Format:**  
    # {quiz_format}

    # Svar **kun** med quizzen. Giv **ingen** forklaringer, opsummeringer eller ekstra tekst. Giv præcis {num_questions} spørgsmål. Skriv quizzen på dansk.
    # """

    quiz_format = f"""
    1. [Question 1]  
        A) [Option 1]  
        B) [Option 2]  
        C) [Option 3]  
        D) [Option 4]  
    Correct answer: [Correct letter]
    """

    # prompt = f"""
    # You are a quiz generator. Based on the following text, create a **multiple-choice quiz**.  
    # Use **only** the exact format below.  

    # **Text:**  
    # {pdf_text}  

    # **Format:**  
    # [Question]  
    #     A) [Option 1]  
    #     B) [Option 2]  
    #     C) [Option 3]  
    #     D) [Option 4]  
    # Correct answer: [Correct letter]

    # Respond **only** with the quiz. Provide **no** explanations, summaries, or extra text. Write the quiz in English.
    # """

    prompt = f"""
    Summarize the most important facts from the following text in bullet points. Focus on key dates, events, concepts, and definitions.

    Text:
    {pdf_text}     
    """

    payload = {"model": model, "prompt": prompt, "stream": False}

    response = requests.post(OLLAMA_API, json=payload)

    if response.status_code == 200:
        return response.json().get("response", "No response received.")
    else:
        return f"Error: {response.status_code}\n{response.text}"


# Main function
def main():
    num_questions = 1
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
        print("Warning: Combined PDF text is too long. Using only the first 128,000 characters.")
        all_text = all_text[:128000]

    print("\nGenerating quiz...\n")
    quiz = generate_quiz(all_text, num_questions, "mistral")
    
    print(quiz)

# Run the script
if __name__ == "__main__":

    main()
