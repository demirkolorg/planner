import { CheckSquare } from "lucide-react"

export default function CompletedPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <CheckSquare className="h-8 w-8 text-orange-600" />
        <div>
          <h1 className="text-3xl font-bold">Tamamlandı</h1>
          <p className="text-muted-foreground">
            Tamamlanmış görevleriniz
          </p>
        </div>
      </div>
      
      <div className="grid gap-4">
        <div className="p-4 border rounded-lg">
          <h3 className="font-semibold mb-2">Tamamlanmış görev yok</h3>
          <p className="text-muted-foreground">Henüz tamamlanmış görev bulunmuyor.</p>
        </div>
      </div>
    </div>
  )
}