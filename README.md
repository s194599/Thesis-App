
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
6. Start the server:
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

## **Notes**
- The server runs on `http://127.0.0.1:5000`
- The client runs on `http://localhost:3000`
- If you install new dependencies, run `pip install -r requirements.txt` (server) or `npm install` (client) again.
