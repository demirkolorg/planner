"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { PiTagSimpleFill } from "react-icons/pi"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useTaskStore } from "@/store/taskStore"

interface Tag {
  id: string
  name: string
  color: string
  createdAt: string
  _count: {
    tasks: number
  }
}


export default function TagDetailPage() {
  const params = useParams()
  const tagId = params.id as string
  const [tag, setTag] = useState<Tag | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { fetchTasksByTag, getTasksByTag } = useTaskStore()

  // TaskStore'dan tag görevlerini al
  const tasks = getTasksByTag(tagId)

  useEffect(() => {
    const fetchTagAndTasks = async () => {
      try {
        // Tag bilgilerini al
        const tagResponse = await fetch(`/api/tags/${tagId}`)
        if (!tagResponse.ok) {
          throw new Error('Tag bulunamadı')
        }
        const tagData = await tagResponse.json()
        setTag(tagData)

        // TaskStore'dan görevleri al
        await fetchTasksByTag(tagId)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Bir hata oluştu')
      } finally {
        setIsLoading(false)
      }
    }

    fetchTagAndTasks()
  }, [tagId, fetchTasksByTag])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (error || !tag) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/tags">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Etiket Bulunamadı</h1>
        </div>
        <div className="p-4 border border-red-200 bg-red-50 dark:bg-red-900/10 dark:border-red-800 rounded-lg">
          <p className="text-red-600 dark:text-red-400">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/tags">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex items-center space-x-3">
          <div className="p-3 rounded-lg" style={{ backgroundColor: tag.color + '20' }}>
            <PiTagSimpleFill
              className="w-8 h-8"
              style={{ color: tag.color }}
            />
          </div>
          <div>
            <h1 className="text-3xl font-bold">{tag.name}</h1>
            <p className="text-muted-foreground">
              {tag._count?.tasks || 0} görev
            </p>
          </div>
        </div>
      </div>

      {tasks.length === 0 ? (
        <div className="text-center p-8 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
          <PiTagSimpleFill className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Bu etiketle ilişkili görev yok</h3>
          <p className="text-muted-foreground">
            Henüz bu etiketle işaretlenmiş görev bulunmuyor
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">
            İlişkili Görevler ({tasks.length})
          </h2>
          <div className="space-y-3">
            {tasks.map((task) => (
              <div
                key={task.id}
                className="p-4 border rounded-lg bg-card hover:shadow-sm transition-shadow"
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-medium">{task.title}</h3>
                  <div className="flex items-center space-x-2">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        task.priority === "HIGH"
                          ? "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400"
                          : task.priority === "MEDIUM"
                          ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400"
                          : "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                      }`}
                    >
                      {task.priority === "HIGH" ? "Yüksek" : task.priority === "MEDIUM" ? "Orta" : "Düşük"}
                    </span>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        task.completed
                          ? "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                          : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                      }`}
                    >
                      {task.completed ? "Tamamlandı" : "Devam Ediyor"}
                    </span>
                  </div>
                </div>
                {task.description && (
                  <p className="text-sm text-muted-foreground mb-2">
                    {task.description}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  Oluşturulma: {new Date(task.createdAt).toLocaleDateString('tr-TR')}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}