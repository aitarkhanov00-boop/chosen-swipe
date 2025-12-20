import { NextRequest, NextResponse } from "next/server";
import { getBoard } from "@/lib/store";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const board = getBoard(id);
    
    if (!board) {
      return NextResponse.json(
        { error: "Board not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json(board);
  } catch (error) {
    console.error("Error getting board:", error);
    return NextResponse.json(
      { error: "Failed to get board" },
      { status: 500 }
    );
  }
}

