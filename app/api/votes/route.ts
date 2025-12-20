import { NextRequest, NextResponse } from "next/server";
import { addVote } from "@/lib/store";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { boardId, ...voteData } = body;
    
    if (!boardId) {
      return NextResponse.json(
        { error: "boardId is required" },
        { status: 400 }
      );
    }
    
    const vote = addVote(boardId, voteData);
    return NextResponse.json(vote);
  } catch (error) {
    console.error("Error adding vote:", error);
    return NextResponse.json(
      { error: "Failed to add vote" },
      { status: 500 }
    );
  }
}

