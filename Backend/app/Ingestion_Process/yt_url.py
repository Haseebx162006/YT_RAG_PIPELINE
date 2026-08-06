# from youtube_transcript_api import YouTubeTranscriptApi

# #Fetching the Youtube Video id that is provided by the User 
# def get_video_id(url):
#     parsed = urlparse(url)

#     if parsed.hostname=="youtu.be":
#         return parsed.path[1:]

#     return parse_qs(parsed.query)["v"][0]


# # Fetching the Transcript data from the youtube Id
# def fetch_transcript(id):
#     yt= YouTubeTranscriptApi()
#     transcript= yt.fetch(id)
#     return transcript



# result= get_video_id("https://youtu.be/etnLX7m2MiA?si=0luAkM47us__C3eT")

# print(fetch_transcript(result))



# from langchain_community.document_loaders import YoutubeLoader

# loader = YoutubeLoader.from_youtube_url(
#     "https://youtu.be/etnLX7m2MiA",
#     add_video_info=True
# )

# docs = loader.load()


# First Part has not worked because Youtube_API blocks the request from user side and the 
# 2nd Approach YtLoader also fails because it is inconsistent and also uses yt_transcript_api behind the door 


#############################################################################################################################


from urllib.parse import urlparse, parse_qs


def get_video_id(url: str) -> str:
    parsed = urlparse(url)

    # https://youtu.be/VIDEO_ID
    if parsed.hostname == "youtu.be":
        return parsed.path.lstrip("/")

    # https://youtube.com/watch?v=VIDEO_ID
    if parsed.path == "/watch":
        video_id = parse_qs(parsed.query).get("v")

        if video_id:
            return video_id[0]

    # https://youtube.com/shorts/VIDEO_ID
    if parsed.path.startswith("/shorts/"):
        return parsed.path.split("/")[2]

    # https://youtube.com/live/VIDEO_ID
    if parsed.path.startswith("/live/"):
        return parsed.path.split("/")[2]

    raise ValueError("Invalid YouTube URL")