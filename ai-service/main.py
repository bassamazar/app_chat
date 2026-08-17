import os
import json
from typing import List, Optional
from dotenv import load_dotenv
from fastapi import FastAPI
import google.generativeai as genai
from pydantic import BaseModel

# تحميل المتغيرات
load_dotenv()
API_KEY = os.getenv("GEMINI_API_KEY")
MODEL_NAME = os.getenv("GEMINI_MODEL_NAME", "gemini-2.5-flash")

if not API_KEY:
  raise ValueError("❌ تحذير: مفتاح GEMINI_API_KEY غير موجود في ملف الـ .env!")

genai.configure(api_key=API_KEY)

# إعداد موديل التلخيص والذكاء العام
summarizer_model = genai.GenerativeModel(
    model_name=MODEL_NAME
)

app = FastAPI()

# ==========================================
# 1. هياكل البيانات (Pydantic Models)
# ==========================================
class MessageItem(BaseModel):
  sender: str
  content: str

class SummaryRequest(BaseModel):
  messages: List[MessageItem]
  limit_info: Optional[str] = "المحادثات الأخيرة"

class QuickReplyRequest(BaseModel):
    message: str

class TranscribeRequest(BaseModel):
    audio_base64: str
    mime_type: str

# ==========================================
# 2. الراوتات (Endpoints)
# ==========================================

@app.get("/")
def read_root():
  return {"message": "سيرفر الذكاء الاصطناعي يعمل بجميع الميزات! 🚀"}

# --- ميزة التلخيص القديمة ---
@app.post("/api/summarize")
def summarize_chat(data: SummaryRequest):
  try:
    transcript = "\n".join([f"- {msg.sender}: {msg.content}" for msg in data.messages])
    
    prompt = f"""
    You are an intelligent AI chat summarizer. Detect the language of the transcript and respond in the same language.
    Summarize the following conversation logically ({data.limit_info}):
    
    {transcript}
    """
    response = summarizer_model.generate_content(
        prompt,
        generation_config=genai.types.GenerationConfig(max_output_tokens=600, temperature=0.3),
    )
    return {"summary": response.text}
  except Exception as e:
    print(f"❌ Summarization Error: {e}")
    return {"summary": "عذراً، حدث خطأ تقني أثناء محاولة تلخيص المحادثة."}


# --- 🤖 🆕 ميزة الردود السريعة (Smart Quick Replies) ---
@app.post("/api/quick-replies")
def generate_quick_replies(data: QuickReplyRequest):
    try:
        prompt = f"""
        Generate 3 short, natural, and context-aware quick replies for the following chat message. 
        The replies MUST be in the exact SAME LANGUAGE as the message.
        Keep each reply under 5 words.
        Return ONLY a valid JSON array of strings, like: ["Reply 1", "Reply 2", "Reply 3"].
        Do not include markdown or any other text.
        
        Message: "{data.message}"
        """
        response = summarizer_model.generate_content(
            prompt,
            generation_config=genai.types.GenerationConfig(temperature=0.7),
        )
        # تنظيف النص لضمان تحويله إلى JSON صحيح
        raw_text = response.text.replace("```json", "").replace("```", "").strip()
        replies = json.loads(raw_text)
        
        return {"replies": replies}
    except Exception as e:
        print(f"❌ Quick Reply Error: {e}")
        return {"replies": []}


# --- 🤖 🆕 ميزة تحويل الصوت لنص (Voice-to-Text) ---
@app.post("/api/transcribe")
def transcribe_audio(data: TranscribeRequest):
    try:
        prompt = "Transcribe the following audio exactly as spoken in its original language. Return ONLY the transcribed text."
        
        response = summarizer_model.generate_content([
            prompt,
            {
                "mime_type": data.mime_type,
                "data": data.audio_base64
            }
        ])
        return {"text": response.text.strip()}
    except Exception as e:
        print(f"❌ Transcription Error: {e}")
        return {"text": "⚠️ عذراً، فشل الذكاء الاصطناعي في تفريغ هذا المقطع الصوتي."}