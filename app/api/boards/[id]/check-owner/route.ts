import { NextRequest, NextResponse } from "next/server";
import { getBoard } from "@/lib/store";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { ownerId } = body;
    
    const board = getBoard(id);
    
    if (!board) {
      return NextResponse.json(
        { error: "Board not found" },
        { status: 404 }
      );
    }
    
    const isOwner = board.ownerId === ownerId;
    
    return NextResponse.json({ isOwner });
  } catch (error) {
    console.error("Error checking owner:", error);
    return NextResponse.json(
      { error: "Failed to check owner" },
      { status: 500 }
    );
  }
}

