import { AppStore } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET() {
  const csvContent = AppStore.generateCSVExport();

  return new Response(csvContent, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="team_ace_championship_results_${Date.now()}.csv"`,
      "Cache-Control": "no-cache",
    },
  });
}
