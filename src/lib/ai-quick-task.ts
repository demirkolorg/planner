export interface QuickTaskAnalysis {
  title: string          // AI özetlediği başlık
  description: string    // AI genişlettiği açıklama  
  priority: string       // Analiz edilen öncelik (CRITICAL, HIGH, MEDIUM, LOW, NONE)
  dueDate: string | null // Çıkarılan tarih (ISO string)
  tags: string[]         // 1-3 etiket
}

export async function analyzeQuickTask(input: string): Promise<QuickTaskAnalysis> {
  try {
    const response = await fetch('/api/ai/analyze-task', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ input }),
    })

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }

    const result = await response.json()
    
    if (!result.success) {
      throw new Error(result.error || 'API call failed')
    }

    return result.data
    
  } catch (error) {
    // Fallback: Basit local analiz
    return {
      title: input.charAt(0).toUpperCase() + input.slice(1),
      description: `${input} ile ilgili görev - detayları planla ve uygulamaya geç`,
      priority: 'MEDIUM',
      dueDate: null,
      tags: input.toLowerCase().split(' ').filter(word => word.length > 2).slice(0, 3)
    }
  }
}