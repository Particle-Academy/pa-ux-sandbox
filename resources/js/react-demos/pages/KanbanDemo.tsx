import { useState, useCallback } from "react";
import { Kanban } from "@particle-academy/react-fancy";
import { DemoSection } from "../components/DemoSection";

interface KanbanCard {
  id: string;
  title: string;
  description: string;
}

interface BoardState {
  [columnId: string]: KanbanCard[];
}

const initialBoard: BoardState = {
  todo: [
    { id: "1", title: "Design homepage", description: "Create wireframes and mockups" },
    { id: "2", title: "Set up CI/CD", description: "Configure GitHub Actions pipeline" },
    { id: "3", title: "Write API docs", description: "Document all REST endpoints" },
  ],
  "in-progress": [
    { id: "4", title: "Build auth flow", description: "Login, register, and password reset" },
    { id: "5", title: "Dashboard layout", description: "Responsive sidebar and header" },
  ],
  done: [
    { id: "6", title: "Project setup", description: "Initialize repo and install deps" },
  ],
};

export function KanbanDemo() {
  const [board, setBoard] = useState<BoardState>(initialBoard);

  const handleCardMove = useCallback(
    (cardId: string, fromColumn: string, toColumn: string) => {
      setBoard((prev) => {
        const from = [...(prev[fromColumn] ?? [])];
        const to = [...(prev[toColumn] ?? [])];
        const cardIndex = from.findIndex((c) => c.id === cardId);
        if (cardIndex === -1) return prev;

        const [card] = from.splice(cardIndex, 1);
        to.push(card);

        return {
          ...prev,
          [fromColumn]: from,
          [toColumn]: to,
        };
      });
    },
    [],
  );

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Kanban</h1>

      <DemoSection title="Drag & Drop Board" description="Drag cards between columns to reorganize." code={`<Kanban onCardMove={handleCardMove}>
  <Kanban.Column id="todo" title="To Do">
    <Kanban.Card id="1">
      <p>Design homepage</p>
    </Kanban.Card>
  </Kanban.Column>
  <Kanban.Column id="done" title="Done">
    <Kanban.Card id="2">
      <p>Project setup</p>
    </Kanban.Card>
  </Kanban.Column>
</Kanban>`}>
        <Kanban onCardMove={handleCardMove}>
          <Kanban.Column id="todo" title="To Do">
            {board.todo.map((card) => (
              <Kanban.Card key={card.id} id={card.id}>
                <p className="font-medium text-sm">{card.title}</p>
                <p className="text-xs text-zinc-500 mt-1">{card.description}</p>
              </Kanban.Card>
            ))}
          </Kanban.Column>
          <Kanban.Column id="in-progress" title="In Progress">
            {board["in-progress"].map((card) => (
              <Kanban.Card key={card.id} id={card.id}>
                <p className="font-medium text-sm">{card.title}</p>
                <p className="text-xs text-zinc-500 mt-1">{card.description}</p>
              </Kanban.Card>
            ))}
          </Kanban.Column>
          <Kanban.Column id="done" title="Done">
            {board.done.map((card) => (
              <Kanban.Card key={card.id} id={card.id}>
                <p className="font-medium text-sm">{card.title}</p>
                <p className="text-xs text-zinc-500 mt-1">{card.description}</p>
              </Kanban.Card>
            ))}
          </Kanban.Column>
        </Kanban>
      </DemoSection>
    </div>
  );
}
