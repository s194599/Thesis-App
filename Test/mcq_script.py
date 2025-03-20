import ollama
import fitz


# Step 1: Extract text from PDF
def extract_text_from_pdf(pdf_path):
    doc = fitz.open(pdf_path)
    text = ""
    for page_num in range(doc.page_count):
        page = doc.load_page(page_num)
        text += page.get_text()  # Extract text from each page
    return text

# Step 2: Generate quiz based on the extracted text
def generate_quiz_from_text(text):
    # You can adjust this prompt to ask for a quiz or specific question types
    prompt = f"You are a quiz generator. Based on the following text, create a 2-question multiple choice quiz. Label the correct answer {text}"
    response = ollama.generate(model='llama3.2', prompt=prompt)
    #response = ollama.generate(model='deepseek-r1:8b', prompt=prompt)
    return response['response']

# Example PDF path
pdf_path = "Files/romantikken.pdf"

# Extract text from the PDF
extracted_text = extract_text_from_pdf(pdf_path)

# Generate a quiz based on the extracted text
quiz = generate_quiz_from_text(extracted_text)

print(quiz)