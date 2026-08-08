import os
from youtube_transcript_api import YouTubeTranscriptApi

from app.Ingestion_Process.yt_url import get_video_id
from app.Ingestion_Process.downloadingAudio import download_audio, get_video_metadata
from app.Ingestion_Process.speech_to_text import transcribe_audio
from app.Ingestion_Process.documentCreation import create_document
from app.processing.splitText import convert_to_chunks
from app.embeddings.embeddings import embedding_model
from app.vectorStore.chroma import store_document


def fetch_youtube_transcript(video_id: str) -> str:
    """Attempt to fetch official or auto-generated YouTube captions directly."""
    try:
        api = YouTubeTranscriptApi()
        transcript_list = api.fetch(video_id, languages=['en', 'en-US', 'en-GB', 'es', 'fr', 'de', 'hi'])
        text_lines = [item.get('text', '') for item in transcript_list if item.get('text')]
        if text_lines:
            return " ".join(text_lines)
    except Exception as e:
        print(f"youtube-transcript-api primary attempt failed for {video_id}: {e}")
    
    try:
        transcript_list = YouTubeTranscriptApi.get_transcript(video_id)
        text_lines = [item.get('text', '') for item in transcript_list if item.get('text')]
        if text_lines:
            return " ".join(text_lines)
    except Exception as e:
        print(f"youtube-transcript-api secondary attempt failed for {video_id}: {e}")

    return None


def ingest(url: str):
    audio_path = None

    try:
        # Step 1: Parse YouTube URL to extract video ID
        video_id = get_video_id(url)
        transcription = None
        video_info = None

        # Step 2: Try fast & bot-proof transcript API first
        print(f"Fetching direct transcript for video_id: {video_id}...")
        transcription = fetch_youtube_transcript(video_id)

        if transcription:
            print("Direct transcript retrieved successfully!")
            try:
                video_info = get_video_metadata(url)
            except Exception as meta_err:
                print(f"Metadata extraction warning: {meta_err}")
                video_info = {
                    "video_id": video_id,
                    "title": f"YouTube Video ({video_id})",
                    "channel": "YouTube Channel",
                    "duration": 0,
                    "url": url,
                }
        else:
            # Step 3: Fallback to audio download via yt-dlp + Whisper ASR
            print("No direct transcript available. Falling back to audio download & ASR...")
            video_info = download_audio(url)
            audio_path = video_info.get("audio_path")
            transcription = transcribe_audio(audio_path)

        if not transcription:
            raise RuntimeError("Could not retrieve transcript for this YouTube video.")

        # Step 4: Create a LangChain Document from transcript
        document = create_document(
            transcription,
            video_id,
            url,
            video_info["title"],
            video_info["channel"],
            video_info["duration"]
        )

        # Step 5: Split document into semantic chunks
        chunked_documents = convert_to_chunks(document)

        # Step 6: Embed and store chunks in ChromaDB
        store_document(chunked_documents, embedding_model=embedding_model)

        return {
            "status": "success",
            "video_id": video_id,
            "title": video_info["title"],
            "channel": video_info["channel"],
            "chunks_count": len(chunked_documents)
        }

    finally:
        # Cleanup: Remove temporary audio file to save disk space
        if audio_path and os.path.exists(audio_path):
            try:
                os.remove(audio_path)
                print(f"Cleaned up temp audio file: {audio_path}")
            except OSError:
                pass
