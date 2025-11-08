"use client";

import { useChat } from "@ai-sdk/react";
import {
  DefaultChatTransport,
  lastAssistantMessageIsCompleteWithToolCalls,
} from "ai";
import { useParams } from "next/navigation";
import { Fragment, useEffect, useState } from "react";
import * as XLSX from "xlsx";

import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Message, MessageAction, MessageActions, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputSubmit,
  PromptInputTextarea,
} from "@/components/ai-elements/prompt-input";
import { CodeBlock } from "@/components/ai-elements/code-block";
import { Loader } from "@/components/ai-elements/loader";

// Import shadcn components
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertCircle,
  CheckCircle2,
  Database,
  Download,
  FileSpreadsheet,
  AlertTriangle,
  BarChart3,
  Table2,
  Info,
  RefreshCcwIcon,
  CopyIcon,
} from "lucide-react";

function ChatPage() {
  const params = useParams();
  const projectId = params.projectId as string;
  const [input, setInput] = useState("");
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    console.log("projectID:", projectId);
  }, [projectId]);

  const { messages, sendMessage, addToolOutput, status, regenerate } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
      body: { projectId },
    }),

    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,

    async onToolCall({ toolCall }) {
      if (toolCall.dynamic) return;

      if (toolCall.toolName === "generateExcel") {
        await handleExcelExport(toolCall);
      }
    },
  });

  async function handleExcelExport(toolCall: any) {
    setIsExporting(true);
    try {
      const { query, filename, sheetName } = toolCall.args;

      const response = await fetch("/api/execute-export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, query }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch data for export");
      }

      const { data } = await response.json();

      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName || "Data");

      XLSX.writeFile(workbook, `${filename}.xlsx`);

      addToolOutput({
        tool: "generateExcel",
        toolCallId: toolCall.toolCallId,
        output: {
          success: true,
          rowsExported: data.length,
          message: `Successfully exported ${data.length} rows to ${filename}.xlsx`,
        },
      });
    } catch (error) {
      console.error("Excel generation error:", error);
      addToolOutput({
        tool: "generateExcel",
        toolCallId: toolCall.toolCallId,
        output: {
          success: false,
          error: error instanceof Error ? error.message : "Export failed",
        },
      });
    } finally {
      setIsExporting(false);
    }
  }

  const renderToolPart = (part: any, callId: string) => {
    const toolRenderers: Record<string, any> = {
      "tool-getRowCount": () => {
        switch (part.state) {
          case "input-streaming":
            return <Loader key={callId}>Checking row count...</Loader>;
          case "input-available":
            return <Loader key={callId}>Counting rows...</Loader>;
          case "output-available":
            const output = part.output as any;
            return (
              <Card
                key={callId}
                className="mt-3 p-4 bg-primary/5 border-primary/20"
              >
                <div className="flex items-center gap-2 mb-2">
                  <BarChart3 className="h-4 w-4 text-primary" />
                  <span className="font-semibold text-sm">Row Count</span>
                </div>
                <div className="text-3xl font-bold text-primary mb-2">
                  {output.count?.toLocaleString()}
                  <span className="text-sm font-normal text-muted-foreground ml-2">
                    rows
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {output.recommendation}
                </p>
              </Card>
            );
          case "output-error":
            return (
              <Alert key={callId} variant="destructive" className="mt-3">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{part.errorText}</AlertDescription>
              </Alert>
            );
        }
      },

      "tool-executeQuery": () => {
        switch (part.state) {
          case "input-streaming":
            return <Loader key={callId}>Preparing query...</Loader>;
          case "input-available":
            const input = part.input as any;
            return <Loader key={callId}>Executing: {input.explanation}</Loader>;
          case "output-available":
            const output = part.output as any;
            return (
              <div key={callId} className="mt-3 space-y-3">
                {output.truncated && (
                  <Alert variant="default" className="border-orange-500/50">
                    <AlertTriangle className="h-4 w-4 text-orange-500" />
                    <AlertDescription>{output.warning}</AlertDescription>
                  </Alert>
                )}

                <div className="flex items-center gap-2 text-sm font-semibold">
                  <Table2 className="h-4 w-4" />
                  Query Results
                  <Badge variant="secondary">{output.rowCount} rows</Badge>
                </div>

                {output.results && output.results.length > 0 && (
                  <div className="rounded-lg border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          {Object.keys(output.results[0]).map((key) => (
                            <TableHead key={key} className="font-semibold">
                              {key}
                            </TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {output.results
                          .slice(0, 10)
                          .map((row: any, idx: number) => (
                            <TableRow key={idx}>
                              {Object.values(row).map(
                                (value: any, cellIdx: number) => (
                                  <TableCell
                                    key={cellIdx}
                                    className="font-mono text-xs"
                                  >
                                    {value === null ? (
                                      <span className="text-muted-foreground italic">
                                        null
                                      </span>
                                    ) : (
                                      String(value)
                                    )}
                                  </TableCell>
                                )
                              )}
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                    {output.results.length > 10 && (
                      <div className="px-4 py-2 text-xs text-muted-foreground bg-muted/30 border-t">
                        Showing first 10 of {output.results.length} rows
                      </div>
                    )}
                  </div>
                )}

                {output.pagination && (
                  <div className="text-xs text-muted-foreground">
                    Page {output.pagination.currentPage}
                    {output.pagination.totalEstimated &&
                      ` of ~${Math.ceil(
                        output.pagination.totalEstimated / 50
                      )}`}
                  </div>
                )}
              </div>
            );
          case "output-error":
            return (
              <Alert key={callId} variant="destructive" className="mt-3">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{part.errorText}</AlertDescription>
              </Alert>
            );
        }
      },

      "tool-executeAggregation": () => {
        switch (part.state) {
          case "input-streaming":
            return <Loader key={callId}>Computing aggregation...</Loader>;
          case "input-available":
            return <Loader key={callId}>Running aggregation query...</Loader>;
          case "output-available":
            const output = part.output as any;
            return (
              <Card key={callId} className="mt-3 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <BarChart3 className="h-4 w-4 text-primary" />
                  <span className="font-semibold text-sm">
                    Summary Statistics
                  </span>
                </div>
                <CodeBlock
                  language="json"
                  code={JSON.stringify(output.results, null, 2)}
                />
              </Card>
            );
          case "output-error":
            return (
              <Alert key={callId} variant="destructive" className="mt-3">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{part.errorText}</AlertDescription>
              </Alert>
            );
        }
      },

      "tool-getSchema": () => {
        switch (part.state) {
          case "input-streaming":
            return <Loader key={callId}>Loading schema...</Loader>;
          case "input-available":
            return <Loader key={callId}>Retrieving database schema...</Loader>;
          case "output-available":
            const output = part.output as any;
            return (
              <Card key={callId} className="mt-3 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Database className="h-4 w-4 text-primary" />
                  <span className="font-semibold text-sm">Database Schema</span>
                  <Badge variant="secondary">{output.tableCount} tables</Badge>
                </div>
                <details className="mt-2">
                  <summary className="cursor-pointer text-sm text-primary hover:underline">
                    View details
                  </summary>
                  <CodeBlock
                    language="json"
                    code={JSON.stringify(output, null, 2)}
                    className="mt-2"
                  />
                </details>
              </Card>
            );
          case "output-error":
            return (
              <Alert key={callId} variant="destructive" className="mt-3">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{part.errorText}</AlertDescription>
              </Alert>
            );
        }
      },

      "tool-askForConfirmation": () => {
        switch (part.state) {
          case "input-streaming":
            return <Loader key={callId}>Loading confirmation...</Loader>;
          case "input-available":
            const input = part.input as any;
            return (
              <Card
                key={callId}
                className="mt-3 p-4 border-yellow-500/50 bg-yellow-500/5"
              >
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  <span className="font-semibold text-sm">
                    Confirmation Required
                  </span>
                </div>
                <p className="text-sm mb-3">{input.message}</p>
                {input.queryPreview && (
                  <CodeBlock
                    language="sql"
                    code={input.queryPreview}
                    className="mb-3"
                  />
                )}
                {input.estimatedRows && (
                  <p className="text-sm text-muted-foreground mb-3">
                    Estimated rows: {input.estimatedRows.toLocaleString()}
                  </p>
                )}
                {input.alternatives && (
                  <div className="text-sm mb-3">
                    <strong>Alternatives:</strong>
                    <ul className="list-disc ml-5 mt-1 text-muted-foreground">
                      {input.alternatives.map((alt: string, i: number) => (
                        <li key={i}>{alt}</li>
                      ))}
                    </ul>
                  </div>
                )}
                <div className="flex gap-2">
                  <Button
                    onClick={() =>
                      addToolOutput({
                        tool: "askForConfirmation",
                        toolCallId: callId,
                        output: { confirmed: true },
                      })
                    }
                    size="sm"
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle2 className="h-4 w-4 mr-1" />
                    Proceed
                  </Button>
                  <Button
                    onClick={() =>
                      addToolOutput({
                        tool: "askForConfirmation",
                        toolCallId: callId,
                        output: { confirmed: false },
                      })
                    }
                    size="sm"
                    variant="destructive"
                  >
                    <AlertCircle className="h-4 w-4 mr-1" />
                    Cancel
                  </Button>
                </div>
              </Card>
            );
          case "output-available":
            const output = part.output as any;
            return (
              <p
                key={callId}
                className="mt-2 text-sm text-muted-foreground italic"
              >
                User {output.confirmed ? "confirmed" : "cancelled"} the
                operation
              </p>
            );
          case "output-error":
            return (
              <Alert key={callId} variant="destructive" className="mt-3">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{part.errorText}</AlertDescription>
              </Alert>
            );
        }
      },

      "tool-generateExcel": () => {
        switch (part.state) {
          case "input-streaming":
            return <Loader key={callId}>Preparing export...</Loader>;
          case "input-available":
            return <Loader key={callId}>Generating Excel file...</Loader>;
          case "output-available":
            const output = part.output as any;
            return (
              <Alert
                key={callId}
                variant={output.success ? "default" : "destructive"}
                className={
                  output.success
                    ? "mt-3 border-green-500/50 bg-green-500/5"
                    : "mt-3"
                }
              >
                {output.success ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <AlertDescription className="flex items-center gap-2">
                      <FileSpreadsheet className="h-4 w-4" />
                      {output.message}
                    </AlertDescription>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{output.error}</AlertDescription>
                  </>
                )}
              </Alert>
            );
          case "output-error":
            return (
              <Alert key={callId} variant="destructive" className="mt-3">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Export failed: {part.errorText}
                </AlertDescription>
              </Alert>
            );
        }
      },
    };

    const renderer = toolRenderers[part.type];
    return renderer ? renderer() : null;
  };

  return (
    <div className="flex flex-col h-screen">
      <Conversation className="flex-1">
        <ConversationContent>
          {/* Empty State */}
          {messages.length === 0 ? (
            <ConversationEmptyState
              icon={<Database className="h-12 w-12" />}
              title="Database Assistant"
              description="Ask me anything about your database. I can help you query data, generate insights, and export results."
            />
          ) : (
            messages.map((message, messageIndex) => (
              <Fragment key={message.id}>
                {message.parts.map((part: any, i: number) => {
                  const isLastMessage = messageIndex === messages.length - 1;
                  const callId = part.toolCallId || `${message.id}-${i}`;

                  if (part.type === "text") {
                    return (
                      <Fragment key={callId}>
                        <Message from={message.role}>
                          <MessageContent>
                            <MessageResponse>
                                {part.text}
                            </MessageResponse>
                          </MessageContent>
                        </Message>

                        {/* Assistant message actions */}
                        {message.role === "assistant" && isLastMessage && (
                          <MessageActions>
                            <MessageAction
                              onClick={() => regenerate()}
                              label="Retry"
                            >
                              <RefreshCcwIcon className="size-3" />
                            </MessageAction>
                            <MessageAction
                              onClick={() =>
                                navigator.clipboard.writeText(part.text)
                              }
                              label="Copy"
                            >
                              <CopyIcon className="size-3" />
                            </MessageAction>
                          </MessageActions>
                        )}
                      </Fragment>
                    );
                  }

                  return (
                    <Message key={callId} from="assistant">
                      <MessageContent>
                        {renderToolPart(part, callId)}
                      </MessageContent>
                    </Message>
                  );
                })}
              </Fragment>
            ))
          )}

          {/* Stream status */}
          {status === "streaming" && (
            <Message from="assistant">
              <MessageContent>
                <Loader>Thinking...</Loader>
              </MessageContent>
            </Message>
          )}

          {/* Exporting state */}
          {isExporting && (
            <Message from="assistant">
              <MessageContent>
                <Loader>Generating Excel file...</Loader>
              </MessageContent>
            </Message>
          )}
        </ConversationContent>

        <ConversationScrollButton />
      </Conversation>

      <div className="border-t p-4 bg-background">
        <PromptInput
          onSubmit={() => {
            if (input.trim() && status === "ready") {
              sendMessage({ text: input });
              setInput("");
            }
          }}
        >
          <PromptInputTextarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about your database... (e.g., 'Show me all users', 'Count active orders')"
            disabled={status !== "ready" || isExporting}
            rows={1}
          />
          <PromptInputSubmit
            disabled={status !== "ready" || isExporting || !input.trim()}
          />
        </PromptInput>

        <div className="mt-2 flex items-start gap-2 text-xs text-muted-foreground">
          <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
          <p>
            <strong>Tips:</strong> Ask for row counts first • Request summaries
            for large datasets • Export to Excel for &gt;100 rows
          </p>
        </div>
      </div>
    </div>
  );
}

export default ChatPage;
