import os
import yt_dlp


def download_audio(url: str) -> dict:
    """
    Downloads YouTube audio and returns its metadata.
    Returns:
        dict: Information about the downloaded video.
    """

    try:
        os.makedirs("temp", exist_ok=True)
        ydl_opts = {
            "format": "bestaudio/best",
            "outtmpl": "temp/%(id)s.%(ext)s",
            "quiet": True,
            "color": "no_color",
            "nocheckcertificate": True,
            "js_runtimes": {"node": {}},
            "retries": 10,
            "fragment_retries": 10,
            "extractor_retries": 5,
            "http_headers": {
                "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
                "Accept-Language": "en-US,en;q=0.9",
            },
            "postprocessors": [{
                "key": "FFmpegExtractAudio",
                "preferredcodec": "mp3",
            }],
        }
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:

            info = ydl.extract_info(url, download=True)

            file_path = ydl.prepare_filename(info)

            file_path = os.path.splitext(file_path)[0] + ".mp3"

        return {
            "audio_path": file_path,
            "video_id": info["id"],
            "title": info["title"],
            "channel": info["uploader"],
            "duration": info["duration"],
            "url": url,
        }

    except Exception as e:
        raise RuntimeError(f"Failed to download video: {e}")