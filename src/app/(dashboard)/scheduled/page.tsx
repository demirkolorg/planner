import { Clock } from "lucide-react"

export default function ScheduledPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <Clock className="h-8 w-8 text-purple-600" />
        <div>
          <h1 className="text-3xl font-bold">Zamanlanmış</h1>
          <p className="text-muted-foreground">
            Zamanlanmış görevleriniz
          </p>
        </div>
      </div>
      
      <div className="grid gap-4">
        <div className="p-4 border rounded-lg">
          <h3 className="font-semibold mb-2">Zamanlanmış görev yok</h3>
          <p className="text-muted-foreground">Yeni görev ekleyebilirsiniz.</p>
        </div>
      </div>
    </div>
  )
}