"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useDropzone } from "react-dropzone";
import { QRCodeSVG } from "qrcode.react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { X, Copy, MessageCircle, Send, Check } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

export default function CreateBoardPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [boardData, setBoardData] = useState({
    title: "",
    description: "",
    interactionType: "like-dislike",
  });
  const [cards, setCards] = useState<File[]>([]);
  const [cardUrls, setCardUrls] = useState<string[]>([]);
  const [boardId, setBoardId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleNext = async () => {
    if (step === 1) {
      if (!boardData.title.trim()) {
        alert("Please enter a title");
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (cards.length === 0) {
        alert("Please upload at least one card");
        return;
      }
      // Create board via API
      try {
        // Конвертируем файлы в base64
        const cardsData = await Promise.all(
          cards.map(async (file, index) => {
            return new Promise<{ id: string; name: string; type: string; size: number; data: string }>((resolve) => {
              const reader = new FileReader();
              reader.onloadend = () => {
                resolve({
                  id: `card-${index}`,
                  name: file.name,
                  type: file.type,
                  size: file.size,
                  data: reader.result as string,
                });
              };
              reader.readAsDataURL(file);
            });
          })
        );

        // Генерируем ownerId
        const ownerId = `owner_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        const response = await fetch("/api/boards", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: boardData.title,
            description: boardData.description,
            interactionType: boardData.interactionType,
            cards: cardsData,
            ownerId: ownerId,
          }),
        });
        const newBoard = await response.json();
        setBoardId(newBoard.id);
        
        // Сохраняем ownerId для созданного борда
        localStorage.setItem(`board_owner_${newBoard.id}`, ownerId);
        setStep(3);
      } catch (error) {
        console.error("Error creating board:", error);
        alert("Failed to create board. Please try again.");
      }
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleDone = () => {
    router.push("/");
  };

  const onDrop = (acceptedFiles: File[]) => {
    const imageFiles = acceptedFiles.filter(
      (file) => file.type.startsWith("image/")
    );
    const remainingSlots = 30 - cards.length;
    const filesToAdd = imageFiles.slice(0, remainingSlots);
    
    // Создаем URL для превью
    const newUrls = filesToAdd.map((file) => URL.createObjectURL(file));
    setCardUrls([...cardUrls, ...newUrls]);
    setCards([...cards, ...filesToAdd]);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".png", ".jpg", ".jpeg", ".gif", ".webp"],
    },
    maxFiles: 30,
    disabled: cards.length >= 30,
  });

  const removeCard = (index: number) => {
    // Освобождаем URL
    URL.revokeObjectURL(cardUrls[index]);
    setCardUrls(cardUrls.filter((_, i) => i !== index));
    setCards(cards.filter((_, i) => i !== index));
  };

  const boardUrl = boardId
    ? `https://chosen-swipe.vercel.app/b/${boardId}`
    : "";

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(boardUrl);
      setCopied(true);
      toast({
        title: "Link copied!",
        description: "Share this link with others to get votes",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
      toast({
        title: "Failed to copy",
        description: "Please try again",
        variant: "destructive",
      });
    }
  };

  const shareOnWhatsApp = () => {
    window.open(
      `https://wa.me/?text=${encodeURIComponent(boardUrl)}`,
      "_blank"
    );
  };

  const shareOnTelegram = () => {
    window.open(
      `https://t.me/share/url?url=${encodeURIComponent(boardUrl)}`,
      "_blank"
    );
  };

  return (
    <div className="min-h-screen p-8 bg-background">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Step {step} of 3</span>
            <span>{Math.round((step / 3) * 100)}%</span>
          </div>
          <Progress value={(step / 3) * 100} className="h-2" />
        </div>

        {/* Step 1: Board Setup */}
        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Board Setup</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="title" className="text-sm font-medium">
                  Title
                </label>
                <Input
                  id="title"
                  placeholder="Enter board title"
                  value={boardData.title}
                  onChange={(e) =>
                    setBoardData({ ...boardData, title: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="description" className="text-sm font-medium">
                  Description
                </label>
                <Textarea
                  id="description"
                  placeholder="Enter board description (optional)"
                  value={boardData.description}
                  onChange={(e) =>
                    setBoardData({ ...boardData, description: e.target.value })
                  }
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="interactionType" className="text-sm font-medium">
                  Interaction Type
                </label>
                <Select
                  id="interactionType"
                  value={boardData.interactionType}
                  onChange={(e) =>
                    setBoardData({
                      ...boardData,
                      interactionType: e.target.value,
                    })
                  }
                >
                  <option value="like-dislike">Like / Dislike</option>
                </Select>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  onClick={handleNext}
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  Next
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Upload Cards */}
        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Upload Cards</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
                  isDragActive
                    ? "border-primary bg-primary/10"
                    : "border-muted-foreground/25 hover:border-primary/50"
                } ${cards.length >= 30 ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                <input {...getInputProps()} />
                <div className="space-y-2">
                  <p className="text-lg font-medium">
                    {isDragActive
                      ? "Drop the images here"
                      : "Drag & drop images here, or click to select"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Maximum 30 images ({cards.length}/30)
                  </p>
                </div>
              </div>

              {cards.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Uploaded Cards</h3>
                  <div className="grid grid-cols-3 gap-4">
                    {cards.map((file, index) => (
                      <div
                        key={index}
                        className="relative aspect-square rounded-lg overflow-hidden border border-border group"
                      >
                        <img
                          src={cardUrls[index]}
                          alt={file.name}
                          className="w-full h-full object-cover"
                        />
                        <button
                          onClick={() => removeCard(index)}
                          className="absolute top-2 right-2 p-1 rounded-full bg-destructive text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-between gap-2 pt-4">
                <Button variant="outline" onClick={handleBack}>
                  Back
                </Button>
                <Button
                  onClick={handleNext}
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                  disabled={cards.length === 0}
                >
                  Create Board
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Share Board */}
        {step === 3 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Share Board</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">Board Link</label>
                <div className="flex gap-2">
                  <Input
                    value={boardUrl}
                    readOnly
                    className="font-mono text-sm"
                  />
                  <Button
                    onClick={copyToClipboard}
                    variant="outline"
                    className="shrink-0"
                  >
                    {copied ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={shareOnWhatsApp}
                  variant="outline"
                  className="flex-1"
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Share on WhatsApp
                </Button>
                <Button
                  onClick={shareOnTelegram}
                  variant="outline"
                  className="flex-1"
                >
                  <Send className="h-4 w-4 mr-2" />
                  Share on Telegram
                </Button>
              </div>

              <div className="flex flex-col items-center space-y-4 pt-4">
                <div className="p-4 bg-white rounded-lg">
                  <QRCodeSVG value={boardUrl} size={200} />
                </div>
                <p className="text-sm text-muted-foreground">
                  Scan QR code to access the board
                </p>
              </div>

              <div className="flex justify-end pt-4">
                <Button
                  onClick={handleDone}
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  Done
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

