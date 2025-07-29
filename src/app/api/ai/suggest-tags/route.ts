import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import jwt from "jsonwebtoken"
import { db } from "@/lib/db"
import { GoogleGenerativeAI } from "@google/generative-ai"

interface SuggestTagsRequest {
  title: string
  description?: string
}

// Google AI ile gerçek etiket önerisi
async function generateTagsWithAI(title: string, description?: string): Promise<string[]> {
  try {
    const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GOOGLE_AI_API_KEY!)
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

    const prompt = `Sen bir görev yönetimi uzmanısın. Verilen görev bilgilerine göre en uygun etiketleri öner.

GÖREV BİLGİSİ:
Başlık: "${title}"
${description ? `Açıklama: "${description}"` : ''}

TENİMAT KURALLARI:
- 1-3 adet etiket öner (fazla değil)  
- Türkçe ve kısa olsun (max 2 kelime)
- Görevin kategorisini ve önemini yansıtsın
- Sadece etiket isimlerini yaz, başka açıklama yapma
- Her etiket ayrı satırda olsun

ÖRNEK ETİKETLER:
İş, Kişisel, Acil, Sağlık, Ev İşleri, Finans, Eğitim, Spor, Teknoloji, Tasarım, Araştırma, Sosyal, Seyahat, Okuma, Alışveriş, Toplantı, Yazılım, Proje

YANIT FORMATI (örnek):
İş
Acil
Teknoloji`

    const result = await model.generateContent(prompt)
    const response = result.response.text().trim()
    
    if (!response) {
      throw new Error('AI yanıt vermedi')
    }

    // Yanıtı satır satır ayır ve temizle
    const tags = response
      .split('\n')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0 && !tag.includes(':') && !tag.includes('.'))
      .slice(0, 3) // Maksimum 3 etiket

    return tags.length > 0 ? tags : ['Genel']
    
  } catch (error) {
    console.error('Google AI API error:', error)
    // Fallback: Basit kelime analizi
    return generateFallbackTags(title, description)
  }
}

// Fallback etiket önerisi (Google AI başarısız olursa)
function generateFallbackTags(title: string, description?: string): string[] {
  const content = `${title} ${description || ''}`.toLowerCase()
  
  const tagMappings: { keywords: string[], tag: string }[] = [
    { keywords: ['acil', 'urgent', 'hızlı', 'şimdi', 'kritik'], tag: 'Acil' },
    { keywords: ['iş', 'work', 'toplantı', 'meeting', 'proje', 'şirket'], tag: 'İş' },
    { keywords: ['kişisel', 'personal', 'özel', 'kendim'], tag: 'Kişisel' },
    { keywords: ['alışveriş', 'market', 'satın', 'sipariş'], tag: 'Alışveriş' },
    { keywords: ['sağlık', 'doktor', 'hastane', 'ilaç', 'muayene'], tag: 'Sağlık' },
    { keywords: ['ev', 'temizlik', 'tamir', 'organize'], tag: 'Ev İşleri' },
    { keywords: ['para', 'banka', 'ödeme', 'fatura'], tag: 'Finans' },
    { keywords: ['kod', 'yazılım', 'app', 'web', 'tech'], tag: 'Teknoloji' },
    { keywords: ['spor', 'egzersiz', 'gym', 'fitness'], tag: 'Spor' },
    { keywords: ['okuma', 'kitap', 'makale', 'araştır'], tag: 'Okuma' }
  ]
  
  const foundTags: string[] = []
  
  for (const mapping of tagMappings) {
    for (const keyword of mapping.keywords) {
      if (content.includes(keyword) && !foundTags.includes(mapping.tag)) {
        foundTags.push(mapping.tag)
        if (foundTags.length >= 3) break
      }
    }
    if (foundTags.length >= 3) break
  }
  
  return foundTags.length > 0 ? foundTags : ['Genel']
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("token")?.value
    
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string }
    const body: SuggestTagsRequest = await request.json()
    
    const { title, description } = body

    if (!title.trim()) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 })
    }

    // Google AI ile etiket önerilerini al
    const suggestedTagNames = await generateTagsWithAI(title, description)
    
    // Önerilen etiketleri veritabanında oluştur veya bul
    const createdTags = []
    
    // Varsayılan renkler
    const defaultColors = [
      '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', 
      '#06b6d4', '#22c55e', '#f97316', '#84cc16', '#6366f1'
    ]
    
    for (let i = 0; i < suggestedTagNames.length; i++) {
      const tagName = suggestedTagNames[i]
      
      // Önce etiketin zaten var olup olmadığını kontrol et
      let existingTag = await db.tag.findFirst({
        where: {
          name: tagName,
          userId: decoded.userId
        }
      })
      
      if (!existingTag) {
        // Etiket yoksa oluştur - rastgele renk ata
        const color = defaultColors[i % defaultColors.length]
        
        existingTag = await db.tag.create({
          data: {
            name: tagName,
            color: color,
            userId: decoded.userId
          }
        })
      }
      
      createdTags.push(existingTag)
    }
    
    return NextResponse.json({ 
      tags: createdTags.map(tag => ({
        id: tag.id,
        name: tag.name,
        color: tag.color
      })),
      source: 'ai' // AI tarafından oluşturulduğunu belirt
    })
    
  } catch (error) {
    console.error("Error suggesting tags:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}