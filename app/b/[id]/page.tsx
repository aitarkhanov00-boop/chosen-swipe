"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ThumbsUp, ThumbsDown, Heart, X } from "lucide-react";
import { type Board } from "@/lib/store";

interface CardData {
  id: string;
  name: string;
  type?: string;
  size?: number;
  data?: string; // base64 data
}

export default function SwipePage() {
  const params = useParams();
  const router = useRouter();
  const boardId = params.id as string;
  
  const [board, setBoard] = useState<Board | null>(null);
  const [cards, setCards] = useState<CardData[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [isFinished, setIsFinished] = useState(false);
  const [topCards, setTopCards] = useState<CardData[]>([]);
  
  const cardRef = useRef<HTMLDivElement>(null);
  const SWIPE_THRESHOLD = 100;

  useEffect(() => {
    if (!boardId) return;
    
    fetch(`/api/boards/${boardId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          console.error(data.error);
          return;
        }
        setBoard(data);
        // Преобразуем cards в массив с id
        const cardsData = (data.cards || []).map((card: any, index: number) => ({
          id: card.id || `card-${index}`,
          ...card,
        }));
        setCards(cardsData);
      })
      .catch((error) => {
        console.error("Error fetching board:", error);
      });
  }, [boardId]);

  const handleVote = async (liked: boolean) => {
    if (currentIndex >= cards.length) return;
    
    const currentCard = cards[currentIndex];
    
    // Генерируем sessionId для отслеживания уникальных голосующих
    let sessionId = localStorage.getItem(`session_${boardId}`);
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem(`session_${boardId}`, sessionId);
    }
    
    // Сохраняем голос
    try {
      await fetch("/api/votes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          boardId,
          cardId: currentCard.id,
          liked,
          timestamp: Date.now(),
          sessionId: sessionId,
        }),
      });
    } catch (error) {
      console.error("Error saving vote:", error);
    }

    // Переходим к следующей карточке
    if (currentIndex < cards.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      // Все карточки пройдены, показываем результаты
      showResults();
    }
  };

  const showResults = async () => {
    // Получаем результаты и находим топ-3
    try {
      const response = await fetch(`/api/boards/${boardId}/results`);
      const votes = await response.json();
      
      // Подсчитываем лайки для каждой карточки
      const cardScores: Record<string, number> = {};
      votes.forEach((vote: any) => {
        if (vote.liked) {
          cardScores[vote.cardId] = (cardScores[vote.cardId] || 0) + 1;
        }
      });
      
      // Сортируем по количеству лайков и берем топ-3
      const sortedCardIds = Object.entries(cardScores)
        .sort(([, a], [, b]) => (b as number) - (a as number))
        .slice(0, 3)
        .map(([cardId]) => cardId);
      
      const sortedCards = sortedCardIds
        .map((cardId) => cards.find((c) => c.id === cardId))
        .filter(Boolean) as CardData[];
      
      setTopCards(sortedCards);
      setIsFinished(true);
    } catch (error) {
      console.error("Error getting results:", error);
      setIsFinished(true);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setStartPos({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    
    const deltaX = e.clientX - startPos.x;
    const deltaY = e.clientY - startPos.y;
    setDragOffset({ x: deltaX, y: deltaY });
  };

  const handleMouseUp = () => {
    if (!isDragging) return;
    
    setIsDragging(false);
    
    if (Math.abs(dragOffset.x) > SWIPE_THRESHOLD) {
      // Свайп влево = dislike, вправо = like
      handleVote(dragOffset.x > 0);
    }
    
    setDragOffset({ x: 0, y: 0 });
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    const touch = e.touches[0];
    setIsDragging(true);
    setStartPos({ x: touch.clientX, y: touch.clientY });
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    
    const touch = e.touches[0];
    const deltaX = touch.clientX - startPos.x;
    const deltaY = touch.clientY - startPos.y;
    setDragOffset({ x: deltaX, y: deltaY });
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    
    setIsDragging(false);
    
    if (Math.abs(dragOffset.x) > SWIPE_THRESHOLD) {
      handleVote(dragOffset.x > 0);
    }
    
    setDragOffset({ x: 0, y: 0 });
  };

  if (!board) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (isFinished) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-gradient-to-b from-background to-muted/20">
        <div className="max-w-2xl w-full space-y-8 text-center">
          <div className="space-y-4">
            <h1 className="text-4xl font-bold">Спасибо! Ты помог выбрать</h1>
            <p className="text-muted-foreground text-lg">
              Вот топ-3 карточки по результатам голосования:
            </p>
          </div>

          {topCards.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
              {topCards.map((card, index) => (
                <Card key={card.id} className="overflow-hidden">
                  <CardContent className="p-0">
                    <div className="aspect-square relative bg-muted">
                      {card.data ? (
                        <img
                          src={card.data}
                          alt={card.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <p className="text-muted-foreground">{card.name}</p>
                        </div>
                      )}
                      <div className="absolute top-2 left-2 bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center font-bold">
                        {index + 1}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">Результаты пока недоступны</p>
          )}

          <Button
            onClick={() => router.push("/create")}
            className="bg-primary text-primary-foreground hover:bg-primary/90 mt-8"
            size="lg"
          >
            Создай свой борд
          </Button>
        </div>
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">No cards available</p>
      </div>
    );
  }

  const currentCard = cards[currentIndex];
  const rotation = dragOffset.x * 0.1;
  const opacity = 1 - Math.abs(dragOffset.x) / 300;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-2 sm:p-4 bg-gradient-to-b from-background to-muted/20">
      <div className="w-full max-w-md space-y-4 sm:space-y-6">
        {/* Progress indicator */}
        <div className="text-center text-xs sm:text-sm text-muted-foreground">
          {currentIndex + 1} / {cards.length}
        </div>

        {/* Card stack */}
        <div className="relative h-[70vh] sm:h-[600px] max-h-[600px] w-full">
          {/* Next card (background) */}
          {currentIndex < cards.length - 1 && (
            <Card
              className="absolute inset-0 bg-card border-2 border-border shadow-lg"
              style={{
                transform: "scale(0.95) translateY(10px)",
                opacity: 0.5,
                zIndex: 1,
              }}
            >
              <CardContent className="p-0 h-full">
                <div className="w-full h-full bg-muted flex items-center justify-center">
                  <p className="text-muted-foreground">
                    {cards[currentIndex + 1].name}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Current card */}
          <Card
            ref={cardRef}
            className="absolute inset-0 bg-card border-2 border-border shadow-xl cursor-grab active:cursor-grabbing touch-none select-none"
            style={{
              transform: `translate(${dragOffset.x}px, ${dragOffset.y}px) rotate(${rotation}deg)`,
              opacity: Math.max(0.3, opacity),
              zIndex: 2,
              transition: isDragging ? "none" : "transform 0.3s ease-out, opacity 0.3s ease-out",
              touchAction: "none",
            }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <CardContent className="p-0 h-full">
              <div className="w-full h-full bg-muted flex items-center justify-center relative overflow-hidden rounded-lg">
                {currentCard.data ? (
                  <img
                    src={currentCard.data}
                    alt={currentCard.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <p className="text-muted-foreground">{currentCard.name}</p>
                )}
                
                {/* Like/Dislike overlay */}
                {Math.abs(dragOffset.x) > 50 && (
                  <div
                    className={`absolute top-2 sm:top-4 ${
                      dragOffset.x > 0 ? "left-2 sm:left-4" : "right-2 sm:right-4"
                    } p-2 sm:p-4 rounded-lg ${
                      dragOffset.x > 0
                        ? "bg-green-500/80 text-white"
                        : "bg-red-500/80 text-white"
                    }`}
                  >
                    {dragOffset.x > 0 ? (
                      <ThumbsUp className="h-6 w-6 sm:h-8 sm:w-8" />
                    ) : (
                      <ThumbsDown className="h-6 w-6 sm:h-8 sm:w-8" />
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action buttons */}
        <div className="flex justify-center gap-4 sm:gap-6 pb-4 sm:pb-0">
          <Button
            onClick={() => handleVote(false)}
            variant="outline"
            size="lg"
            className="h-14 w-14 sm:h-16 sm:w-16 rounded-full bg-red-500 hover:bg-red-600 text-white border-0 active:scale-95 transition-transform"
          >
            <X className="h-5 w-5 sm:h-6 sm:w-6" />
          </Button>
          <Button
            onClick={() => handleVote(true)}
            variant="outline"
            size="lg"
            className="h-14 w-14 sm:h-16 sm:w-16 rounded-full bg-green-500 hover:bg-green-600 text-white border-0 active:scale-95 transition-transform"
          >
            <Heart className="h-5 w-5 sm:h-6 sm:w-6" />
          </Button>
        </div>
      </div>
    </div>
  );
}

