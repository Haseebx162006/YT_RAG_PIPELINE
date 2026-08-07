
from langchain_classic.chains import create_history_aware_retriever, create_retrieval_chain
from langchain_classic.chains.combine_documents import create_stuff_documents_chain

from langchain_core.runnables.history import RunnableWithMessageHistory
from langchain_chroma import Chroma
from langchain_groq import ChatGroq

from app.Prompt.prompt import get_contextualize_prompt, create_combined_prompt
from app.embeddings.embeddings import embedding_model
from app.config import settings
from app.history import get_session_history


def chat_pipeline(query: str, session_id: str = "default_session"):
    
    try:
        # 1. Connect to ChromaDB vector store
        vector_db = Chroma(
            persist_directory="./chroma_db",
            embedding_function=embedding_model
        )

        retriever = vector_db.as_retriever(
            search_type="similarity",
            search_kwargs={"k": 5}
        )

        # 2. Setup Groq LLM with fallback models
        groq_models = ["llama-3.3-70b-versatile", "llama3-70b-8192", "mixtral-8x7b-32768"]
        llm = None
        last_error = None

        for model_name in groq_models:
            try:
                llm = ChatGroq(
                    model=model_name,
                    groq_api_key=settings.GROQ_API_KEY,
                    temperature=0.2,
                    max_tokens=1024
                )
                break
            except Exception as e:
                last_error = e
                continue

        if not llm:
            raise RuntimeError(f"All Groq models failed to initialize. Last error: {last_error}")

        # 3. Create History-Aware Retriever
        # Reformulates follow-up questions using past chat history so ChromaDB searches accurately
        contextualize_prompt = get_contextualize_prompt()
        history_aware_retriever = create_history_aware_retriever(
            llm=llm,
            retriever=retriever,
            prompt=contextualize_prompt
        )

        # Combines retrieved context documents + chat history + user question into LLM prompt
        combined_prompt = create_combined_prompt()
        question_answer_chain = create_stuff_documents_chain(
            llm=llm,
            prompt=combined_prompt
        )

        # 5. Create Retrieval Chain
        # Connects history-aware retriever to question-answer chain
        rag_chain = create_retrieval_chain(
            history_aware_retriever,
            question_answer_chain
        )

        # 6. Wrap in RunnableWithMessageHistory
        # Automatically loads & persists chat history per session_id
        conversational_rag_chain = RunnableWithMessageHistory(
            rag_chain,
            get_session_history,
            input_messages_key="input",
            history_messages_key="chat_history",
            output_messages_key="answer"
        )

        # 7. Execute Chain with Session Config
        response = conversational_rag_chain.invoke(
            {"input": query},
            config={"configurable": {"session_id": session_id}}
        )

        return {
            "status": "success",
            "response": response.get("answer", "No response generated.")
        }

    except Exception as e:
        return {
            "status": "error",
            "message": str(e)
        }