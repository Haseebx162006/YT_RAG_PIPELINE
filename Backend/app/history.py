from typing import Dict
from langchain_core.chat_history import BaseChatMessageHistory, InMemoryChatMessageHistory

# Dictionary mapping session_id -> ChatMessageHistory
_store: Dict[str, BaseChatMessageHistory] = {}


def get_session_history(session_id: str) -> BaseChatMessageHistory:
    """
    Returns the chat history for a given session_id.
    If no history exists for this session_id, a new InMemoryChatMessageHistory is created.
    """
    if session_id not in _store:
        _store[session_id] = InMemoryChatMessageHistory()
    return _store[session_id]
