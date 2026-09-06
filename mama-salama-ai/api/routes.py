import json
from typing import Optional
from fastapi import APIRouter, Form, HTTPException, Request, UploadFile, File
from pydantic import BaseModel

router = APIRouter()


class PatientContextDto(BaseModel):
    pregnancy_week: Optional[int] = None
    blood_type: Optional[str] = None
    weight: Optional[float] = None
    height: Optional[float] = None
    due_date: Optional[str] = None
    number_of_previous_pregnancies: Optional[int] = None
    number_of_children: Optional[int] = None
    multiple_pregnancy: Optional[bool] = None
    follow_up_type: Optional[str] = None
    supplements: Optional[list[str]] = None
    medical_history: Optional[str] = None
    allergies: Optional[str] = None


class AlertContextDto(BaseModel):
    has_red_alert: bool = False
    alert_date: Optional[str] = None
    systolic_bp: Optional[int] = None
    diastolic_bp: Optional[int] = None
    temperature: Optional[float] = None
    heart_rate: Optional[int] = None
    blood_sugar: Optional[float] = None


class ChatRequest(BaseModel):
    question: str
    language: str = "fr"
    patient_context: Optional[PatientContextDto] = None
    alert_context: Optional[AlertContextDto] = None


class ChatResponse(BaseModel):
    answer: str
    source: str
    rag_available: bool
    emergency_detected: bool = False
    trigger_message: Optional[str] = None


class IngestRequest(BaseModel):
    texts: list[str]
    metadatas: Optional[list[dict]] = None


class IngestResponse(BaseModel):
    indexed: int


class VoiceChatResponse(BaseModel):
    transcription: str
    answer: str
    source: str
    rag_available: bool
    emergency_detected: bool = False
    trigger_message: Optional[str] = None


@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest, req: Request):
    chain = req.app.state.chain
    rag = req.app.state.rag
    settings = req.app.state.settings

    result = await chain.invoke(
        question=request.question,
        language=request.language,
        patient_context=request.patient_context.model_dump() if request.patient_context else None,
        alert_context=request.alert_context.model_dump() if request.alert_context else None,
    )
    return ChatResponse(
        answer=result.answer,
        source=f"OpenAI {settings.openai_model} + ChromaDB RAG",
        rag_available=rag.ready,
        emergency_detected=result.emergency_detected,
        trigger_message=result.trigger_message,
    )


@router.post("/ingest", response_model=IngestResponse)
async def ingest(request: IngestRequest, req: Request):
    rag = req.app.state.rag
    if not rag.ready:
        raise HTTPException(status_code=503, detail="Vector store not initialized")
    count = await rag.ingest(request.texts, request.metadatas)
    return IngestResponse(indexed=count)


@router.post("/ingest/pdf", response_model=IngestResponse)
async def ingest_pdf(req: Request, file: UploadFile = File(...)):
    rag = req.app.state.rag
    if not rag.ready:
        raise HTTPException(status_code=503, detail="Vector store not initialized")
    try:
        from pypdf import PdfReader
        import io
        content = await file.read()
        reader = PdfReader(io.BytesIO(content))
        texts = [page.extract_text() for page in reader.pages if page.extract_text()]
        if not texts:
            raise HTTPException(status_code=400, detail="No text extracted from PDF")
        metadatas = [{"source": file.filename, "page": i} for i in range(len(texts))]
        count = await rag.ingest(texts, metadatas)
        return IngestResponse(indexed=count)
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"PDF ingestion failed: {exc}")


@router.post("/voice-chat", response_model=VoiceChatResponse)
async def voice_chat(
    req: Request,
    file: UploadFile = File(...),
    language: str = Form("fr"),
    patient_context: Optional[str] = Form(None),
    alert_context: Optional[str] = Form(None),
):
    settings = req.app.state.settings
    chain = req.app.state.chain
    rag = req.app.state.rag

    if not settings.openai_api_key:
        raise HTTPException(status_code=503, detail="OpenAI API key not configured")

    from openai import AsyncOpenAI
    client = AsyncOpenAI(api_key=settings.openai_api_key)

    audio_bytes = await file.read()
    try:
        transcription_resp = await client.audio.transcriptions.create(
            model="whisper-1",
            file=(file.filename or "audio.webm", audio_bytes),
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Transcription failed: {exc}")

    transcription = transcription_resp.text

    p_ctx = json.loads(patient_context) if patient_context else None
    a_ctx = json.loads(alert_context) if alert_context else None

    result = await chain.invoke(
        question=transcription,
        language=language,
        patient_context=p_ctx,
        alert_context=a_ctx,
    )

    return VoiceChatResponse(
        transcription=transcription,
        answer=result.answer,
        source=f"Whisper-1 + {settings.openai_model} + ChromaDB RAG",
        rag_available=rag.ready,
        emergency_detected=result.emergency_detected,
        trigger_message=result.trigger_message,
    )


@router.get("/health")
async def health(req: Request):
    return {
        "status": "ok",
        "vector_store": req.app.state.rag.ready,
        "llm": req.app.state.chain.ready,
    }
