import logging
from typing import Optional

from pydantic import BaseModel, Field
from langchain_core.runnables import RunnableLambda

from chatbot.prompts import build_messages
from agents.rag_agent import RagAgent

logger = logging.getLogger(__name__)


class ChatResult(BaseModel):
    answer: str = Field(
        description="The medical response to give to the patient in their language"
    )
    emergency_detected: bool = Field(
        default=False,
        description=(
            "Set to True if the patient's message describes a medical emergency requiring "
            "immediate care: severe bleeding, intense abdominal pain, severe headache with "
            "visual disturbances, absent fetal movement, convulsions, difficulty breathing, "
            "premature rupture of membranes, high fever, or signs of preeclampsia."
        )
    )
    trigger_message: Optional[str] = Field(
        default=None,
        description=(
            "One concise sentence in French summarising the emergency (used to notify medical staff). "
            "Only set when emergency_detected is True."
        )
    )


class ChatChain:
    def __init__(self, settings, rag_agent: RagAgent):
        self._settings = settings
        self._rag = rag_agent
        self._llm = None
        self._structured_llm = None

    async def initialize(self) -> None:
        if not self._settings.openai_api_key:
            logger.warning("OPENAI_API_KEY not set — chat will return a fallback message")
            return
        try:
            from langchain_openai import ChatOpenAI
            self._llm = ChatOpenAI(
                model=self._settings.openai_model,
                api_key=self._settings.openai_api_key,
                temperature=0.3,
            )
            self._structured_llm = self._llm.with_structured_output(ChatResult)
            logger.info("ChatOpenAI initialized with model %s", self._settings.openai_model)
        except Exception as exc:
            logger.warning("LLM init failed: %s", exc)

    async def invoke(
        self,
        question: str,
        language: str = "fr",
        patient_context: Optional[dict] = None,
        alert_context: Optional[dict] = None,
    ) -> ChatResult:
        if self._llm is None:
            return ChatResult(
                answer=(
                    "Le service IA n'est pas disponible. "
                    "Veuillez configurer OPENAI_API_KEY pour activer le chatbot."
                ),
                emergency_detected=False,
            )

        rag_context = await self._rag.retrieve(question)

        chain = RunnableLambda(build_messages) | self._structured_llm

        return await chain.ainvoke({
            "question": question,
            "language": language,
            "patient_context": patient_context,
            "alert_context": alert_context,
            "rag_context": rag_context,
        })

    @property
    def ready(self) -> bool:
        return self._llm is not None
