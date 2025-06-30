"""
Instruction templates for different LLM models and quiz types.
This file contains the system messages, chat templates, and formatting instructions
needed for instruction-tuned language models.
"""

# System messages for different models
SYSTEM_MESSAGES = {
    "quiz_generator": """You are an expert quiz generator. You create high-quality educational quizzes based on provided content. You follow formatting instructions precisely and generate engaging, accurate questions that test understanding of the material.""",
    
    "flashcard_creator": """You are an expert flashcard creator. You create educational flashcards that help students learn and memorize important concepts. You focus on key terms, definitions, and important relationships in the content.""",
    
    "question_expert": """You are an educational assessment expert. You create questions that effectively test student knowledge and understanding. Your questions are clear, unambiguous, and properly difficulty-balanced."""
}

# Chat templates for different models
CHAT_TEMPLATES = {
    "llama3.1": {
        "format": "<|begin_of_text|><|start_header_id|>system<|end_header_id|>\n\n{system_message}<|eot_id|><|start_header_id|>user<|end_header_id|>\n\n{user_instruction}<|eot_id|><|start_header_id|>assistant<|end_header_id|>\n\n",
        "supports_system": True
    },
    
    "mistral": {
        "format": "<s>[INST] {system_message}\n\n{user_instruction} [/INST]",
        "supports_system": True
    },
    
    "generic": {
        "format": "{system_message}\n\nUser: {user_instruction}\n\nAssistant:",
        "supports_system": True
    }
}

# Instruction templates for different quiz types
QUIZ_INSTRUCTIONS = {
    "multipleChoice": {
        "template": """Create a multiple-choice quiz with {num_questions} questions based on the following content.

CONTENT:
{content}

REQUIREMENTS:
- Generate exactly {num_questions} questions
- Each question must have 4 options (A, B, C, D)
- Only ONE option should be correct
- Base all questions on the provided content
- Questions should test understanding, not just memorization
- Use EXACTLY this format:

1. [Question text]
A) [Option 1]
B) [Option 2]
C) [Option 3]
D) [Option 4]
Correct answer: [A, B, C, or D]

2. [Question text]
A) [Option 1]
B) [Option 2]
C) [Option 3]
D) [Option 4]
Correct answer: [A, B, C, or D]

Continue this format for all {num_questions} questions.""",
        "system_message": "quiz_generator"
    },
    
    "flashcards": {
        "template": """Create {num_questions} flashcards based on the following content.

CONTENT:
{content}

REQUIREMENTS:
- Generate exactly {num_questions} flashcards
- Focus on key concepts, terms, and important information
- Front side should be concise questions or terms
- Back side should provide clear explanations or definitions
- Prioritize the most important concepts from the content
- Use EXACTLY this format:

1. [Term or question]
Flip side: [Definition or answer]

2. [Term or question]
Flip side: [Definition or answer]

Continue this format for all {num_questions} flashcards.""",
        "system_message": "flashcard_creator"
    },
    
    "trueFalse": {
        "template": """Create a true/false quiz with {num_questions} questions based on the following content.

CONTENT:
{content}

REQUIREMENTS:
- Generate exactly {num_questions} questions
- Each question should test factual information from the content
- Avoid trick questions or ambiguous statements
- Use EXACTLY this format:

1. [Question text]
A) True
B) False
Correct answer: [A or B]

2. [Question text]
A) True
B) False
Correct answer: [A or B]

Continue this format for all {num_questions} questions.""",
        "system_message": "quiz_generator"
    },
    
    "shortAnswer": {
        "template": """Create a short answer quiz with {num_questions} questions based on the following content.

CONTENT:
{content}

REQUIREMENTS:
- Generate exactly {num_questions} questions
- Questions should test understanding of key concepts
- Answers should be brief but complete (1-3 sentences)
- Focus on application and comprehension, not just recall
- Use EXACTLY this format:

1. [Question text]
Correct answer: [Brief answer]

2. [Question text]
Correct answer: [Brief answer]

Continue this format for all {num_questions} questions.""",
        "system_message": "question_expert"
    }
}

def get_model_template(model_name):
    """
    Get the appropriate chat template for a model.
    
    Args:
        model_name (str): Name of the model (e.g., "llama3.1:8b")
    
    Returns:
        dict: Chat template configuration
    """
    if "llama3.1" in model_name or "llama3.2" in model_name:
        return CHAT_TEMPLATES["llama3.1"]
    elif "mistral" in model_name:
        return CHAT_TEMPLATES["mistral"]
    else:
        return CHAT_TEMPLATES["generic"]

def format_instruction_prompt(
    content, 
    question_type, 
    num_questions, 
    model_name, 
    additional_instructions=""
):
    """
    Format a complete instruction prompt for quiz generation.
    
    Args:
        content (str): Content to base the quiz on
        question_type (str): Type of quiz (multipleChoice, flashcards, etc.)
        num_questions (int): Number of questions to generate
        model_name (str): Name of the LLM model being used
        additional_instructions (str): Additional user instructions
    
    Returns:
        str: Formatted prompt ready for the LLM
    """
    # Get the quiz instruction template
    if question_type not in QUIZ_INSTRUCTIONS:
        question_type = "multipleChoice"  # fallback
    
    quiz_config = QUIZ_INSTRUCTIONS[question_type]
    
    # Get the system message
    system_key = quiz_config["system_message"]
    system_message = SYSTEM_MESSAGES[system_key]
    
    # Format the user instruction
    user_instruction = quiz_config["template"].format(
        content=content,
        num_questions=num_questions
    )
    
    # Add additional instructions if provided
    if additional_instructions:
        user_instruction += f"\n\nADDITIONAL REQUIREMENTS:\n{additional_instructions}"
    
    # Get the chat template for this model
    chat_template = get_model_template(model_name)
    
    # Format the complete prompt
    formatted_prompt = chat_template["format"].format(
        system_message=system_message,
        user_instruction=user_instruction
    )
    
    return formatted_prompt

def get_available_quiz_types():
    """
    Get all available quiz types and their descriptions.
    
    Returns:
        dict: Quiz types with descriptions
    """
    return {
        "multipleChoice": {
            "name": "Multiple Choice",
            "description": "Questions with 4 answer options (A, B, C, D)"
        },
        "flashcards": {
            "name": "Flashcards", 
            "description": "Front/back cards for memorization and review"
        },
        "trueFalse": {
            "name": "True/False",
            "description": "Simple true or false questions"
        },
        "shortAnswer": {
            "name": "Short Answer",
            "description": "Questions requiring brief written responses"
        }
    }