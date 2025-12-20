import { NextRequest, NextResponse } from "next/server";
import { createBoard, boards } from "@/lib/store";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const board = createBoard(body);
    return NextResponse.json(board);
  } catch (error) {
    console.error("Error creating board:", error);
    return NextResponse.json(
      { error: "Failed to create board" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    return NextResponse.json(boards);
  } catch (error) {
    console.error("Error getting boards:", error);
    return NextResponse.json(
      { error: "Failed to get boards" },
      { status: 500 }
    );
  }
}
