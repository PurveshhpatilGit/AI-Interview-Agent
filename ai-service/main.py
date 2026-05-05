import uvicorn
import os
import json
import tempfile
import re
from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from typing import Optional
from groq import Groq
import whisper

load_dotenv()

AI_SERVICE_PORT = int(os.getenv("AI_SERVICE_PORT", 8000))
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GROQ_MODEL_NAME = os.getenv("GROQ_MODEL_NAME", "llama-3.3-70b-versatile")

if not GROQ_API_KEY:
    print("WARNING: GROQ_API_KEY missing in ai-service/.env")

client = Groq(api_key=GROQ_API_KEY)

app = FastAPI(title="AI Interviewer Microservice", version="3.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

try:
    print("Loading Whisper Model...")
    WHISPER_MODEL = whisper.load_model("base.en")
    print("Whisper Model Loaded Successfully")
except Exception as e:
    print("Whisper loading failed:", e)
    WHISPER_MODEL = None


class QuestionResquest(BaseModel):
    role: str = "MERN Stack Developer"
    level: str = "Junior"
    count: int = 5
    interview_type: str = "coding-mix"


class QuestionResponse(BaseModel):
    questions: list[str]
    model_used: str


class EvaluationRequest(BaseModel):
    question: str
    question_type: str
    role: str
    level: str
    user_answer: Optional[str] = None
    user_code: Optional[str] = None


class EvaluationResponse(BaseModel):
    technicalScore: int
    confidenceScore: int
    aiFeedback: str
    idealAnswer: str


@app.get("/")
async def root():
    return {"message": "AI Service Running with Groq", "model": GROQ_MODEL_NAME}


def ask_groq(prompt: str) -> str:
    response = client.chat.completions.create(
        model=GROQ_MODEL_NAME,
        messages=[
            {"role": "system", "content": "You are a professional technical interviewer."},
            {"role": "user", "content": prompt},
        ],
        temperature=0.5,
    )
    return response.choices[0].message.content.strip()


@app.post("/generate-questions", response_model=QuestionResponse)
async def generate_questions(request: QuestionResquest):
    try:
        if request.interview_type == "coding-mix":
            coding_count = max(1, int(request.count * 0.2))
            oral_count = request.count - coding_count
            instruction = (
                f"First {coding_count} questions should be coding challenges. "
                f"Remaining {oral_count} questions should be oral conceptual questions."
            )
        else:
            instruction = "All questions should be oral conceptual questions."

        prompt = f"""
Generate exactly {request.count} interview questions for a {request.level} {request.role}.

Rules:
{instruction}
One question per line.
No numbering.
No bullet points.
No extra explanation.
"""

        text = ask_groq(prompt)

        questions = [
            re.sub(r"^\d+[\).\-\s]*", "", q).strip("-• ").strip()
            for q in text.split("\n")
            if q.strip()
        ]

        return QuestionResponse(
            questions=questions[: request.count],
            model_used=GROQ_MODEL_NAME,
        )

    except Exception as e:
        print("Question generation error:", e)
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/transcribe")
async def transcribe_audio(file: UploadFile = File(...)):
    try:
        if WHISPER_MODEL is None:
            raise HTTPException(status_code=503, detail="Whisper Model is not loaded")

        audio_bytes = await file.read()

        with tempfile.NamedTemporaryFile(delete=False, suffix=".mp3") as tmp:
            temp_path = tmp.name
            tmp.write(audio_bytes)

        result = WHISPER_MODEL.transcribe(temp_path)
        os.remove(temp_path)

        return {"transcription": result["text"].strip()}

    except Exception as e:
        if "temp_path" in locals() and os.path.exists(temp_path):
            os.remove(temp_path)

        print("Transcription error:", e)
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/evaluate", response_model=EvaluationResponse)
async def evaluate(request: EvaluationRequest):
    try:
        answer_text = request.user_answer or request.user_code or ""

        prompt = f"""
You are a strict technical interviewer.

Evaluate the candidate answer.

Role: {request.role}
Level: {request.level}
Question Type: {request.question_type}
Question: {request.question}
Candidate Answer: {answer_text}

Rules:
- If answer is empty, irrelevant, or nonsense, give 0 score.
- technicalScore must be 0 to 100.
- confidenceScore must be 0 to 100.
- Return ONLY valid JSON.
- No markdown.
- No explanation outside JSON.

JSON format:
{{
  "technicalScore": 0,
  "confidenceScore": 0,
  "aiFeedback": "short feedback",
  "idealAnswer": "ideal answer"
}}
"""

        text = ask_groq(prompt)
        text = text.replace("```json", "").replace("```", "").strip()

        match = re.search(r"\{.*\}", text, re.DOTALL)
        if match:
            text = match.group(0)

        try:
            data = json.loads(text)
        except Exception:
            print("RAW GROQ RESPONSE:", text)
            return EvaluationResponse(
                technicalScore=0,
                confidenceScore=0,
                aiFeedback="AI response parsing failed.",
                idealAnswer="Could not parse AI response.",
            )

        return EvaluationResponse(
            technicalScore=int(data.get("technicalScore", 0)),
            confidenceScore=int(data.get("confidenceScore", 0)),
            aiFeedback=str(data.get("aiFeedback", "No feedback generated.")),
            idealAnswer=str(data.get("idealAnswer", "No ideal answer generated.")),
        )

    except Exception as e:
        print("Evaluation error:", e)
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=AI_SERVICE_PORT)