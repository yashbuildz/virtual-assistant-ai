import axios from "axios"
import dotenv from "dotenv"
dotenv.config()

const geminiResponse = async (command, assistantName, userName) => {
  if (!command || command.trim() === "") return null

  try {
    const prompt = `You are a virtual assistant named ${assistantName} created by ${userName}. 
You are not Google. You will now behave like a voice-enabled assistant.

Your task is to understand the user's natural language input and respond with a JSON object like this:

{
  "type": "general" | "google-search" | "youtube-search" | "youtube-play" | "get-time" | "get-date" | "get-day" | "get-month" | "calculator-open" | "instagram-open" | "facebook-open" | "weather-show",
  "userInput": "<original user input, only remove assistant name if present>",
  "response": "<a short spoken response to read out loud to the user>"
}

Type meanings:
- "general": factual or informational question
- "google-search": user wants to search on Google
- "youtube-search": user wants to search on YouTube
- "youtube-play": user wants to play a video or song
- "calculator-open": user wants to open calculator
- "instagram-open": user wants to open Instagram
- "facebook-open": user wants to open Facebook
- "weather-show": user wants to know weather
- "get-time": user asks for current time
- "get-date": user asks for today's date
- "get-day": user asks what day it is
- "get-month": user asks for current month

Important:
- If asked who created you, say ${userName}
- Only respond with the JSON object, nothing else. No markdown, no backticks, no explanation.

User input: ${command}`

    const result = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 1000
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    )

    let raw = result.data.choices[0].message.content
    raw = raw.replace(/```json|```/g, "").trim()
    return JSON.parse(raw)

  } catch (error) {
    console.log("STATUS:", error.response?.status)
    console.log("ERROR:", JSON.stringify(error.response?.data, null, 2))
  }
}

export default geminiResponse