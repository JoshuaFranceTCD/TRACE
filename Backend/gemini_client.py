import os
from dotenv import load_dotenv
from google import genai

load_dotenv()

# 1. Initialize the Client with your API key
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

# 2. Create/Define the agent properties
# Note: In the latest SDK, 'agents' are often managed via the client.
response = client.models.generate_content(
    model="gemini-1.5-flash", 
    config={
        "system_instruction": "You are a helper agent that can answer questions."
    },
    contents="Hello"
)

print(response.text)