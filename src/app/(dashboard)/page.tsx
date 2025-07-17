import { DashboardOverview } from "@/components/dashboard/overview"

export default function Home() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Anasayfa</h1>
        <p className="text-muted-foreground">
          Proje ve görevlerinizin genel görünümü
        </p>
      </div>
      <DashboardOverview />
    </div>
  )
}
