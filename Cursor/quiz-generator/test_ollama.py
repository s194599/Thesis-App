import requests
import json

def test_ollama_connection():
    """Test if Ollama is running and accessible"""
    OLLAMA_API = "http://localhost:11434/api/generate"
    
    try:
        # Simple test prompt
        payload = {
            "model": "mistral",
            "prompt": "Hello, can you hear me?",
            "stream": False
        }
        
        print("Testing connection to Ollama API...")
        response = requests.post(OLLAMA_API, json=payload, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Connection successful!")
            print(f"Response: {data.get('response', 'No response')}")
            return True
        else:
            print(f"❌ Error: {response.status_code}")
            print(response.text)
            return False
    
    except requests.exceptions.ConnectionError:
        print("❌ Connection error: Could not connect to Ollama API")
        print("Please make sure Ollama is running (command: ollama serve)")
        return False
    
    except Exception as e:
        print(f"❌ Unexpected error: {str(e)}")
        return False

if __name__ == "__main__":
    test_ollama_connection() 