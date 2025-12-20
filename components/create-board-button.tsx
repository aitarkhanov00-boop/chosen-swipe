"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface CreateBoardButtonProps {
  showCreateFirst?: boolean;
}

export function CreateBoardButton({ showCreateFirst = false }: CreateBoardButtonProps) {
  const router = useRouter();
  
  const handleCreateBoard = () => {
    router.push("/create");
  };

  return (
    <Button
      onClick={handleCreateBoard}
      className="bg-primary text-primary-foreground hover:bg-primary/90"
    >
      <Plus className="h-4 w-4" />
      {showCreateFirst ? "Create Your First Board" : "Create Board"}
    </Button>
  );
}

