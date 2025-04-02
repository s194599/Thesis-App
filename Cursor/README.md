# Thesis-App

## **First-Time Setup**

### Server Setup

1. Ensure Python **3.10+** is installed.
2. Open a terminal and navigate to the server directory:
   ```sh
   cd server
   ```
3. Create a virtual environment:
   ```sh
   python -m venv venv
   ```
4. Activate the virtual environment:
   - **Linux/Mac:**
     ```sh
     source venv/bin/activate
     ```
   - **Windows (CMD/Powershell):**
     ```sh
     .\venv\Scripts\Activate
     ```
5. Install dependencies:
   ```sh
   pip install -r requirements.txt
   ```
6. **Install FFmpeg** (required for video transcription):
   - **Windows:**
     - Download from https://www.gyan.dev/ffmpeg/builds/
     - Extract and create a folder at `C:\ffmpeg`
     - Copy contents from the extracted `bin` folder to `C:\ffmpeg\bin`
     - Add `C:\ffmpeg\bin` to your system PATH
     - Verify installation: `ffmpeg -version`
   - **Mac:**
     ```sh
     brew install ffmpeg
     ```
   - **Linux:**
     ```sh
     sudo apt update && sudo apt install ffmpeg
     ```
7. Start the server:
   ```sh
   python server.py
   ```

---

### Client Setup

1. Download and install [Node.js](https://nodejs.org/en) (if not installed).
2. Open a terminal and navigate to the client directory:
   ```sh
   cd client
   ```
3. Install dependencies:
   ```sh
   npm install
   ```
4. Start the React app:
   ```sh
   npm start
   ```

---

## **Running the App After Setup**

If the setup has already been done, follow these steps:

### **Start the Server**

1. Open a terminal and navigate to the server directory:
   ```sh
   cd server
   ```
2. Activate the virtual environment (if not already active):
   - **Linux/Mac:**
     ```sh
     source venv/bin/activate
     ```
   - **Windows:**
     ```sh
     .\venv\Scripts\activate
     ```
3. Start the server:
   ```sh
   python server.py
   ```

### **Start the Client**

1. Open another terminal and navigate to the client directory:
   ```sh
   cd client
   ```
2. Start the React app:
   ```sh
   npm start
   ```

---

## **Features**

- Generate quizzes from various input types:
  - Text input
  - PDF documents
  - Web pages
  - Video files (with automatic transcription)
- Customize quiz parameters
- Edit and save quizzes
- Export quizzes in different formats

---

## **Dependencies**

### Server Dependencies

- Flask 3.0.2: Web framework
- Flask-CORS: Cross-origin resource sharing
- PyMuPDF: PDF processing
- Whisper-Timestamped: AI-powered speech recognition for video transcription
- FFmpeg: Required for audio extraction from video files

### Client Dependencies

- React: UI framework
- React Bootstrap: UI components
- Axios: HTTP client
- React Router: Routing

---

## **Notes**

- The server runs on `http://127.0.0.1:5000`
- The client runs on `http://localhost:3000`
- If you install new dependencies, run `pip install -r requirements.txt` (server) or `npm install` (client) again.
- To add new server dependencies, run `pip freeze > requirements.txt`
- For video files, ensure FFmpeg is correctly installed and available in your system PATH.
- Supported video formats: MP4, MOV, AVI, WEBM
- Maximum file size: 50MB
