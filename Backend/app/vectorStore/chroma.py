from langchain_chroma import Chroma 


# Here i will store documents in chroma store 
# i will receive the chunks and embedding model which will embed the chunks and store it in Chroma
def store_document(chunks, embedding_model):
    vector_db= Chroma.from_documents(
        documents= chunks,
        embedding= embedding_model,
        persist_directory="./chroma_db"
    )

    return vector_db