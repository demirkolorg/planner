import { Star } from "lucide-react"

export default function TodayPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <Star className="h-8 w-8 text-green-600" />
        <div>
          <h1 className="text-3xl font-bold">Bugün</h1>
          <p className="text-muted-foreground">
            Bugün yapmanız gereken görevler
          </p>
        </div>
      </div>
      
      <div className="grid gap-4">
        <div className="p-4 border rounded-lg">
          <h3 className="font-semibold mb-2">Bugün hiç görev yok</h3>
          <p className="text-muted-foreground">Yeni görev ekleyebilirsiniz.</p>
        </div>
      </div>
    </div>
  )
}