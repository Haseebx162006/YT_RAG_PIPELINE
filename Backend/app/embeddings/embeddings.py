import os
from langchain_huggingface import HuggingFaceEmbeddings, HuggingFaceEndpointEmbeddings


embedding_model = HuggingFaceEndpointEmbeddings(
     model="BAAI/bge-small-en-v1.5",
    huggingfacehub_api_token=os.getenv("HF_TOKEN")
)

