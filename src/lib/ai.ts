// AI yardımcı fonksiyonları

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'
const GROQ_API_KEY = process.env.NEXT_PUBLIC_GROQ_API_KEY

export interface AITaskSuggestion {
  title: string
  description: string
  priority?: string
  tags?: string[]
  dueDate?: string | null
  reminders?: string[]
}

// Rastgele değer seçimi için yardımcı fonksiyonlar
const getRandomPriority = (): string => {
  const priorities = ['Düşük', 'Orta', 'Yüksek', 'Acil', 'Yok']
  return priorities[Math.floor(Math.random() * priorities.length)]
}

const getRandomTags = (availableTags: string[]): string[] => {
  if (availableTags.length === 0) return []
  
  const numTags = Math.floor(Math.random() * 3) + 1 // 1-3 arası etiket
  const shuffled = [...availableTags].sort(() => 0.5 - Math.random())
  return shuffled.slice(0, Math.min(numTags, availableTags.length))
}

const getRandomDueDate = (parentTaskDueDate?: Date | null): string | null => {
  const shouldHaveDueDate = Math.random() > 0.4 // %60 olasılık
  if (!shouldHaveDueDate) return null
  
  const now = new Date()
  let maxDate: Date
  
  if (parentTaskDueDate) {
    // Parent task'ın bitiş tarihi varsa, o tarihten önce bir tarih seç
    const parentEndOfDay = parentTaskDueDate.getHours() === 0 && parentTaskDueDate.getMinutes() === 0
      ? new Date(parentTaskDueDate.getFullYear(), parentTaskDueDate.getMonth(), parentTaskDueDate.getDate(), 23, 59, 59)
      : parentTaskDueDate
    
    maxDate = parentEndOfDay
    console.log('AI: Parent task due date detected:', parentTaskDueDate, 'Max date for AI suggestion:', maxDate)
  } else {
    // Parent task yoksa normal mantık (14 gün)
    maxDate = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000)
  }
  
  // Bugün ile maxDate arasında rastgele bir tarih seç
  const timeDiff = maxDate.getTime() - now.getTime()
  if (timeDiff <= 0) return null // Parent task geçmişte ise tarih verme
  
  const randomTime = Math.random() * timeDiff
  const dueDate = new Date(now.getTime() + randomTime)
  
  return dueDate.toISOString()
}

const getRandomReminders = (dueDate?: string | null, parentTaskDueDate?: Date | null): string[] => {
  if (!dueDate || Math.random() > 0.5) return [] // %50 olasılık
  
  const due = new Date(dueDate)
  const reminders: string[] = []
  
  // Rastgele hatırlatıcılar ekle
  const options = [
    new Date(due.getTime() - 24 * 60 * 60 * 1000), // 1 gün önce
    new Date(due.getTime() - 2 * 60 * 60 * 1000),  // 2 saat önce
    new Date(due.getTime() - 60 * 60 * 1000),      // 1 saat önce
  ]
  
  const numReminders = Math.floor(Math.random() * 2) + 1 // 1-2 hatırlatıcı
  for (let i = 0; i < numReminders && i < options.length; i++) {
    const reminderDate = options[i]
    
    // Parent task kontrolü - hatırlatıcı parent task'ın bitiş tarihinden sonra olamaz
    if (parentTaskDueDate) {
      const parentEndOfDay = parentTaskDueDate.getHours() === 0 && parentTaskDueDate.getMinutes() === 0
        ? new Date(parentTaskDueDate.getFullYear(), parentTaskDueDate.getMonth(), parentTaskDueDate.getDate(), 23, 59, 59)
        : parentTaskDueDate
      
      if (reminderDate > parentEndOfDay) {
        continue // Bu hatırlatıcıyı atla
      }
    }
    
    reminders.push(reminderDate.toLocaleString('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }))
  }
  
  return reminders
}

export async function generateTaskSuggestion(
  prompt: string, 
  projectName?: string, 
  sectionName?: string,
  availableTags: string[] = [],
  parentTaskDueDate?: Date | null
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
    let result
    try {
      // AI yanıtından JSON'u çıkarmaya çalış
      const jsonMatch = content.match(/\{[^{}]*\}/)
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0])
      } else {
        // JSON bulunamazsa fallback
        result = { title: prompt, description: `${prompt} ile ilgili görev` }
      }
    } catch (parseError) {
      // Parse edilemezse fallback
      result = { title: prompt, description: `${prompt} ile ilgili görev` }
    }
    
    // Rastgele ekstra özellikler oluştur
    const randomPriority = getRandomPriority()
    const randomTags = getRandomTags(availableTags)
    const randomDueDate = getRandomDueDate(parentTaskDueDate)
    const randomReminders = getRandomReminders(randomDueDate, parentTaskDueDate)
    
    return {
      title: result.title || prompt,
      description: result.description || 'AI tarafından oluşturulan görev açıklaması',
      priority: randomPriority,
      tags: randomTags,
      dueDate: randomDueDate,
      reminders: randomReminders
    }
  } catch (error) {
    // Fallback olarak basit sonuç döndür
    const fallbackPriority = getRandomPriority()
    const fallbackTags = getRandomTags(availableTags)
    const fallbackDueDate = getRandomDueDate(parentTaskDueDate)
    const fallbackReminders = getRandomReminders(fallbackDueDate, parentTaskDueDate)
    
    return {
      title: prompt,
      description: `${projectName ? `${projectName} projesi için ` : ''}${prompt} ile ilgili görev`,
      priority: fallbackPriority,
      tags: fallbackTags,
      dueDate: fallbackDueDate,
      reminders: fallbackReminders
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
    return brief
  }
}