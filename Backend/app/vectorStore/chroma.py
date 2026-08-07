from langchain_chroma import Chroma


def store_document(chunks, embedding_model):
    """
    Store document chunks in ChromaDB.
    Checks for existing video_id to prevent duplicate embeddings when re-ingesting.
    """
    persist_dir = "./chroma_db"

    # Connect to existing DB (or create if first time)
    vector_db = Chroma(
        persist_directory=persist_dir,
        embedding_function=embedding_model
    )

    # Check if this video is already stored — prevent duplicate embeddings
    if chunks and chunks[0].metadata.get("video_id"):
        video_id = chunks[0].metadata["video_id"]
        existing = vector_db.get(where={"video_id": video_id})

        if existing and existing.get("ids"):
            # Delete old chunks for this video before re-inserting
            vector_db.delete(ids=existing["ids"])
            print(f"Removed {len(existing['ids'])} existing chunks for video_id: {video_id}")

    # Add new chunks
    vector_db.add_documents(documents=chunks)
    print(f"Stored {len(chunks)} new chunks in ChromaDB")

    return vector_db
