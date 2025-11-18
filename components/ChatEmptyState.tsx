// components/ChatEmptyState.tsx
import { Database } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ChatEmptyStateProps {
  onSendMessage: (message: { text: string }) => void;
}

const EXAMPLE_PROMPTS = [
  "Show me all tables in my database",
  "Count total rows in users table",
  "Get the latest 10 orders",
  "Analyze sales data by month",
];

export function ChatEmptyState({ onSendMessage }: ChatEmptyStateProps) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-3xl space-y-8">
        {/* Welcome Message */}
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="p-4 bg-primary/10 rounded-full">
              <Database className="h-12 w-12 text-primary" />
            </div>
          </div>
          <div>
            <h2 className="text-2xl font-bold mb-2">
              Welcome to Database Assistant
            </h2>
            <p className="text-muted-foreground">
              Ask me anything about your database. I can help you query data,
              generate insights, and export results.
            </p>
          </div>
        </div>

        {/* Example Prompts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {EXAMPLE_PROMPTS.map((prompt, idx) => (
            <Button
              key={idx}
              variant="outline"
              className="justify-start text-left h-auto py-3 px-4"
              onClick={() => onSendMessage({ text: prompt })}
            >
              <span className="text-sm">{prompt}</span>
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}