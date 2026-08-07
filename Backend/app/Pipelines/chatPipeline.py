from langchain_chroma import Chroma
from langchain_groq import ChatGroq

from app.Prompt.prompt import get_prompt_template
from app.embeddings.embeddings import embedding_model


# This is the chat pipeline function which will take the user query and return the response from the model
def chat_pipeline(query: str):
    try:
        
        vector_db = Chroma(
            persist_directory="./chroma_db",
            embedding_function=embedding_model
        )

      
        retriever = vector_db.as_retriever(
            search_type="mmr",
            search_kwargs={"k": 3}
        )

        
        docs = retriever.invoke(query)

        context = ""

        for doc in docs:
            context += doc.page_content + "\n\n"

        
        prompt = get_prompt_template()

        formatted_prompt = prompt.invoke(
            {
                "context": context,
                "question": query
            }
        )

        
        llm = ChatGroq(
            model="openai/gpt-oss-120b",
            temperature=0,
            max_tokens=1024,
        )

        
        response = llm.invoke(formatted_prompt)

        return {
            "status": "success",
            "response": response.content
        }

    except Exception as e:
        return {
            "status": "error",
            "message": str(e)
        }