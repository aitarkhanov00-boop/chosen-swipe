import { NextRequest, NextResponse } from "next/server";
import { getResults } from "@/lib/store";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const results = getResults(id);
    return NextResponse.json(results);
  } catch (error) {
    console.error("Error getting results:", error);
    return NextResponse.json(
      { error: "Failed to get results" },
      { status: 500 }
    );
  }
}

