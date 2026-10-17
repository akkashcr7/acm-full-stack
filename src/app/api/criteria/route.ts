import { NextResponse } from "next/server";
import { AppStore } from "@/lib/store";
import { CriterionCreateSchema } from "@/lib/validation";

export async function GET() {
  const criteria = AppStore.getCriteria();
  return NextResponse.json({ criteria });
}

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const parsed = CriterionCreateSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const created = AppStore.addCriterion({
      name: parsed.data.name,
      description: parsed.data.description,
      maxScore: parsed.data.maxScore,
      weight: parsed.data.weight,
      category: parsed.data.category,
      eventId: parsed.data.eventId,
    });

    return NextResponse.json({ criterion: created }, { status: 201 });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const json = await req.json();
    const { id, ...updates } = json;

    if (!id) {
      return NextResponse.json({ error: "Criterion ID is required" }, { status: 400 });
    }

    const updated = AppStore.updateCriterion(id, updates);
    if (!updated) {
      return NextResponse.json({ error: "Criterion not found" }, { status: 404 });
    }

    return NextResponse.json({ criterion: updated });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Criterion ID is required" }, { status: 400 });
    }

    const ok = AppStore.deleteCriterion(id);
    if (!ok) {
      return NextResponse.json({ error: "Criterion not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
