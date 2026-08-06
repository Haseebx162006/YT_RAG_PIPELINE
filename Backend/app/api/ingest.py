from app.Ingestion_Process.yt_url import get_video_id

from app.Ingestion_Process.downloadingAudio import download_audio
from app.Ingestion_Process.speech_to_text import transcribe_audio
from app.Ingestion_Process.documentCreation import create_document
from app.processing.splitText import convert_to_chunks
from app.embeddings.embeddings import embedding_model
from app.vectorStore.chroma import store_document


from dotenv import load_dotenv
load_dotenv()



def ingest(url:str):

    # First i will fetch the youtube id from the url 

    video_id=get_video_id(url)

    # in this function i willdownload the audio from  the youtbe video and store it 

    video = download_audio(url)

    # Extracting the audio path 
    audio_path = video["audio_path"]

    # Generating Transcription 
    transcription = transcribe_audio(audio_path)

    # Converting the transcription into a string format for further processing

    # Creating a document 
    document = create_document(transcription, video_id,url,video["title"],video["channel"],video["duration"])

    # Creating the chunks of the document for further processing and storage
    chunked_documents= convert_to_chunks(document)


    #storing in db
    vector_db= store_document(chunked_documents,embedding_model= embedding_model)

    return {
        "status": "success",
        "video_id": video_id,
        "title": video["title"],
        "channel": video["channel"],
        "chunks_count": len(chunked_documents)
    }


if __name__ == "__main__":
    ingest("https://youtu.be/7MuiScUkboE?si=o2ZCMBZAdfaJhlfX")