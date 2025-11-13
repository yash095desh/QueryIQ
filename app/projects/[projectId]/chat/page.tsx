"use client";

import { useChat } from "@ai-sdk/react";
import {
  DefaultChatTransport,
  lastAssistantMessageIsCompleteWithToolCalls,
  UIMessage,
} from "ai";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Fragment, useEffect, useRef, useState } from "react";
import * as XLSX from "xlsx";

import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import {
  Message,
  MessageAction,
  MessageActions,
  MessageContent,
  MessageResponse,
  MessageToolbar,
} from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputBody,
  PromptInputFooter,
  PromptInputMessage,
  PromptInputProvider,
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
  FileSpreadsheet,
  AlertTriangle,
  BarChart3,
  Table2,
  Info,
  RefreshCcwIcon,
  CopyIcon,
  ThumbsUpIcon,
  ThumbsDownIcon,
} from "lucide-react";
import { Streamdown } from "streamdown";
import axios from "axios";

function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = params.projectId as string;

  // Get sessionId from URL query params
  const sessionId = searchParams.get("session");

  const [isExporting, setIsExporting] = useState(false);
  const [liked, setLiked] = useState<Record<string, boolean>>({});
  const [disliked, setDisliked] = useState<Record<string, boolean>>({});
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { messages, sendMessage, addToolOutput, status, regenerate, setMessages } = useChat({
    transport: new DefaultChatTransport({
      api: `/api/chat/${projectId}`,
      prepareSendMessagesRequest({ messages, id }) {
        return {
          body: {
            messages: [messages[messages.length - 1]], 
            sessionId: sessionId || undefined,
          },
        };
      },
    }),
    experimental_throttle: 100, 
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,

    onFinish: ({message,messages}) => {
      console.log("finsh",{message,messages})
      if ((message.metadata as any)?.sessionId && !sessionId) {
        const url = new URL(window.location.href);
        url.searchParams.set("session", (message.metadata as any).sessionId);
        router.replace(url.pathname + url.search, { scroll: false });
      }
    },

    onError: (error) => {
      console.error("Chat error:", error);
    },

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

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
  };

  const renderToolPart = (part: any, callId: string) => {
    const toolRenderers: Record<string, any> = {
      "tool-getRowCount": () => {
        switch (part.state) {
          case "input-streaming":
          case "input-available":
            return (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader>Counting rows...</Loader>
              </div>
            );
          case "output-available":
            const output = part.output as any;
            return (
              <Card className="border-primary/20 bg-primary/5">
                <div className="p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-primary" />
                    <span className="font-semibold text-sm">Row Count</span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-primary">
                      {output.count?.toLocaleString()}
                    </span>
                    <span className="text-sm text-muted-foreground">rows</span>
                  </div>
                  {output.recommendation && (
                    <p className="text-sm text-muted-foreground">
                      {output.recommendation}
                    </p>
                  )}
                </div>
              </Card>
            );
          case "output-error":
            return (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{part.errorText}</AlertDescription>
              </Alert>
            );
        }
      },

      "tool-executeQuery": () => {
        switch (part.state) {
          case "input-streaming":
          case "input-available":
            const input = part.input as any;
            return (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader>
                  {input?.explanation
                    ? `Executing: ${input.explanation}`
                    : "Executing query..."}
                </Loader>
              </div>
            );
          case "output-available":
            const output = part.output as any;
            return (
              <div className="space-y-3">
                {output.truncated && (
                  <Alert className="border-orange-500/50 bg-orange-500/5">
                    <AlertTriangle className="h-4 w-4 text-orange-600" />
                    <AlertDescription className="text-orange-900 dark:text-orange-100">
                      {output.warning}
                    </AlertDescription>
                  </Alert>
                )}

                <div className="flex items-center gap-2">
                  <Table2 className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-semibold">Query Results</span>
                  <Badge variant="secondary" className="ml-auto">
                    {output.rowCount} rows
                  </Badge>
                </div>

                {output.results && output.results.length > 0 && (
                  <div className="rounded-lg border overflow-hidden">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/50 hover:bg-muted/50">
                            {Object.keys(output.results[0]).map((key) => (
                              <TableHead
                                key={key}
                                className="font-semibold whitespace-nowrap"
                              >
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
                                      className="font-mono text-xs max-w-xs truncate"
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
                    </div>
                    {output.results.length > 10 && (
                      <div className="px-4 py-2 text-xs text-muted-foreground bg-muted/30 border-t text-center">
                        Showing first 10 of {output.results.length} rows
                      </div>
                    )}
                  </div>
                )}

                {output.pagination && (
                  <p className="text-xs text-muted-foreground">
                    Page {output.pagination.currentPage}
                    {output.pagination.totalEstimated &&
                      ` of ~${Math.ceil(
                        output.pagination.totalEstimated / 50
                      )}`}
                  </p>
                )}
              </div>
            );
          case "output-error":
            return (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{part.errorText}</AlertDescription>
              </Alert>
            );
        }
      },

      "tool-executeAggregation": () => {
        switch (part.state) {
          case "input-streaming":
          case "input-available":
            return (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader>Computing aggregation...</Loader>
              </div>
            );
          case "output-available":
            const output = part.output as any;
            return (
              <Card>
                <div className="p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-primary" />
                    <span className="font-semibold text-sm">
                      Summary Statistics
                    </span>
                  </div>
                  <CodeBlock
                    language="json"
                    code={JSON.stringify(output.results, null, 2)}
                  />
                </div>
              </Card>
            );
          case "output-error":
            return (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{part.errorText}</AlertDescription>
              </Alert>
            );
        }
      },

      "tool-getSchema": () => {
        switch (part.state) {
          case "input-streaming":
          case "input-available":
            return (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader>Loading database schema...</Loader>
              </div>
            );
          case "output-available":
            const output = part.output as any;
            return (
              <Card>
                <div className="p-4 space-y-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Database className="h-4 w-4 text-primary" />
                    <span className="font-semibold text-sm">
                      Database Schema
                    </span>
                    <Badge variant="secondary">
                      {output.tableCount} tables
                    </Badge>
                  </div>
                  <details className="group">
                    <summary className="cursor-pointer text-sm text-primary hover:underline list-none flex items-center gap-1">
                      <span className="group-open:rotate-90 transition-transform inline-block">
                        ▶
                      </span>
                      View schema details
                    </summary>
                    <div className="mt-3">
                      <CodeBlock
                        language="json"
                        code={JSON.stringify(output, null, 2)}
                      />
                    </div>
                  </details>
                </div>
              </Card>
            );
          case "output-error":
            return (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{part.errorText}</AlertDescription>
              </Alert>
            );
        }
      },

      "tool-askForConfirmation": () => {
        switch (part.state) {
          case "input-streaming":
            return (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader>Awaiting confirmation...</Loader>
              </div>
            );
          case "input-available":
            const input = part.input as any;
            return (
              <Card className="border-yellow-500/50 bg-yellow-500/5">
                <div className="p-4 space-y-4">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    <span className="font-semibold text-sm">
                      Confirmation Required
                    </span>
                  </div>

                  <p className="text-sm">{input.message}</p>

                  {input.queryPreview && (
                    <CodeBlock language="sql" code={input.queryPreview} />
                  )}

                  {input.estimatedRows && (
                    <p className="text-sm text-muted-foreground">
                      Estimated rows: {input.estimatedRows.toLocaleString()}
                    </p>
                  )}

                  {input.alternatives && input.alternatives.length > 0 && (
                    <div className="text-sm space-y-2">
                      <p className="font-medium">Alternatives:</p>
                      <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                        {input.alternatives.map((alt: string, i: number) => (
                          <li key={i}>{alt}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2 pt-2">
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
                      <CheckCircle2 className="h-4 w-4 mr-2" />
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
                      <AlertCircle className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                  </div>
                </div>
              </Card>
            );
          case "output-available":
            const output = part.output as any;
            return (
              <p className="text-sm text-muted-foreground italic">
                {output.confirmed
                  ? "✓ User confirmed the operation"
                  : "✗ User cancelled the operation"}
              </p>
            );
          case "output-error":
            return (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{part.errorText}</AlertDescription>
              </Alert>
            );
        }
      },

      "tool-generateExcel": () => {
        switch (part.state) {
          case "input-streaming":
          case "input-available":
            return (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader>Generating Excel file...</Loader>
              </div>
            );
          case "output-available":
            const output = part.output as any;
            return (
              <Alert
                variant={output.success ? "default" : "destructive"}
                className={
                  output.success
                    ? "border-green-500/50 bg-green-500/5"
                    : undefined
                }
              >
                {output.success ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <AlertDescription className="flex items-center gap-2">
                      <FileSpreadsheet className="h-4 w-4" />
                      <span>{output.message}</span>
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
              <Alert variant="destructive">
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

  const handleSubmit = (message: PromptInputMessage) => {
    const hasText = Boolean(message.text);
    const hasAttachments = Boolean(message.files?.length);
    if (!(hasText || hasAttachments)) {
      return;
    }

    if (message.text) {
      sendMessage({ text: message.text });
    }
  };

  const loadMessages = async() =>{
    try{
      const response = await axios.get(`/api/chat/${projectId}?session=${sessionId}`)
      if(response.status == 200){
        setMessages(response.data.messages)
      }
    }catch(error){
      console.log("Error while fetching session messages",(error as Error).message)
    }
  }

  useEffect(()=>{
    if(projectId && sessionId){
      loadMessages();
    }
  },[sessionId,projectId])

  return (
    <div className="min-h-screen w-full bg-transparent backdrop-blur-md  dark:bg-zinc-900/30">
      <div className="max-h-screen h-full w-full p-2 pb-4 overflow-y-auto">
        <div className=" max-w-6xl w-full h-full mx-auto flex flex-col justify-between ">
          {/* Conversation Area */}
          <div className="flex-1 ">
            <Conversation>
              <ConversationContent className="flex-1 px-4 sm:px-6 lg:px-8 py-6">
                {/* Empty State */}
                {messages.length === 0 ? (
                  <ConversationEmptyState
                    icon={<Database className="h-12 w-12" />}
                    title="Database Assistant"
                    description="Ask me anything about your database. I can help you query data, generate insights, and export results."
                  />
                ) : (
                  <div className="space-y-4">
                    {messages.map((message, messageIndex) => {
                      const isLastMessage =
                        messageIndex === messages.length - 1;
                      const isLastAssistantMessage =
                        message.role === "assistant" && isLastMessage;

                      const textParts = message.parts.filter(
                        (p: any) => p.type === "text"
                      );
                      const toolParts = message.parts.filter(
                        (p: any) => p.type !== "text"
                      );

                      return (
                        <Fragment key={message.id}>
                          {/* Render text parts */}
                          {textParts.length > 0 && (
                            <Message from={message.role}>
                              <MessageContent>
                                {textParts.map((part: any, index) => (
                                  <Streamdown
                                    isAnimating={status === "streaming"}
                                    key={index}
                                  >
                                    {part.text}
                                  </Streamdown>
                                ))}
                              </MessageContent>
                            </Message>
                          )}

                          {/* Render tool parts */}
                          {toolParts.map((part: any, i: number) => {
                            const callId =
                              part.toolCallId || `${message.id}-tool-${i}`;
                            return (
                              <Message key={callId} from="assistant">
                                <MessageContent>
                                  {renderToolPart(part, callId)}
                                </MessageContent>
                              </Message>
                            );
                          })}

                          {/* Toolbar for assistant */}
                          {message.role === "assistant" && (
                            <MessageToolbar>
                              <MessageActions>
                                {isLastAssistantMessage &&
                                  status === "ready" && (
                                    <MessageAction
                                      onClick={() => regenerate()}
                                      label="Regenerate"
                                      tooltip="Regenerate response"
                                    >
                                      <RefreshCcwIcon className="size-4" />
                                    </MessageAction>
                                  )}
                                <MessageAction
                                  label="Like"
                                  onClick={() =>
                                    setLiked((prev) => ({
                                      ...prev,
                                      [message.id]: !prev[message.id],
                                    }))
                                  }
                                  tooltip="Like this response"
                                >
                                  <ThumbsUpIcon
                                    className="size-4"
                                    fill={
                                      liked[message.id]
                                        ? "currentColor"
                                        : "none"
                                    }
                                  />
                                </MessageAction>
                                <MessageAction
                                  label="Dislike"
                                  onClick={() =>
                                    setDisliked((prev) => ({
                                      ...prev,
                                      [message.id]: !prev[message.id],
                                    }))
                                  }
                                  tooltip="Dislike this response"
                                >
                                  <ThumbsDownIcon
                                    className="size-4"
                                    fill={
                                      disliked[message.id]
                                        ? "currentColor"
                                        : "none"
                                    }
                                  />
                                </MessageAction>
                                <MessageAction
                                  onClick={() =>
                                    handleCopy(
                                      textParts
                                        .map((p: any) => p.text)
                                        .join("\n")
                                    )
                                  }
                                  label="Copy"
                                  tooltip="Copy to clipboard"
                                >
                                  <CopyIcon className="size-4" />
                                </MessageAction>
                              </MessageActions>
                            </MessageToolbar>
                          )}
                        </Fragment>
                      );
                    })}
                    {/* Stream status */}
                    {status === "streaming" && (
                      <Message from="assistant">
                        <MessageContent>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Loader>Thinking...</Loader>
                          </div>
                        </MessageContent>
                      </Message>
                    )}

                    {/* Exporting state */}
                    {isExporting && (
                      <Message from="assistant">
                        <MessageContent>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Loader>Preparing download...</Loader>
                          </div>
                        </MessageContent>
                      </Message>
                    )}
                  </div>
                )}
              </ConversationContent>

              <ConversationScrollButton />
            </Conversation>
          </div>

          {/* Fixed Input Area */}
          <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
            <PromptInputProvider>
              <PromptInput onSubmit={handleSubmit}>
                <PromptInputBody>
                  <PromptInputTextarea ref={textareaRef} />
                </PromptInputBody>
                <PromptInputFooter className=" flex justify-end">
                  <PromptInputSubmit status={status} />
                </PromptInputFooter>
              </PromptInput>
            </PromptInputProvider>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ChatPage;
