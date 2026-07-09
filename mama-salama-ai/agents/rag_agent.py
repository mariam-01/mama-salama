import logging
from pathlib import Path
from typing import Optional

logger = logging.getLogger(__name__)


class RagAgent:
    def __init__(self, settings):
        self._settings = settings
        self._vector_store = None
        self._retriever = None

    async def initialize(self) -> None:
        embeddings = self._build_embeddings()
        if embeddings is None:
            logger.warning("No embeddings available — RAG is disabled")
            return
        try:
            from langchain_chroma import Chroma
            Path(self._settings.chroma_path).mkdir(parents=True, exist_ok=True)
            self._vector_store = Chroma(
                collection_name="medical_docs",
                embedding_function=embeddings,
                persist_directory=self._settings.chroma_path,
            )
            self._retriever = self._vector_store.as_retriever(search_kwargs={"k": 3})
            logger.info("ChromaDB initialized at %s", self._settings.chroma_path)
        except Exception as exc:
            logger.warning("ChromaDB init failed — RAG disabled: %s", exc)

    def _build_embeddings(self):
        if self._settings.openai_api_key:
            try:
                from langchain_openai import OpenAIEmbeddings
                return OpenAIEmbeddings(api_key=self._settings.openai_api_key)
            except Exception as exc:
                logger.warning("OpenAI embeddings init failed: %s", exc)
        try:
            from langchain_huggingface import HuggingFaceEmbeddings
            logger.warning("OPENAI_API_KEY not set — using local HuggingFace embeddings")
            return HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
        except Exception as exc:
            logger.warning("HuggingFace embeddings init failed: %s", exc)
        return None

    async def retrieve(self, question: str) -> str:
        if self._retriever is None:
            return ""
        try:
            docs = await self._retriever.ainvoke(question)
            return "\n---\n".join(d.page_content for d in docs) if docs else ""
        except Exception as exc:
            logger.warning("RAG retrieval failed: %s", exc)
            return ""

    async def ingest(self, texts: list[str], metadatas: list[dict] | None = None) -> int:
        if self._vector_store is None:
            raise RuntimeError("Vector store not initialized")
        from langchain_core.documents import Document
        docs = [
            Document(page_content=t, metadata=metadatas[i] if metadatas else {})
            for i, t in enumerate(texts)
        ]
        await self._vector_store.aadd_documents(docs)
        return len(docs)

    @property
    def ready(self) -> bool:
        return self._vector_store is not None