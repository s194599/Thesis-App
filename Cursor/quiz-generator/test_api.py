import requests
import json

def test_api_status():
    """Test the API status endpoint"""
    API_URL = "http://localhost:5001/api/status"
    
    try:
        print("Testing API status endpoint...")
        response = requests.get(API_URL, timeout=5)
        
        if response.status_code == 200:
            data = response.json()
            print("✅ API is online!")
            print(f"Ollama available: {data.get('ollama_available', False)}")
            print(f"Message: {data.get('message', 'No message')}")
            return True
        else:
            print(f"❌ Error: {response.status_code}")
            print(response.text)
            return False
    
    except requests.exceptions.ConnectionError:
        print("❌ Connection error: Could not connect to API")
        print("Please make sure the Flask server is running")
        return False
    
    except Exception as e:
        print(f"❌ Unexpected error: {str(e)}")
        return False

def test_generate_quiz():
    """Test the generate quiz endpoint with a simple request"""
    API_URL = "http://localhost:5001/api/generate-quiz"
    
    # Don't proceed if the API is not online
    if not test_api_status():
        return False
    
    try:
        # Simple test data
        test_data = {
            "content": "The mitochondria is the powerhouse of the cell. Cells are the building blocks of life.",
            "num_questions": 1,
            "language": "english"
        }
        
        print("\nTesting quiz generation endpoint...")
        response = requests.post(API_URL, json=test_data, timeout=30)
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Quiz generation successful!")
            
            # Print the first question if available
            if data.get('questions') and len(data['questions']) > 0:
                question = data['questions'][0]
                print(f"\nQuestion: {question.get('question')}")
                print("Options:")
                for i, option in enumerate(question.get('options', [])):
                    print(f"  {chr(65+i)}) {option}")
                print(f"Correct Answer: {question.get('correctAnswer')}")
            
            return True
        elif response.status_code == 503:
            # This is the expected response if Ollama is not available
            data = response.json()
            print(f"⚠️ Expected error (Ollama not available): {data.get('error')}")
            return True
        else:
            print(f"❌ Error: {response.status_code}")
            print(response.text)
            return False
    
    except Exception as e:
        print(f"❌ Unexpected error: {str(e)}")
        return False

if __name__ == "__main__":
    print("-" * 50)
    print("API Test Suite")
    print("-" * 50)
    
    # First test the status endpoint
    api_online = test_api_status()
    
    if api_online:
        # Then test the quiz generation endpoint
        test_generate_quiz()
    
    print("-" * 50) 