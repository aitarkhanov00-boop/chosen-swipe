"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { ThumbsUp, ThumbsDown, ArrowLeft, ArrowRight } from "lucide-react";
import { type Board } from "@/lib/store";
import { X, Heart } from "lucide-react";

interface CardData {
  id: string;
  name: string;
  type?: string;
  size?: number;
  data?: string;
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
        if (data.error) return;
        setBoard(data);
        const cardsData = (data.cards || []).map((card: any, index: number) => ({
          id: card.id || `card-${index}`,
          ...card,
        }));
        setCards(cardsData);
      })
      .catch(console.error);
  }, [boardId]);

  const handleVote = async (liked: boolean) => {
    if (currentIndex >= cards.length) return;

    const currentCard = cards[currentIndex];
    let sessionId = localStorage.getItem(`session_${boardId}`);
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem(`session_${boardId}`, sessionId);
    }

    try {
      await fetch("/api/votes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          boardId,
          cardId: currentCard.id,
          liked,
          timestamp: Date.now(),
          sessionId,
        }),
      });
    } catch (error) {
      console.error("Error saving vote:", error);
    }

    if (currentIndex < cards.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      showResults();
    }
  };

  const showResults = async () => {
    try {
      const response = await fetch(`/api/boards/${boardId}/results`);
      const votes = await response.json();

      const cardScores: Record<string, number> = {};
      votes.forEach((vote: any) => {
        if (vote.liked) cardScores[vote.cardId] = (cardScores[vote.cardId] || 0) + 1;
      });

      const sortedCardIds = Object.entries(cardScores)
        .sort(([, a], [, b]) => (b as number) - (a as number))
        .slice(0, 3)
        .map(([cardId]) => cardId);

      const sortedCards = sortedCardIds
        .map((cardId) => cards.find((c) => c.id === cardId))
        .filter(Boolean) as CardData[];

      setTopCards(sortedCards);
    } catch (error) {
      console.error("Error getting results:", error);
    } finally {
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
    setDragOffset({ x: deltaX, y: 0 });
  };

  const handleMouseUp = () => {
    if (!isDragging) return;
    setIsDragging(false);

    if (Math.abs(dragOffset.x) > SWIPE_THRESHOLD) {
      handleVote(dragOffset.x > 0); // вправо = нравится
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
    setDragOffset({ x: deltaX, y: 0 });
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);
    if (Math.abs(dragOffset.x) > SWIPE_THRESHOLD) {
      handleVote(dragOffset.x > 0);
    }
    setDragOffset({ x: 0, y: 0 });
  };

  if (!board) return <div className="min-h-screen flex items-center justify-center"><p>Loading...</p></div>;
  if (cards.length === 0) return <div className="min-h-screen flex items-center justify-center"><p>No cards</p></div>;

  const currentCard = cards[currentIndex];
  const rotation = dragOffset.x * 0.1;
  const opacity = Math.max(0.3, 1 - Math.abs(dragOffset.x) / 300);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-b from-background to-muted/20">
      <div className="w-full max-w-md space-y-6">

        {/* Progress */}
        <div className="text-center text-sm text-muted-foreground">
          {currentIndex + 1} / {cards.length}
        </div>

        {/* Card Stack */}
        <div className="relative h-[70vh] max-h-[600px] w-full">

          {/* Подсказка только на первой карточке */}
          {currentIndex === 0 && (
            <div className="absolute inset-0 pointer-events-none z-30 flex items-center justify-center">
              <div className="bg-black/70 backdrop-blur-md rounded-3xl p-8 text-center max-w-xs">
                <div className="flex justify-center gap-12 mb-6">
                  <div>
                    <ArrowLeft className="w-12 h-12 text-red-400 mx-auto mb-2" />
                    <p className="text-white font-medium">Не нравится</p>
                  </div>
                  <div>
                    <ArrowRight className="w-12 h-12 text-green-400 mx-auto mb-2" />
                    <p className="text-white font-medium">Нравится</p>
                  </div>
                </div>
                <p className="text-white/80 text-sm">Свайпай или тяни карточку</p>
              </div>
            </div>
          )}

          {/* Next card */}
          {currentIndex < cards.length - 1 && (
            <Card className="absolute inset-0" style={{ transform: "scale(0.95) translateY(10px)", opacity: 0.5, zIndex: 1 }}>
              <CardContent className="p-0 h-full flex items-center justify-center bg-muted">
                <p className="text-muted-foreground">{cards[currentIndex + 1].name}</p>
              </CardContent>
            </Card>
          )}

          {/* Current card */}
          <Card
            ref={cardRef}
            className="absolute inset-0 shadow-2xl cursor-grab active:cursor-grabbing select-none"
            style={{
              transform: `translateX(${dragOffset.x}px) rotate(${rotation}deg)`,
              opacity,
              transition: isDragging ? "none" : "all 0.4s cubic-bezier(0.18, 0.89, 0.32, 1.28)",
              zIndex: 10,
            }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <CardContent className="p-0 h-full relative overflow-hidden rounded-2xl">
              {currentCard.data ? (
                <img src={currentCard.data} alt={currentCard.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-muted">
                  <p className="text-muted-foreground">{currentCard.name}</p>
                </div>
              )}

              {/* Оверлеи при свайпе */}
              {Math.abs(dragOffset.x) > 50 && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                  <div className={`text-8xl font-bold ${dragOffset.x > 0 ? "text-green-500" : "text-red-500"} opacity-90`}>
                    {dragOffset.x > 0 ? "LIKED" : "NOPE"}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* КНОПКИ ВНИЗУ УБРАНЫ — теперь чистый Tinder-опыт */}
      </div>

      {/* Экран завершения */}
      {isFinished && (
  <div className="fixed inset-0 bg-background/95 backdrop-blur-sm flex items-center justify-center z-50 p-4">
    <div className="relative bg-card rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden">
      {/* Крестик закрытия */}
      <button
        onClick={() => router.push("/")}
        className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-black/20 hover:bg-black/40 flex items-center justify-center transition"
      >
        <X className="w-6 h-6 text-white" />
      </button>

      <div className="p-8 pt-16 text-center">
        <h1 className="text-4xl font-bold mb-4">Опрос пройден!</h1>
        <p className="text-muted-foreground text-lg mb-10">
          Спасибо, что помог выбрать
        </p>

        {/* Только карточки, которые понравились */}
        {topCards.length > 0 ? (
          <div>
            <p className="text-xl font-medium mb-6 text-foreground">
              Вот что тебе понравилось:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {topCards.map((card, i) => (
                <div key={card.id} className="relative group">
                  <div className="aspect-square rounded-2xl overflow-hidden shadow-lg">
                    {card.data ? (
                      <img
                        src={card.data}
                        alt={card.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full bg-muted flex items-center justify-center">
                        <p className="text-muted-foreground">{card.name}</p>
                      </div>
                    )}
                  </div>
                  {/* Номер позиции */}
                  <div className="absolute top-3 left-3 bg-primary text-primary-foreground rounded-full w-10 h-10 flex items-center justify-center font-bold text-lg">
                    {i + 1}
                  </div>
                  {/* Иконка сердечка */}
                  <div className="absolute bottom-3 right-3 bg-green-500/90 text-white rounded-full p-3 shadow-lg">
                    <Heart className="w-6 h-6 fill-current" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-muted-foreground text-lg">Ты ничего не лайкнул</p>
        )}

        <button
          onClick={() => router.push("/")}
          className="mt-10 text-primary hover:text-primary/80 underline text-lg"
        >
          Вернуться на главную
        </button>
      </div>
    </div>
  </div>
)}
    </div>
  );
}