import { Pin } from "lucide-react"

export default function BoardPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <Pin className="h-8 w-8 text-red-600" />
        <div>
          <h1 className="text-3xl font-bold">Pano</h1>
          <p className="text-muted-foreground">
            Görev panonuz
          </p>
        </div>
      </div>
      
      <div className="grid gap-4">
        <div className="p-4 border rounded-lg">
          <h3 className="font-semibold mb-2">Pano boş</h3>
          <p className="text-muted-foreground">Yeni görev ekleyebilirsiniz.</p>
        </div>
      </div>
    </div>
  )
}