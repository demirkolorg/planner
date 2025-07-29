import { NextRequest, NextResponse } from "next/server"

const CEREBRAS_API_KEY = process.env.CEREBRAS_API_KEY!
const CEREBRAS_BASE_URL = "https://api.cerebras.ai/v1"

interface CerebrasRequest {
  prompt: string
  maxTokens?: number
}

export async function POST(request: NextRequest) {
  try {
    const { prompt, maxTokens = 200 }: CerebrasRequest = await request.json()

    if (!prompt?.trim()) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 })
    }

    if (!CEREBRAS_API_KEY || CEREBRAS_API_KEY.includes('Placeholder') || CEREBRAS_API_KEY === 'csk-wv3f226wkymwtnrx8cexkvm4ep9y2vkw6jw4kkxfp3kh2d5j') {
      console.error('CEREBRAS_API_KEY is not valid - using fallback response')
      // Geçici fallback - gerçek AI key olmadığında basit yanıt döndür
      return NextResponse.json({ 
        content: "Akıllı görev önerisi (Demo): Bu görev için detaylı bir plan hazırla ve gerekli adımları belirle.",
        fallback: true 
      })
    }

    const response = await fetch(`${CEREBRAS_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CEREBRAS_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "llama3.1-8b",
        messages: [
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: maxTokens,
        temperature: 0.7
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Cerebras API error:', response.status, errorText)
      return NextResponse.json({ 
        error: `Cerebras API error: ${response.status}`,
        details: errorText 
      }, { status: response.status })
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content

    if (!content) {
      return NextResponse.json({ error: "No content in AI response" }, { status: 500 })
    }

    return NextResponse.json({ content: content.trim() })

  } catch (error) {
    console.error("Cerebras API proxy error:", error)
    return NextResponse.json({ 
      error: "Internal server error",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}