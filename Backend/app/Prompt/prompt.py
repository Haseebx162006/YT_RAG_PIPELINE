from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder

def get_contextualize_prompt() -> ChatPromptTemplate:
    """
    Prompt used by create_history_aware_retriever.
    Reformulates follow-up user questions into standalone questions
    based on the conversation history.
    """
    contextualize_system_prompt = (
        "Given a chat history and the latest user question "
        "which might reference context in the chat history, "
        "formulate a standalone question which can be understood "
        "without the chat history. Do NOT answer the question, "
        "just reformulate it if needed and otherwise return it as is."
    )

    return ChatPromptTemplate.from_messages(
        [
            ("system", contextualize_system_prompt),
            MessagesPlaceholder(variable_name="chat_history"),
            ("human", "{input}"),
        ]
    )


def create_combined_prompt() -> ChatPromptTemplate:
    """
    Prompt used by create_stuff_documents_chain to answer the user's question
    using the retrieved transcript context and past conversation history.
    """
    system_prompt = (
        "You are an expert AI assistant for answering questions about YouTube videos based on their transcript.\n\n"
        "Ground your answer in the provided transcript context. "
        "If a term or topic is mentioned in the video transcript, explain how it is used or discussed. "
        "If the information cannot be found in the context, state: "
        "'I couldn't find information about that topic in the provided transcript.'\n\n"
        "Context:\n{context}"
    )

    return ChatPromptTemplate.from_messages(
        [
            ("system", system_prompt),
            MessagesPlaceholder(variable_name="chat_history"),
            ("human", "{input}"),
        ]
    )