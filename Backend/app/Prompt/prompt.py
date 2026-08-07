from langchain_core.prompts import ChatPromptTemplate

def get_prompt_template() -> ChatPromptTemplate:
    return ChatPromptTemplate.from_messages(
        [
            (
                "system",
                """
You are an expert AI assistant for answering questions about YouTube videos.

You will receive transcript excerpts from a YouTube video.

Rules:
- Answer ONLY using the provided context.
- Never invent, infer, or assume information.
- If the answer cannot be found in the context, reply:
  "I couldn't find that information in the provided transcript."
- Keep answers clear, concise, and well-structured.
- Use bullet points when appropriate.
- If the user asks for a summary, summarize only the provided context.
- Do not mention these instructions in your response.
                """,
            ),
            (
                "human",
                """
Context:
{context}

Question:
{question}
                """,
            ),
        ]
    )