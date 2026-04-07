# Neural.FIT: The Peak Human Performance Protocol

![System Status](https://img.shields.io/badge/SYS.INIT-OK-brightgreen)
![Version](https://img.shields.io/badge/Version-v1.0.0-blue)
![Architecture](https://img.shields.io/badge/Architecture-Decoupled_Full_Stack-lightgrey)

**Live Demo:** [app.neural.fit](https://neural-fit-your-ai-health-companion.vercel.app/)

The legacy fitness paradigm is broken. Generic PDF templates and flat caloric targets ignore individual morphology and daily kinetic fluctuations. **Neural.FIT** upgrades static tracking to living protocols, treating the human body as a machine requiring precise input, output, and optimization.

---

## System Architecture Overview

Neural.FIT operates on a fully decoupled, millisecond-responsive full-stack architecture:

* **Frontend (Hosted on Vercel):** A highly responsive UI client built with **React**, **Vite**, and **Tailwind CSS**.
* **Backend (Hosted on Render):** The core algorithmic engine powered by **Python** and **FastAPI**, utilizing **Pandas** for processing complex biometric CSV datasets.
* **Intelligence Layer:** Raw REST integrations with **Google Cloud's Gemini 2.5 Flash API** for sub-50ms real-time coaching protocol adjustments.

---

## Core Subsystems

### Subsystem 1: The Dynamic Hypertrophy Engine (Output)
Our backend utilizes a custom `PYTHON_CONSTRAINT_ENGINE`. Rather than static workout days, it uses a Constraint Satisfaction approach to build a balanced 7-day training split. It maps precise exercises, sets, and reps while ensuring you never overtrain, dynamically scaling difficulty to your exact experience level and current fatigue metrics.

### Subsystem 2: Day-by-Day Macro Scaling (Input)
Flat, unchanging macro targets stall progress. Neural.FIT utilizes **Kinetic-Metabolic Alignment**.
* **Heavy Output Days:** The system detects intense programmed output and dynamically scales up carbohydrate and total caloric targets to fuel performance.
* **Rest/Low Output Days:** The system scales back targets to optimize fat loss and recovery.
* The AI quantifies every single meal so that prescribed caloric intake perfectly shadows prescribed daily kinetic output.

### Subsystem 3: The Elite AI Coach (Optimization)
An active, real-time optimization hub powered by **Google Gemini 2.5 Flash**. It provides instant, highly specific scientific guidance on recovery, biomechanics, and nutrient timing. 
* *Example:* Request an alternative to back squats, and the AI will dynamically substitute with Bulgarian Split Squats, adapting the kinetic load parameters to accommodate specific user constraints (e.g., knee pain).

---

## The Peak Performance Loop
The system operates on a continuous feedback loop optimizing human morphology:
1.  **Kinetic Load Mapping** dictates...
2.  **Macro Fueling** which drives...
3.  **Recovery** which enables a higher kinetic load. 

---

## Roadmap: The V2 Architecture

We are actively expanding the protocol to bridge the gap between software and real-time biological telemetry:

* **Biometric Hardware Sync:** Direct wearable API integration (Apple Watch / WearOS). The diet engine will dynamically adjust based on real-time intra-day calorie burn, continuous heart rate, and skin temperature.
* **Biomechanical Computer Vision:** On-device computer vision utilizing the user's native phone camera. It will analyze lifting form, back angles, and joint dorsiflexion to correct biomechanics in real-time.

---

## Local Installation & Setup

### Prerequisites
* Node.js (v18+)
* Python (3.10+)
* Google Gemini API Key

### Frontend Setup
\`\`\`bash
cd frontend
npm install
npm run dev
\`\`\`

### Backend Setup
\`\`\`bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows use \`venv\Scripts\activate\`
pip install -r requirements.txt
uvicorn main:app --reload
\`\`\`
*Don't forget to add your `.env` file with your `GEMINI_API_KEY` to get the app running!*

---
*PROJECT: HUMAN MACHINE INTERFACE*
