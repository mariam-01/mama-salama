import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI

from config.settings import settings
from agents.rag_agent import RagAgent
from chatbot.chain import ChatChain
from api.routes import router

logging.basicConfig(level=logging.INFO, format="%(levelname)s | %(name)s | %(message)s")
logger = logging.getLogger(__name__)


async def _register_eureka():
    try:
        import py_eureka_client.eureka_client as eureka_client
        await eureka_client.init_async(
            eureka_server=settings.eureka_server,
            app_name="mama-salama-ai",
            instance_port=settings.port,
            instance_host=settings.eureka_instance_host,
        )
        logger.info("Registered with Eureka at %s", settings.eureka_server)
    except Exception as exc:
        logger.warning("Eureka registration failed (continuing without discovery): %s", exc)


async def _deregister_eureka():
    try:
        import py_eureka_client.eureka_client as eureka_client
        await eureka_client.stop_async()
    except Exception:
        pass


@asynccontextmanager
async def lifespan(app: FastAPI):
    rag = RagAgent(settings)
    await rag.initialize()

    chain = ChatChain(settings, rag)
    await chain.initialize()

    app.state.settings = settings
    app.state.rag = rag
    app.state.chain = chain

    await _register_eureka()

    logger.info("mama-salama-ai ready (rag=%s, llm=%s)", rag.ready, chain.ready)
    yield
    await _deregister_eureka()
    logger.info("mama-salama-ai shutting down")


app = FastAPI(
    title="Mama Salama AI",
    description="Prenatal care RAG chatbot for Moroccan mothers",
    version="1.0.0",
    lifespan=lifespan,
)

app.include_router(router, prefix="/api")


@app.get("/")
async def root():
    return {"message": "Mama Salama AI — see /docs for the API reference"}