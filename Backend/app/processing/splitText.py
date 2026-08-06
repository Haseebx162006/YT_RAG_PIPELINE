from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.documents import Document


def convert_to_chunks(text: Document):
    text_splitter=RecursiveCharacterTextSplitter(
        chunk_size=400,
        chunk_overlap=50
    )
    return text_splitter.split_documents([text])


