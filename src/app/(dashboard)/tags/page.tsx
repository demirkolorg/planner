import { Tag } from "lucide-react"

export default function TagsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <Tag className="h-8 w-8 text-yellow-600" />
        <div>
          <h1 className="text-3xl font-bold">Etiketler</h1>
          <p className="text-muted-foreground">
            Görev etiketleriniz
          </p>
        </div>
      </div>
      
      <div className="grid gap-4">
        <div className="p-4 border rounded-lg">
          <h3 className="font-semibold mb-2">Etiket yok</h3>
          <p className="text-muted-foreground">Yeni etiket ekleyebilirsiniz.</p>
        </div>
      </div>
    </div>
  )
}