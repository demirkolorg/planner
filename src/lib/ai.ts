// AI yardımcı fonksiyonları
import { GoogleGenerativeAI } from "@google/generative-ai"

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GOOGLE_AI_API_KEY!)

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
    
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })
    
    const aiPrompt = `Sen bir görev yönetimi uzmanısın. ${contextStr}Verilen talep için profesyonel bir görev oluştur.

TALEP: "${prompt}"

KURALLLAR:
- Görev başlığı: Net, somut ve aksiyona yönelik (maksimum 60 karakter)
- Açıklama: Detaylı ama kısa, ne yapılacağını açıkla (maksimum 150 karakter)  
- Türkçe kullan
- JSON formatında döndür

YANIT FORMATI:
{"title": "Görev başlığı", "description": "Görev açıklaması"}

ÖRNEKİER:
Talep: "web sitesi tasarımı" → {"title": "Web sitesi tasarımını tamamla", "description": "Modern ve responsive bir web sitesi tasarımı oluştur, kullanıcı deneyimini optimize et"}
Talep: "rapor yaz" → {"title": "Aylık performans raporunu hazırla", "description": "Geçen ayın satış ve performans verilerini analiz ederek detaylı rapor oluştur"}`

    const result = await model.generateContent(aiPrompt)

    const content = result.response.text()

    if (!content) {
      throw new Error('AI yanıtı alınamadı')
    }

    // JSON parse et
    let parsedResult
    try {
      // AI yanıtından JSON'u çıkarmaya çalış
      const jsonMatch = content.match(/\{[^{}]*\}/)
      if (jsonMatch) {
        parsedResult = JSON.parse(jsonMatch[0])
      } else {
        // JSON bulunamazsa fallback
        parsedResult = { title: prompt, description: `${prompt} ile ilgili görev` }
      }
    } catch (parseError) {
      // Parse edilemezse fallback
      parsedResult = { title: prompt, description: `${prompt} ile ilgili görev` }
    }
    
    // Rastgele ekstra özellikler oluştur
    const randomPriority = getRandomPriority()
    const randomTags = getRandomTags(availableTags)
    const randomDueDate = getRandomDueDate(parentTaskDueDate)
    const randomReminders = getRandomReminders(randomDueDate, parentTaskDueDate)
    
    return {
      title: parsedResult.title || prompt,
      description: parsedResult.description || 'AI tarafından oluşturulan görev açıklaması',
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
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })
    
    const result = await model.generateContent(
      `Sen bir görev yönetimi uzmanısın. Verilen görev açıklamasını geliştir.

MEVCUT AÇIKLAMA: "${brief}"

KURALLLAR:
- Daha detaylı ve net açıklama yap
- Ne yapılacağını somut şekilde belirt  
- Türkçe kullan ve profesyonel ol
- Maksimum 200 karakter
- Sadece iyileştirilmiş açıklamayı döndür

ÖRNEK:
Girdi: "rapor yaz" → Çıktı: "Aylık satış verilerini analiz ederek kapsamlı performans raporu hazırla, grafik ve tablolarla destekle"
Girdi: "toplantı yap" → Çıktı: "Proje ilerleyişi hakkında ekip toplantısı düzenle, güncel durumu paylaş ve sonraki adımları belirle"`
    )

    const content = result.response.text()

    return content || brief
  } catch (error) {
    return brief
  }
}

export async function improveTitle(title: string): Promise<string> {
  if (!title || title.trim().length === 0) {
    return title
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })
    
    const result = await model.generateContent(
      `Sen bir görev yönetimi uzmanısın. Verilen görev başlığını iyileştir.

MEVCUT BAŞLIK: "${title}"

KURALLLAR:
- Aksiyona yönelik başlık oluştur (fiil ile başla)
- Net, somut ve profesyonel ol
- Türkçe kullan
- Maksimum 50 karakter  
- Sadece iyileştirilmiş başlığı döndür

ÖRNEKLER:
Girdi: "rapor" → Çıktı: "Aylık raporunu tamamla"
Girdi: "toplantı" → Çıktı: "Ekip toplantısını düzenle"  
Girdi: "web sitesi" → Çıktı: "Web sitesi tasarımını bitir"
Girdi: "alışveriş" → Çıktı: "Haftalık alışverişi yap"`
    )

    const content = result.response.text().trim()

    return content || title
  } catch (error) {
    console.error('Title improvement error:', error)
    return title
  }
}