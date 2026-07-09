import logging
from typing import Optional

from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnableLambda

from chatbot.prompts import build_messages
from agents.rag_agent import RagAgent

logger = logging.getLogger(__name__)


class ChatChain:
    def __init__(self, settings, rag_agent: RagAgent):
        self._settings = settings
        self._rag = rag_agent
        self._llm = None

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
            logger.info("ChatOpenAI initialized with model %s", self._settings.openai_model)
        except Exception as exc:
            logger.warning("LLM init failed: %s", exc)

    async def invoke(
        self,
        question: str,
        language: str = "fr",
        patient_context: Optional[dict] = None,
        alert_context: Optional[dict] = None,
    ) -> str:
        if self._llm is None:
            return (
                "Le service IA n'est pas disponible. "
                "Veuillez configurer OPENAI_API_KEY pour activer le chatbot."
            )

        rag_context = await self._rag.retrieve(question)

        # LCEL chain: input dict → messages list → LLM → plain string
        chain = (
            RunnableLambda(build_messages)
            | self._llm
            | StrOutputParser()
        )

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