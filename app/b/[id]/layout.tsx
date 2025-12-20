import type { Metadata } from "next";
import { getBoard } from "@/lib/store";

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const board = getBoard(id);

  if (!board) {
    return {
      title: "Board not found",
    };
  }

  const title = `${board.name || "Board"} — Chosen`;
  const description = board.description || "Vote on this board to help decide!";
  const url = `https://chosen-swipe.vercel.app/b/${id}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      url,
      siteName: "Chosen",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default function BoardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

