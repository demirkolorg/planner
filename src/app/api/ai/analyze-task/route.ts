import { NextRequest, NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"
import OpenAI from "openai"

// Cerebras AI client (server-side)
const cerebrasClient = new OpenAI({
  baseURL: 'https://api.cerebras.ai/v1',
  apiKey: process.env.CEREBRAS_API_KEY || 'demo-key',
})

// Google AI client (backup)
const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GOOGLE_AI_API_KEY!)

// Rate limiting için basit cache ve throttling
let lastCerebrasRequestTime = 0
let lastGoogleRequestTime = 0
let cerebrasRequestCount = 0
let googleRequestCount = 0

// Cerebras AI için gevşek limitler (yüksek limit sayesinde)
const CEREBRAS_RATE_LIMIT_WINDOW = 60000 // 1 dakika
const CEREBRAS_MAX_REQUESTS_PER_MINUTE = 50 // Çok daha yüksek
const CEREBRAS_MIN_REQUEST_INTERVAL = 100 // Çok kısa aralık

// Google AI için sıkı limitler
const GOOGLE_RATE_LIMIT_WINDOW = 60000 // 1 dakika
const GOOGLE_MAX_REQUESTS_PER_MINUTE = 3 // Düşük
const GOOGLE_MIN_REQUEST_INTERVAL = 3000 // Uzun aralık

// Öncelik kelimelerini analiz etme
function analyzePriority(text: string): string {
  const lowerText = text.toLowerCase()
  
  // Kritik/Acil kelimeler
  if (lowerText.includes('acil') || 
      lowerText.includes('kritik') || 
      lowerText.includes('ivedi') ||
      lowerText.includes('hemen') ||
      lowerText.includes('derhal')) {
    return 'CRITICAL'
  }
  
  // Yüksek öncelik kelimeler  
  if (lowerText.includes('önemli') ||
      lowerText.includes('öncelik') ||
      lowerText.includes('bugün') ||
      lowerText.includes('yarın') ||
      lowerText.includes('hızlı') ||
      lowerText.includes('çabuk')) {
    return 'HIGH'
  }
  
  // Orta öncelik kelimeler
  if (lowerText.includes('normal') ||
      lowerText.includes('orta') ||
      lowerText.includes('haftaya') ||
      lowerText.includes('gelecek') ||
      lowerText.includes('haftasonu') ||
      lowerText.includes('hafta sonu')) {
    return 'MEDIUM'
  }
  
  // Düşük öncelik kelimeler
  if (lowerText.includes('yavaş') ||
      lowerText.includes('düşük') ||
      lowerText.includes('boş') ||
      lowerText.includes('fırsat')) {
    return 'LOW'
  }
  
  return 'MEDIUM' // Varsayılan
}

// Tarih kelimelerini analiz etme
function analyzeDueDate(text: string): string | null {
  const lowerText = text.toLowerCase()
  const now = new Date()
  
  // Bugün
  if (lowerText.includes('bugün')) {
    const today = new Date(now)
    today.setHours(18, 0, 0, 0) // Bugün saat 18:00
    return today.toISOString()
  }
  
  // Yarın  
  if (lowerText.includes('yarın')) {
    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(12, 0, 0, 0) // Yarın saat 12:00
    return tomorrow.toISOString()
  }
  
  // Haftaya
  if (lowerText.includes('haftaya') || lowerText.includes('gelecek hafta')) {
    const nextWeek = new Date(now)
    nextWeek.setDate(nextWeek.getDate() + 7)
    nextWeek.setHours(12, 0, 0, 0)
    return nextWeek.toISOString()
  }
  
  // Haftasonu (en yakın cumartesi)
  if (lowerText.includes('haftasonu') || lowerText.includes('hafta sonu')) {
    const targetDate = new Date(now)
    const currentDay = now.getDay() // 0=Pazar, 6=Cumartesi
    let daysUntilSaturday = 6 - currentDay
    
    // Eğer bugün cumartesi veya pazarsa, gelecek cumartesi
    if (currentDay === 6 || currentDay === 0) {
      daysUntilSaturday = 6 - currentDay + 7
    }
    // Eğer negatifse (geçmiş) gelecek haftaya ekle
    if (daysUntilSaturday <= 0) {
      daysUntilSaturday += 7
    }
    
    targetDate.setDate(targetDate.getDate() + daysUntilSaturday)
    targetDate.setHours(10, 0, 0, 0) // Cumartesi sabah 10:00
    return targetDate.toISOString()
  }
  
  // Haftanın günleri
  const days = {
    'pazartesi': 1, 'salı': 2, 'çarşamba': 3, 'perşembe': 4,
    'cuma': 5, 'cumartesi': 6, 'pazar': 0
  }
  
  for (const [dayName, dayIndex] of Object.entries(days)) {
    if (lowerText.includes(dayName)) {
      const targetDate = new Date(now)
      const currentDay = now.getDay()
      let daysUntilTarget = dayIndex - currentDay
      
      // Eğer hedef gün geçmişse, gelecek haftaya ata
      if (daysUntilTarget <= 0) {
        daysUntilTarget += 7
      }
      
      targetDate.setDate(targetDate.getDate() + daysUntilTarget)
      targetDate.setHours(12, 0, 0, 0)
      return targetDate.toISOString()
    }
  }
  
  // Ek zaman ifadeleri
  if (lowerText.includes('akşam')) {
    const today = new Date(now)
    today.setHours(19, 0, 0, 0) // Akşam 19:00
    return today.toISOString()
  }
  
  if (lowerText.includes('öğlen')) {
    const today = new Date(now)
    today.setHours(12, 0, 0, 0) // Öğlen 12:00
    return today.toISOString()
  }
  
  if (lowerText.includes('sabah')) {
    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(9, 0, 0, 0) // Yarın sabah 9:00
    return tomorrow.toISOString()
  }

  // Sayısal ifadeler (regex ile)
  const dayPattern = /(\d+)\s*(gün|gun)\s*sonra/i
  const weekPattern = /(\d+)\s*(hafta)\s*sonra/i
  
  const dayMatch = lowerText.match(dayPattern)
  if (dayMatch) {
    const days = parseInt(dayMatch[1])
    const futureDate = new Date(now)
    futureDate.setDate(futureDate.getDate() + days)
    futureDate.setHours(12, 0, 0, 0)
    return futureDate.toISOString()
  }
  
  const weekMatch = lowerText.match(weekPattern)
  if (weekMatch) {
    const weeks = parseInt(weekMatch[1])
    const futureDate = new Date(now)
    futureDate.setDate(futureDate.getDate() + (weeks * 7))
    futureDate.setHours(12, 0, 0, 0)
    return futureDate.toISOString()
  }
  
  return null
}

// Etiket çıkarma
function extractTags(text: string): string[] {
  const words = text.toLowerCase()
    .replace(/[^\w\sşçğıöüâêîôû]/g, '') // Türkçe karakterleri koru
    .split(/\s+/)
    .filter(word => word.length > 2) // 2 karakterden uzun kelimeler
  
  // Yaygın kelimelerı filtrele
  const stopWords = new Set([
    'bir', 'bu', 'şu', 'o', 've', 'ile', 'için', 'gibi', 'olan', 'olup',
    'var', 'yok', 'ama', 'fakat', 'veya', 'ya', 'da', 'de', 'ki', 'mi',
    'mu', 'mı', 'mü', 'acil', 'kritik', 'önemli', 'bugün', 'yarın', 'haftaya',
    'yap', 'et', 'ol', 'gel', 'git', 'al', 'ver', 'gör', 'bil', 'söyle'
  ])
  
  const filteredWords = words.filter(word => !stopWords.has(word))
  
  // En fazla 3 etiket
  return filteredWords.slice(0, 3)
}

// Fallback başlık ve açıklama oluşturma
function createFallbackTitle(input: string): string {
  const cleanInput = input.trim()
  
  // Eğer zaten eylem içeriyorsa olduğu gibi kullan
  const actionWords = ['yap', 'et', 'oluştur', 'hazırla', 'tamamla', 'bitir', 'al', 'git', 'gel']
  const hasAction = actionWords.some(word => cleanInput.toLowerCase().includes(word))
  
  if (hasAction) {
    return cleanInput.charAt(0).toUpperCase() + cleanInput.slice(1)
  }
  
  // Yoksa eylem ekle
  if (cleanInput.toLowerCase().includes('unutma')) {
    return cleanInput.replace(/unutma/gi, '').trim()
  }
  
  return `${cleanInput.charAt(0).toUpperCase() + cleanInput.slice(1)}`
}

function createFallbackDescription(input: string): string {
  const keywords = ['toplantı', 'rapor', 'alışveriş', 'yemek', 'randevu', 'proje', 'görev']
  const matchedKeyword = keywords.find(keyword => input.toLowerCase().includes(keyword))
  
  if (matchedKeyword) {
    switch (matchedKeyword) {
      case 'toplantı':
        return 'Toplantı için gerekli hazırlıkları yap ve katılımcıları bilgilendir'
      case 'rapor':
        return 'Rapor hazırlığını tamamla, verileri derle ve sunum formatına getir'
      case 'alışveriş':
        return 'Alışveriş listesi hazırla ve gerekli ürünleri satın al'
      case 'yemek':
        return 'Yemek planlaması yap, malzemeleri hazırla ve zamanında gerçekleştir'
      case 'randevu':
        return 'Randevu ayarla, zamanı planla ve hatırlatıcı kur'
      default:
        return `${input} ile ilgili gerekli işlemleri tamamla`
    }
  }
  
  return `${input} ile ilgili görev - detayları planla ve uygulamaya geç`
}

// Cerebras AI rate limiting kontrolü
function canMakeCerebrasRequest(): boolean {
  const now = Date.now()
  
  // Eğer 1 dakikadan fazla zaman geçmişse sayacı sıfırla
  if (now - lastCerebrasRequestTime > CEREBRAS_RATE_LIMIT_WINDOW) {
    cerebrasRequestCount = 0
  }
  
  // Minimum aralık kontrolü
  if (now - lastCerebrasRequestTime < CEREBRAS_MIN_REQUEST_INTERVAL) {
    return false
  }
  
  // Dakikalık limit kontrolü
  if (cerebrasRequestCount >= CEREBRAS_MAX_REQUESTS_PER_MINUTE) {
    return false
  }
  
  return true
}

function updateCerebrasRequestTracking() {
  lastCerebrasRequestTime = Date.now()
  cerebrasRequestCount++
}

// Google AI rate limiting kontrolü
function canMakeGoogleRequest(): boolean {
  const now = Date.now()
  
  // Eğer 1 dakikadan fazla zaman geçmişse sayacı sıfırla
  if (now - lastGoogleRequestTime > GOOGLE_RATE_LIMIT_WINDOW) {
    googleRequestCount = 0
  }
  
  // Minimum aralık kontrolü
  if (now - lastGoogleRequestTime < GOOGLE_MIN_REQUEST_INTERVAL) {
    return false
  }
  
  // Dakikalık limit kontrolü
  if (googleRequestCount >= GOOGLE_MAX_REQUESTS_PER_MINUTE) {
    return false
  }
  
  return true
}

function updateGoogleRequestTracking() {
  lastGoogleRequestTime = Date.now()
  googleRequestCount++
}

// AI ile gelişmiş analiz (tarih dahil)
async function tryAnalyzeWithCerebras(input: string): Promise<{ title: string; description: string; suggestedDate?: string } | null> {
  if (!canMakeCerebrasRequest()) {
    return null
  }

  try {
    updateCerebrasRequestTracking()

    const today = new Date()
    const todayStr = today.toLocaleDateString('tr-TR', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })

    const completion = await cerebrasClient.chat.completions.create({
      model: "llama3.1-8b",
      messages: [
        {
          role: "system",
          content: `Sen akıllı bir görev asistanısın. Kullanıcının girdiği metni analiz et ve profesyonel bir görev haline getir. Özellikle tarihleri tahmin etmede çok başarılısın.

BUGÜN: ${todayStr}

Görev için uygun bir bitiş tarihi belirlemeye çalış. Eğer net bir tarih belirtilmemişse, görevin doğasına göre makul bir tarih öner.`
        },
        {
          role: "user",
          content: `Girdi: "${input}"

KURALLAR:
1. BAŞLIK: Kısa, net ve aksiyona yönelik özet (maksimum 50 karakter)
2. AÇIKLAMA: Detaylı ama kısa açıklama (100-200 karakter)  
3. TARİH ANALİZİ: Mümkün olduğunca bitiş tarihi öner
4. Türkçe kullan
5. JSON formatında döndür: {"title": "Görev başlığı", "description": "Detaylı açıklama", "suggestedDate": "YYYY-MM-DD veya null"}

TARİH ÖNERİ REHBERİ:
- Acil görevler: Bugün/yarın
- Toplantı hazırlığı: 1-2 gün önceden
- Rapor/proje: 1-2 hafta
- Alışveriş/günlük işler: En geç 2-3 gün
- Randevu alma: Mümkün olan en kısa süre
- Ödev/sunum: 1 hafta
- Faturaları öde: Ay sonu
- Temizlik: Hafta sonu

ÖRNEKLER:
"acil toplantı hazırlığı yap" → {"title": "Toplantı hazırlığını tamamla", "description": "Toplantı için gerekli tüm hazırlıkları yap, sunum materyallerini hazırla", "suggestedDate": "2025-01-30"}
"market alışverişi yapmayı unutma" → {"title": "Market alışverişi yap", "description": "Haftalık ihtiyaçlar için market alışverişini gerçekleştir", "suggestedDate": "2025-01-31"}
"proje raporunu hazırla" → {"title": "Proje raporunu tamamla", "description": "Proje için detaylı rapor hazırla ve analiz sonuçlarını derle", "suggestedDate": "2025-02-05"}`
        }
      ],
      temperature: 0.7,
      max_tokens: 300,
    })

    const content = completion.choices[0]?.message?.content
    if (!content) throw new Error('Boş yanıt')

    // JSON parse et
    const jsonMatch = content.match(/\{[^{}]*\}/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])
      return parsed
    }
    
    throw new Error('JSON parse hatası')
  } catch (error) {
    return null
  }
}

// Google AI ile analiz (backup)
async function tryAnalyzeWithGoogle(input: string): Promise<{ title: string; description: string; suggestedDate?: string } | null> {
  if (!canMakeGoogleRequest()) {
    return null
  }

  try {
    updateGoogleRequestTracking()

    const today = new Date()
    const todayStr = today.toLocaleDateString('tr-TR', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })

    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 300,
      }
    })
    
    const aiPrompt = `Sen akıllı bir görev asistanısın. Kullanıcının girdiği metni analiz et ve profesyonel bir görev haline getir. Tarih belirleme konusunda çok başarılısın.

BUGÜN: ${todayStr}

KULLANICI GİRİŞİ: "${input}"

KURALLLAR:
1. BAŞLIK: Kısa, net ve aksiyona yönelik özet (maksimum 50 karakter)
2. AÇIKLAMA: Detaylı ama kısa açıklama (100-200 karakter)
3. TARİH: Görevin doğasına göre makul bir bitiş tarihi öner
4. Türkçe kullan
5. JSON formatında döndür

YANIT FORMATI:
{"title": "Görev başlığı", "description": "Detaylı açıklama", "suggestedDate": "YYYY-MM-DD veya null"}

TARİH ÖNERİ KILAVUZU:
- Acil/hemen: Bugün veya yarın
- Toplantı prep: 1-2 gün öncesi  
- Rapor/proje: 1-2 hafta
- Günlük işler: 2-3 gün
- Randevu: En kısa süre
- Temizlik: Hafta sonu`

    // 3 saniye timeout
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Google AI timeout')), 3000)
    })
    
    const result = await Promise.race([
      model.generateContent(aiPrompt),
      timeoutPromise
    ]) as any
    
    const content = result.response.text()
    
    const jsonMatch = content.match(/\{[^{}]*\}/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])
      return parsed
    }
    
    throw new Error('JSON parse hatası')
  } catch (error) {
    return null
  }
}

export async function POST(request: NextRequest) {
  try {
    const { input } = await request.json()

    if (!input || typeof input !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Invalid input' },
        { status: 400 }
      )
    }

    // Önce basit analizleri yap (bunlar AI'dan bağımsız) - fallback için
    const fallbackPriority = analyzePriority(input)
    const fallbackDueDate = analyzeDueDate(input)
    const fallbackTags = extractTags(input)
    
    // 1. Önce Cerebras AI'yi dene
    let aiResult = await tryAnalyzeWithCerebras(input)
    
    // 2. Cerebras başarısızsa Google AI'yi dene
    if (!aiResult) {
      aiResult = await tryAnalyzeWithGoogle(input)
    }
    
    // 3. Her ikisi de başarısızsa local fallback
    if (!aiResult) {
      aiResult = {
        title: createFallbackTitle(input),
        description: createFallbackDescription(input),
        suggestedDate: null
      }
    }
    
    // AI'ın önerdiği tarihi kullan, yoksa local analizi kullan
    let finalDueDate = fallbackDueDate // Local analiz varsayılan
    
    if (aiResult.suggestedDate) {
      try {
        // AI'ın önerdiği tarihi parse et (YYYY-MM-DD formatında)
        const aiDate = new Date(aiResult.suggestedDate + 'T12:00:00')
        if (!isNaN(aiDate.getTime())) {
          finalDueDate = aiDate.toISOString()
        }
      } catch (error) {
        // Tarih parse hatası - fallback kullan
      }
    }
    
    const result = {
      title: aiResult.title || createFallbackTitle(input),
      description: aiResult.description || createFallbackDescription(input),
      priority: fallbackPriority, // Priority local analiz ile belirlenir
      dueDate: finalDueDate, // AI önerisi öncelikli
      tags: fallbackTags // Tags local analiz ile belirlenir
    }

    return NextResponse.json({
      success: true,
      data: result
    })

  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Analysis failed' },
      { status: 500 }
    )
  }
}