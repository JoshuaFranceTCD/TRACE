# TRACE - Forensic Support System

TRACE is a forensic support system that analyzes biological evidence (DNA sequence and Fingerprints) from crime scenes, compares it to suspect databases, and outputs a ranked list of suspects with confidence scores and a detailed analysis explaining the reasoning.

## Two Ways to Run TRACE

### Method 1: Use the Deployed Version (Recommended)
You can directly access the fully deployed version of TRACE online without installing anything:
**[https://trace-dun.vercel.app/](https://trace-dun.vercel.app/)** (though be aware of delays in responses between moderate periods of usage, due to backend sleeping)

---

### Method 2: Run Locally (Development Setup)

If you'd like to run TRACE on your local machine, the project is divided into two separate applications that need to be started: the **Backend** and the **Frontend**.

#### Prerequisites:
- **Node.js**: [Download and Install Node.js](https://nodejs.org/)
- **Python 3.10+**: [Download and Install Python](https://www.python.org/)

#### 1. Setup and Run the Backend (FastAPI Python Server)
The backend handles the core logic for forensic processing, specifically DNA matching through sequence alignment and fingerprint matching through ORB feature detection.

1. Open a new terminal and navigate to the `Backend` directory:
   ```bash
   cd Backend
   ```
2. (Optional but recommended) Create and activate a Python virtual environment:
   ```bash
   python -m venv .venv
   # On Windows:
   .venv\Scripts\activate
   # On Mac/Linux:
   source .venv/bin/activate
   ```
3. Install the required Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Set up an environment variable for Gemini (Required to generate Forensic Reports):
   Create a `.env` file in the `Backend` directory and define your `GEMINI_API_KEY`:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   ```
5. Start the backend server:
   ```bash
   uvicorn api:app --reload
   ```
   *The backend will be running on `http://localhost:8000` (or whichever port is defined).*

#### 2. Setup and Run the Frontend (React + Vite App)
The frontend is a beautifully designed, modern UI where you can upload evidence files and manage analysis cases.

1. Open **another** new terminal and navigate to the `Frontend` directory:
   ```bash
   cd Frontend
   ```
2. Install the necessary Node dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
4. Open your browser and navigate to the local URL provided in the terminal (usually `http://localhost:5173`).

---

## Testing TRACE
When testing TRACE, you generally need the following types of files (example files can be found inside the `Backend/Data` folder):
1. **Crime Scene DNA (`.fasta`)**: Sequence found at the crime scene.
2. **Crime Scene Fingerprint (`.BMP` or similar)**: The fingerprint image from the evidence.
3.  **Crime Scene Hair type (`.csv` or similar)**: The type of hair found at the crime scene.
4. **Suspect DNA Database (`.fasta`)**: Sequence database containing the suspects.
5. **Suspect Fingerprints (Images)**: Used to cross-reference the suspects.
6. **Suspect Scene Hair Fibres (`.csv` or similar)**: Suspects's hair data.
