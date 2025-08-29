// AI yardımcı fonksiyonları - Cerebras API kullanıyor

const CEREBRAS_BASE_URL = "https://api.cerebras.ai/v1"

// Client-side'da çalışacak şekilde API çağrısı yapalım
async function makeCerebrasRequest(prompt: string, maxTokens: number = 200): Promise<string> {
  const response = await fetch('/api/ai/cerebras', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt,
      maxTokens
    })
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`AI API error: ${response.status} - ${error}`)
  }

  const data = await response.json()
  return data.content
}

export interface AITaskSuggestion {
  title: string
  description: string
  priority?: string
  tags?: string[]
  dueDate?: string | null
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
    
    const aiPrompt = `Sen bir görev yönetimi uzmanısın. ${contextStr}Verilen talep için yaratıcı ve çeşitli görev önerileri oluştur.

TALEP: "${prompt}"

YARATICI BAŞLIK KURALLARI:
- Farklı başlık stilleri kullan: eylem odaklı, sonuç odaklı, proses odaklı
- İş dünyası terminolojisini zengin şekilde kullan
- Bağlama uygun profesyonel ifadeler seç
- Motive edici ve net başlıklar oluştur
- Maksimum 70 karakter

ÇEŞİTLİ BAŞLIK ÖRNEKLERİ:
Eylem odaklı: "Tasarla", "Geliştir", "Analiz et", "Optimize et", "Uygula"
Sonuç odaklı: "...ı tamamla", "...nin finalini yap", "...i başarıyla bitir"
Proses odaklı: "...için strateji oluştur", "...nin planını hazırla", "...i detaylandır"
Profesyonel: "...audit'ini gerçekleştir", "...framework'ünü kur", "...roadmap'ini çiz"

ACIKLAMA KURALLARI:
- Detaylı ama özlü açıklama (maksimum 180 karakter)
- Süreç adımlarını belirt
- Değer yaratma odaklı yaklaş
- Türkçe kullan ve JSON formatında döndür

YANIT FORMATI:
{"title": "Görev başlığı", "description": "Görev açıklaması"}

ZENGİN ÖRNEKLER:
Talep: "web sitesi tasarımı" → {"title": "Modern web sitesi tasarımını optimize et", "description": "Kullanıcı deneyimini merkeze alan responsive tasarım geliştir, UI/UX prensiplerini uygula ve performansı artır"}
Talep: "rapor yaz" → {"title": "Kapsamlı performans audit'ini tamamla", "description": "Veri analizi ile detaylı performans raporu hazırla, trend analizi yap ve aksiyon önerileri sun"}
Talep: "toplantı planla" → {"title": "Stratejik ekip toplantısının roadmap'ini çiz", "description": "Agenda oluştur, katılımcıları belirle, materyal hazırla ve follow-up planını detaylandır"}`

    const content = await makeCerebrasRequest(aiPrompt, 200)

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
    
    return {
      title: parsedResult.title || prompt,
      description: parsedResult.description || 'AI tarafından oluşturulan görev açıklaması',
      priority: randomPriority,
      tags: randomTags,
      dueDate: randomDueDate,
    }
  } catch (error) {
    console.error('Cerebras AI error:', error)
    // Fallback olarak akıllı sonuç döndür
    const fallbackPriority = getRandomPriority()
    const fallbackTags = getRandomTags(availableTags)
    const fallbackDueDate = getRandomDueDate(parentTaskDueDate)
    
    // Daha zengin ve çeşitli fallback title oluştur
    const titleStyles = [
      `${prompt.charAt(0).toUpperCase() + prompt.slice(1)}ı optimize et`,
      `${prompt.charAt(0).toUpperCase() + prompt.slice(1)} sürecini tamamla`,
      `${prompt.charAt(0).toUpperCase() + prompt.slice(1)} için strateji geliştir`,
      `${prompt.charAt(0).toUpperCase() + prompt.slice(1)}nin audit'ini yap`,
      `${prompt.charAt(0).toUpperCase() + prompt.slice(1)} roadmap'ini hazırla`,
      `${prompt.charAt(0).toUpperCase() + prompt.slice(1)}i başarıyla finalize et`,
      `${prompt.charAt(0).toUpperCase() + prompt.slice(1)} framework'ünü kur`,
      `${prompt.charAt(0).toUpperCase() + prompt.slice(1)}nin analizini gerçekleştir`
    ]
    
    const randomTitleStyle = titleStyles[Math.floor(Math.random() * titleStyles.length)]
    
    const descriptionStyles = [
      `${projectName ? `${projectName} projesi kapsamında ` : ''}${prompt} için kapsamlı planlama yap, detaylı analiz gerçekleştir ve optimize edilmiş çözüm sun`,
      `${projectName ? `${projectName} projesi çerçevesinde ` : ''}${prompt} sürecini iyileştir, best practice'leri uygula ve verimlilik artır`,
      `${projectName ? `${projectName} projesi dahilinde ` : ''}${prompt} için stratejik yaklaşım benimse, riskleri değerlendir ve başarı metriklerini belirle`,
      `${projectName ? `${projectName} projesi bünyesinde ` : ''}${prompt} konusunda derinlemesine araştırma yap, bulgularını raporla ve aksiyon planı oluştur`
    ]
    
    const randomDescriptionStyle = descriptionStyles[Math.floor(Math.random() * descriptionStyles.length)]
    
    return {
      title: randomTitleStyle,
      description: randomDescriptionStyle,
      priority: fallbackPriority,
      tags: fallbackTags,
      dueDate: fallbackDueDate,
    }
  }
}

export async function improveBrief(brief: string): Promise<string> {
  try {
    const aiPrompt = `Sen bir görev yönetimi uzmanısın. Verilen görev açıklamasını geliştir.

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

    const content = await makeCerebrasRequest(aiPrompt, 150)
    return content || brief
  } catch (error) {
    console.error('Cerebras AI error:', error)
    return brief
  }
}

export async function improveTitle(title: string): Promise<string> {
  if (!title || title.trim().length === 0) {
    return title
  }

  try {
    const aiPrompt = `Sen bir görev yönetimi uzmanısın. Verilen görev başlığını yaratıcı ve profesyonel şekilde iyileştir.

MEVCUT BAŞLIK: "${title}"

ZENGİN İYİLEŞTİRME KURALLARI:
- Farklı başlık stilleri kullan: eylem odaklı, sonuç odaklı, proses odaklı
- İş dünyası terminolojisini kullanarak zenginleştir
- Motive edici ve profesyonel yaklaş
- Net ve somut ol, belirsizlik bırakma
- Maksimum 60 karakter
- Sadece iyileştirilmiş başlığı döndür

ÇEŞİTLİ İYİLEŞTİRME STİLLERİ:
Eylem odaklı: "...ı optimize et", "...i geliştir", "...nin analizini yap"
Sonuç odaklı: "...ı başarıyla tamamla", "...nin finalini gerçekleştir"
Proses odaklı: "...için strateji oluştur", "...roadmap'ini hazırla"
Profesyonel: "...audit'ini yap", "...framework'ünü kur"

ZENGİN ÖRNEKLER:
Girdi: "rapor" → Çıktı: "Kapsamlı performans audit'ini tamamla"
Girdi: "toplantı" → Çıktı: "Stratejik ekip toplantısının roadmap'ini çiz"
Girdi: "web sitesi" → Çıktı: "Modern web sitesi tasarımını optimize et"
Girdi: "alışveriş" → Çıktı: "Tedarik sürecinin analizini gerçekleştir"
Girdi: "araştır" → Çıktı: "Pazar araştırması framework'ünü kur"`

    const content = await makeCerebrasRequest(aiPrompt, 80)
    return content || title
  } catch (error) {
    console.error('Cerebras AI error:', error)
    
    // Zenginleştirilmiş fallback seçenekleri
    const enrichedFallbacks = [
      `${title.charAt(0).toUpperCase() + title.slice(1)}ın audit'ini gerçekleştir`,
      `${title.charAt(0).toUpperCase() + title.slice(1)} sürecini optimize et`,
      `${title.charAt(0).toUpperCase() + title.slice(1)} için strateji geliştir`,
      `${title.charAt(0).toUpperCase() + title.slice(1)}nin analizini tamamla`,
      `${title.charAt(0).toUpperCase() + title.slice(1)} roadmap'ini hazırla`,
      `${title.charAt(0).toUpperCase() + title.slice(1)}i başarıyla finalize et`
    ]
    
    const randomFallback = enrichedFallbacks[Math.floor(Math.random() * enrichedFallbacks.length)]
    return randomFallback
  }
}