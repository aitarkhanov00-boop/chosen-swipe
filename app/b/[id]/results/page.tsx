"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, ArrowLeft, Users } from "lucide-react";
import { type Board, type Vote } from "@/lib/store";

interface CardStats {
  card: {
    id: string;
    name: string;
    data?: string;
  };
  likes: number;
  dislikes: number;
  total: number;
  likePercentage: number;
}

export default function ResultsPage() {
  const params = useParams();
  const router = useRouter();
  const boardId = params.id as string;
  const exportRef = useRef<HTMLDivElement>(null);
  
  const [board, setBoard] = useState<Board | null>(null);
  const [cardStats, setCardStats] = useState<CardStats[]>([]);
  const [totalVoters, setTotalVoters] = useState(0);
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!boardId) return;
    
    // Проверяем авторизацию
    const ownerId = localStorage.getItem(`board_owner_${boardId}`);
    
    if (!ownerId) {
      setIsAuthorized(false);
      setIsLoading(false);
      return;
    }

    // Проверяем владельца через API
    fetch(`/api/boards/${boardId}/check-owner`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ ownerId }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.isOwner) {
          setIsAuthorized(true);
          loadData();
        } else {
          setIsAuthorized(false);
          setIsLoading(false);
        }
      })
      .catch((error) => {
        console.error("Error checking owner:", error);
        setIsAuthorized(false);
        setIsLoading(false);
      });
  }, [boardId]);

  const loadData = async () => {
    try {
      // Загружаем борд
      const boardResponse = await fetch(`/api/boards/${boardId}`);
      const boardData = await boardResponse.json();
      
      if (boardData.error) {
        console.error(boardData.error);
        setIsLoading(false);
        return;
      }
      
      setBoard(boardData);

      // Загружаем результаты
      const resultsResponse = await fetch(`/api/boards/${boardId}/results`);
      const votes: Vote[] = await resultsResponse.json();

      // Подсчитываем статистику
      const statsMap: Record<string, { likes: number; dislikes: number }> = {};
      const voterSet = new Set<string>();

      votes.forEach((vote: any) => {
        const cardId = vote.cardId;
        if (!statsMap[cardId]) {
          statsMap[cardId] = { likes: 0, dislikes: 0 };
        }
        
        if (vote.liked) {
          statsMap[cardId].likes++;
        } else {
          statsMap[cardId].dislikes++;
        }

        // Считаем уникальных голосующих (по IP или sessionId, если есть)
        if (vote.sessionId) {
          voterSet.add(vote.sessionId);
        }
      });

      // Преобразуем в массив и сортируем по популярности
      const cards = boardData.cards || [];
      const stats: CardStats[] = cards
        .map((card: any, index: number) => {
          const cardId = card.id || `card-${index}`;
          const cardStat = statsMap[cardId] || { likes: 0, dislikes: 0 };
          const total = cardStat.likes + cardStat.dislikes;
          const likePercentage = total > 0 ? (cardStat.likes / total) * 100 : 0;

          return {
            card: {
              id: cardId,
              name: card.name,
              data: card.data,
            },
            likes: cardStat.likes,
            dislikes: cardStat.dislikes,
            total,
            likePercentage,
          };
        })
        .sort((a: CardStats, b: CardStats) => {
          // Сортируем по проценту лайков, затем по общему количеству голосов
          if (b.likePercentage !== a.likePercentage) {
            return b.likePercentage - a.likePercentage;
          }
          return b.total - a.total;
        });

      setCardStats(stats);
      setTotalVoters(voterSet.size || votes.length);
      setIsLoading(false);
    } catch (error) {
      console.error("Error loading data:", error);
      setIsLoading(false);
    }
  };

  const handleExport = async () => {
    if (!exportRef.current) return;

    try {
      // Динамический импорт html2canvas для клиентской стороны
      const html2canvas = (await import("html2canvas")).default;
      
      const canvas = await html2canvas(exportRef.current, {
        backgroundColor: "#0a0a0a",
        scale: 2,
      });
      
      const link = document.createElement("a");
      link.download = `board-results-${boardId}.png`;
      link.href = canvas.toDataURL();
      link.click();
    } catch (error) {
      console.error("Error exporting image:", error);
      alert("Failed to export image. Please try again.");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (isAuthorized === false) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              You don't have permission to view these results. Only the board owner can access this page.
            </p>
            <Button
              onClick={() => router.push("/")}
              variant="outline"
              className="w-full"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8 bg-gradient-to-b from-background to-muted/20">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <Button
              onClick={() => router.push("/")}
              variant="ghost"
              className="mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <h1 className="text-4xl font-bold">{board?.name || "Results"}</h1>
            {board?.description && (
              <p className="text-muted-foreground mt-2">{board.description}</p>
            )}
          </div>
          <Button
            onClick={handleExport}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Download className="h-4 w-4 mr-2" />
            Export as image
          </Button>
        </div>

        {/* Stats Summary */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Voters</p>
                  <p className="text-2xl font-bold">{totalVoters}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Votes</p>
                <p className="text-2xl font-bold">
                  {cardStats.reduce((sum, stat) => sum + stat.total, 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        <div ref={exportRef} className="space-y-4">
          {cardStats.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">
                  No votes yet. Share your board to get started!
                </p>
              </CardContent>
            </Card>
          ) : (
            cardStats.map((stat, index) => (
              <Card key={stat.card.id} className="overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    {/* Card Image/Preview */}
                    <div className="w-24 h-24 rounded-lg overflow-hidden bg-muted shrink-0 border border-border">
                      {stat.card.data ? (
                        <img
                          src={stat.card.data}
                          alt={stat.card.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <p className="text-xs text-muted-foreground text-center px-2">
                            {stat.card.name}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Stats */}
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-lg">
                            #{index + 1} {stat.card.name}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {stat.likes} likes • {stat.dislikes} dislikes • {stat.total} total votes
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-primary">
                            {stat.likePercentage.toFixed(1)}%
                          </p>
                          <p className="text-xs text-muted-foreground">like rate</p>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="space-y-1">
                        <div className="h-3 w-full bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary transition-all duration-500 ease-out"
                            style={{ width: `${stat.likePercentage}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>0%</span>
                          <span>50%</span>
                          <span>100%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

