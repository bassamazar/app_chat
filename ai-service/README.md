# 🤖 AI Chat Services (FastAPI + Gemini API)

This microservice handles all Artificial Intelligence features for the Chat Application, including smart summarization, quick replies generation, and voice-to-text transcription. It is built using **Python**, **FastAPI**, and powered by **Google Gemini 2.5 Flash**.

## ✨ Features
- **Smart Summarization:** Analyzes chat history and returns a structured summary.
- **Quick Replies:** Suggests 3 context-aware short replies based on the last received message.
- **Voice-to-Text Transcription:** Transcribes Base64 audio files (Voice notes) into readable text.

---

## 🛠️ Prerequisites
Before running this project, make sure you have the following installed:
- [Python 3.8+](https://www.python.org/downloads/)
- `pip` (Python package manager)

---

## 🚀 Getting Started (Installation & Setup)

Follow these steps to run the AI server locally from scratch:

### 1. Navigate to the AI directory
```bash
cd path/to/ai-service

#Install Dependencies
pip install -r requirements.txt

# Create the virtual environment
python -m venv venv

# Activate it (Windows)
venv\Scripts\activate

# Activate it (Linux / macOS)
source venv/bin/activate

uvicorn main:app --reload
