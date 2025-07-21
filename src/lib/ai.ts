// AI yardımcı fonksiyonları

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'
const GROQ_API_KEY = process.env.NEXT_PUBLIC_GROQ_API_KEY

export interface AITaskSuggestion {
  title: string
  description: string
}

export async function generateTaskSuggestion(
  prompt: string, 
  projectName?: string, 
  sectionName?: string
): Promise<AITaskSuggestion> {
  try {
    const context = []
    if (projectName) context.push(`Proje: "${projectName}"`)
    if (sectionName) context.push(`Bölüm: "${sectionName}"`)
    
    const contextStr = context.length > 0 ? `${context.join(', ')} için ` : ''
    
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [{
          role: 'user',
          content: `${contextStr}"${prompt}" ile ilgili kısa ve net bir görev başlığı ve açıklama oluştur. Türkçe olsun. JSON formatında döndür: {"title": "görev başlığı", "description": "görev açıklaması"}`
        }],
        max_tokens: 200,
        temperature: 0.7
      })
    })

    if (!response.ok) {
      throw new Error(`AI API hatası: ${response.status}`)
    }

    const data = await response.json()
    const content = data.choices[0]?.message?.content

    if (!content) {
      throw new Error('AI yanıtı alınamadı')
    }

    // JSON parse et
    const result = JSON.parse(content)
    
    return {
      title: result.title || prompt,
      description: result.description || 'AI tarafından oluşturulan görev açıklaması'
    }
  } catch (error) {
    console.error('AI görev önerisi hatası:', error)
    // Fallback olarak basit sonuç döndür
    return {
      title: prompt,
      description: `${projectName ? `${projectName} projesi için ` : ''}${prompt} ile ilgili görev`
    }
  }
}

export async function improveBrief(brief: string): Promise<string> {
  try {
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [{
          role: 'user',
          content: `Bu görev açıklamasını daha detaylı ve anlaşılır hale getir: "${brief}". Türkçe olsun ve kısa tut.`
        }],
        max_tokens: 150,
        temperature: 0.6
      })
    })

    if (!response.ok) {
      throw new Error(`AI API hatası: ${response.status}`)
    }

    const data = await response.json()
    const content = data.choices[0]?.message?.content

    return content || brief
  } catch (error) {
    console.error('AI açıklama geliştirme hatası:', error)
    return brief
  }
}