import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    // Motivasyon sözleri havuzu - Türkçe üretkenlik ve motivasyon odaklı
    const quotes = [
      {
        quote: "Başarı, günlük rutinlerde saklıdır. Her gün biraz ilerlemeniz, büyük değişimlere yol açar.",
        author: "AI İlham Kaynağı",
        category: "productivity"
      },
      {
        quote: "Zamanınızı yönetmek için önce enerjinizi yönetmeyi öğrenin. Doğru zamanda doğru işi yapmak en önemli beceridir.",
        author: "AI İlham Kaynağı",
        category: "time-management"
      },
      {
        quote: "Her tamamlanan görev, size bir sonraki zorluğu aşmak için gereken güveni verir. Küçük adımlar büyük başarıların temelidir.",
        author: "AI İlham Kaynağı",
        category: "achievement"
      },
      {
        quote: "Odaklanma sadece ne yapacağınızı değil, ne yapmayacağınızı da belirlemeyi gerektirir. Önceliklerinizi net tutun.",
        author: "AI İlham Kaynağı",
        category: "focus"
      },
      {
        quote: "İdeal plan mükemmel planın düşmanıdır. Bugün küçük bir adım atmak, yarın büyük hamleler yapmaktan daha değerlidir.",
        author: "AI İlham Kaynağı",
        category: "planning"
      },
      {
        quote: "Üretkenlik, meşgul olmak değildir. Doğru şeyleri doğru zamanda yapmaktır. Kalite, nicelikten her zaman üstündür.",
        author: "AI İlham Kaynağı",
        category: "efficiency"
      },
      {
        quote: "Hedeflerinizi sadece kafanızda tutmayın, yazın. Yazılı hedefler, hayalleri gerçeğe dönüştürür.",
        author: "AI İlham Kaynağı",
        category: "goal-setting"
      },
      {
        quote: "Motivasyon sizi harekete geçirir, disiplin sizi hedefe taşır. İkisini bir arada kullanın.",
        author: "AI İlham Kaynağı",
        category: "discipline"
      },
      {
        quote: "Her yeni gün, dünkü hatalarınızı düzeltme ve bugünkü fırsatları değerlendirme şansıdır. Geçmişi bırakın, geleceğe odaklanın.",
        author: "AI İlham Kaynağı",
        category: "mindset"
      },
      {
        quote: "Büyük projeler küçük görevlerin toplamıdır. Her tamamladığınız görev, sizi hedefinize bir adım daha yaklaştırır.",
        author: "AI İlham Kaynağı",
        category: "progress"
      },
      {
        quote: "Mükemmel sistem arayışında zaman kaybetmeyin. İyi bir sistemi sürekli iyileştirmek, mükemmel sistemi aramaktan daha etkilidir.",
        author: "AI İlham Kaynağı",
        category: "systems"
      },
      {
        quote: "Düzen zihinsel netlik yaratır. Organize bir çalışma alanı, organize bir düşünce yapısının yansımasıdır.",
        author: "AI İlham Kaynağı",
        category: "organization"
      }
    ]

    // Rastgele bir söz seç
    const randomIndex = Math.floor(Math.random() * quotes.length)
    const selectedQuote = quotes[randomIndex]

    return NextResponse.json({
      success: true,
      data: selectedQuote,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error("Motivational quote API error:", error)
    return NextResponse.json(
      { 
        error: "Motivasyon sözü alınırken hata oluştu",
        success: false
      }, 
      { status: 500 }
    )
  }
}