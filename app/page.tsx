"use client";

import { useState, useEffect } from "react";
import { CreateBoardButton } from "@/components/create-board-button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { type Board } from "@/lib/store";

export default function Home() {
  const [boards, setBoards] = useState<Board[]>([]);
  const [votes, setVotes] = useState<any[]>([]);
  const [hasBoards, setHasBoards] = useState<boolean | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Загружаем данные через API
    fetch("/api/boards")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setBoards(data);
          setHasBoards(data.length > 0);
        }
      })
      .catch(console.error);
  }, []);

  // Подсчитываем статистику для каждого борда
  const boardsWithStats = boards.map((board) => {
    const boardVotes = votes.filter((vote) => vote.boardId === board.id);
    const cardsCount = board.cards?.length || 0;
    const votesCount = boardVotes.length;

    return {
      ...board,
      cardsCount,
      votesCount,
    };
  });

  // Показываем лендинг если нет бордов
  if (hasBoards === false) {
    return <LandingPage />;
  }

  return (
    <main className="min-h-screen p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 sm:mb-8 gap-4">
          <h1 className="text-3xl sm:text-4xl font-bold">My Boards</h1>
          <CreateBoardButton />
        </div>

        {boards.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <div className="text-center space-y-6">
              <h2 className="text-xl sm:text-2xl font-semibold text-muted-foreground">
                No boards yet
              </h2>
              <CreateBoardButton showCreateFirst />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {boardsWithStats.map((board) => (
              <BoardCard key={board.id} board={board} toast={toast} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

function LandingPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-8 bg-gradient-to-b from-background via-background to-muted/20">
      <div className="max-w-4xl mx-auto text-center space-y-8">
        <div className="space-y-4">
          <h1 className="text-4xl sm:text-6xl font-bold bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
            Chosen
          </h1>
          <p className="text-xl sm:text-2xl text-muted-foreground font-light">
            decide faster
          </p>
        </div>
        
        <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
          Create swipeable boards to get quick feedback. Let your audience help you choose the best option.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
          <CreateBoardButton showCreateFirst />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-12 pt-12 border-t border-border">
          <div className="space-y-2">
            <h3 className="font-semibold text-lg">Quick Decisions</h3>
            <p className="text-sm text-muted-foreground">
              Get instant feedback with swipe-based voting
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="font-semibold text-lg">Easy Sharing</h3>
            <p className="text-sm text-muted-foreground">
              Share your board with a simple link
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="font-semibold text-lg">Real-time Results</h3>
            <p className="text-sm text-muted-foreground">
              See analytics and top choices instantly
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

function BoardCard({ 
  board, 
  toast 
}: { 
  board: Board & { cardsCount: number; votesCount: number };
  toast: ReturnType<typeof useToast>["toast"];
}) {
  const handleShare = () => {
    const url = `${window.location.origin}/b/${board.id}`;
    navigator.clipboard.writeText(url);
    toast({
      title: "Link copied!",
      description: "Share this link with others to get votes",
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg sm:text-xl">{board.name || board.title || "Untitled Board"}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>{board.cardsCount} cards</span>
          <span>•</span>
          <span>{board.votesCount} votes</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center rounded-full bg-green-500/10 px-2.5 py-0.5 text-xs font-medium text-green-400 border border-green-500/20">
            Active
          </span>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col sm:flex-row gap-2">
        <Button
          variant="secondary"
          className="flex-1 w-full sm:w-auto"
          onClick={() => {
            const ownerId = localStorage.getItem(`board_owner_${board.id}`);
            if (ownerId) {
              window.location.href = `/b/${board.id}/results`;
            } else {
              toast({
                title: "Access denied",
                description: "You can only view results for boards you created",
                variant: "destructive",
              });
            }
          }}
        >
          View Results
        </Button>
        <Button
          variant="outline"
          className="flex-1 w-full sm:w-auto"
          onClick={handleShare}
        >
          Share
        </Button>
      </CardFooter>
    </Card>
  );
}
