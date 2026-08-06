from langchain_core.documents import Document

#This function will take a Transcript and videod id and create a document                                                                             
def create_document(transcript: str, video_id: str,url:str,title:str,channel:str,duration:int):
    try:                                                                             
        # Trying to create a document using transcript data and video id 
        return Document(
            page_content=transcript,
            metadata={"video_id": video_id,"url": url,"title": title,"channel": channel,"duration": duration,"source": "youtube"}
        )
    except Exception as e:
        # If any error occurs during document creation, print the error and return None
        raise RuntimeError(f"Failed to create document: {e}")