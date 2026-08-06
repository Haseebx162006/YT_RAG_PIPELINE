from dotenv import load_dotenv
from langchain_groq import ChatGroq


load_dotenv()

llm = ChatGroq(
    model="llama-3.3-70b-versatile",
    temperature=0.5
)

result= llm.invoke("Who is the Prime Minister of Pakistan")
print("+++++++++++++++++++++++++Response+++++++++++++++++++++++++++")
print(result.content)
