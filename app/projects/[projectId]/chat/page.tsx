"use client";

import { useChat } from "@ai-sdk/react";
import {
  DefaultChatTransport,
  lastAssistantMessageIsCompleteWithToolCalls,
} from "ai";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Fragment, useEffect, useRef, useState } from "react";
import * as XLSX from "xlsx";

import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import {
  Message,
  MessageAction,
  MessageActions,
  MessageContent,
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
import {
  Tool,
  ToolContent,
  ToolHeader,
  ToolInput,
  ToolOutput,
} from "@/components/ai-elements/tool";
import {
  Confirmation,
  ConfirmationAccepted,
  ConfirmationAction,
  ConfirmationActions,
  ConfirmationRejected,
  ConfirmationRequest,
  ConfirmationTitle,
} from "@/components/ai-elements/confirmation";
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
  RefreshCcwIcon,
  CopyIcon,
  ThumbsUpIcon,
  ThumbsDownIcon,
  MessageSquare,
  CheckIcon,
  XIcon,
} from "lucide-react";
import { Streamdown } from "streamdown";
import axios from "axios";
import { ChatSessionSidebar } from "@/components/ChatSessionSidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { useUser } from "@clerk/nextjs";

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
  const [sessionTitle, setSessionTitle] = useState<string>("");
  const [isLoadingSession, setIsLoadingSession] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { user } = useUser();
  
  // Track if URL update came from our onFinish callback
  const isUpdatingUrlRef = useRef(false);
  const loadedSessionRef = useRef<string | null>(null);

    // Generate a stable chat ID that doesn't change during the session
  const [chatId] = useState(() => sessionId || `new-chat-${Date.now()}`);

  const {
    messages,
    sendMessage,
    addToolOutput,
    status,
    regenerate,
    setMessages,
  } = useChat({
    id: chatId ,
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

    onFinish: ({ message, messages }) => {
      console.log("finish",messages, messages);
      const newSessionId = (message.metadata as any)?.sessionId;
      
      // Only update URL if we don't have a sessionId yet and we received a new one
      if (newSessionId && !sessionId) {
        isUpdatingUrlRef.current = true;
        loadedSessionRef.current = newSessionId;
        
        const url = new URL(window.location.href);
        url.searchParams.set("session", newSessionId);
        router.replace(url.pathname + url.search, { scroll: false });
        
        // Reset flag after a short delay
        setTimeout(() => {
          isUpdatingUrlRef.current = false;
        }, 100);
      }
    },

    onError: (error) => {
      console.error("Chat error:", error);
    },

    async onToolCall({ toolCall }) {
      if (toolCall.dynamic) return;

      if (toolCall.toolName === "generateExcel") {
        console?.log("ToolCall object:", toolCall);
        await handleExcelExport(toolCall);
      }
    },
  });

  async function handleExcelExport(toolCall: any) {
    setIsExporting(true);
    try {
      const { query, filename, sheetName } = toolCall.input;

      const response = await fetch("/api/chat/execute-export", {
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
      "tool-getRowCount": () => (
        <Tool defaultOpen={part.state === "output-available"}>
          <ToolHeader state={part.state} title="Row Count" type={part.type} />
          <ToolContent>
            {part.state === "output-available" && (
              <ToolOutput
                errorText={part.errorText}
                output={
                  <Card className="border-primary/20 bg-primary/5">
                    <div className="p-4 space-y-3">
                      <div className="flex items-center gap-2">
                        <BarChart3 className="h-4 w-4 text-primary" />
                        <span className="font-semibold text-sm">Row Count</span>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold text-primary">
                          {part.output.count?.toLocaleString()}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          rows
                        </span>
                      </div>
                      {part.output.recommendation && (
                        <p className="text-sm text-muted-foreground">
                          {part.output.recommendation}
                        </p>
                      )}
                    </div>
                  </Card>
                }
              />
            )}
            {part.state === "output-error" && (
              <ToolOutput errorText={part.errorText} output={undefined} />
            )}
          </ToolContent>
        </Tool>
      ),

      "tool-executeQuery": () => (
        <Tool defaultOpen={part.state === "output-available"}>
          <ToolHeader
            state={part.state}
            title="Execute Query"
            type={part.type}
          />
          <ToolContent>
            {(part.state === "input-streaming" ||
              part.state === "input-available") && (
              <ToolInput
                input={
                  part.input?.explanation
                    ? { explanation: part.input.explanation }
                    : {}
                }
              />
            )}
            {part.state === "output-available" && (
              <ToolOutput
                errorText={part.errorText}
                output={
                  <div className="space-y-3 w-full overflow-hidden">
                    {part.output.truncated && (
                      <Alert className="border-orange-500/50 bg-orange-500/5">
                        <AlertTriangle className="h-4 w-4 text-orange-600" />
                        <AlertDescription className="text-orange-900 dark:text-orange-100">
                          {part.output.warning}
                        </AlertDescription>
                      </Alert>
                    )}
                    <div className="flex items-center gap-2">
                      <Table2 className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-semibold">
                        Query Results
                      </span>
                      <Badge variant="secondary" className="ml-auto">
                        {part.output.rowCount} rows
                      </Badge>
                    </div>
                    {part.output.results && part.output.results.length > 0 && (
                      <div className="rounded-lg border overflow-hidden w-full">
                        <div className="overflow-x-auto max-w-full">
                          <Table>
                            <TableHeader>
                              <TableRow className="bg-muted/50 hover:bg-muted/50">
                                {Object.keys(part.output.results[0]).map(
                                  (key) => (
                                    <TableHead
                                      key={key}
                                      className="font-semibold whitespace-nowrap"
                                    >
                                      {key}
                                    </TableHead>
                                  )
                                )}
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {part.output.results
                                .slice(0, 10)
                                .map((row: any, idx: number) => (
                                  <TableRow key={idx}>
                                    {Object.values(row).map(
                                      (value: any, cellIdx: number) => (
                                        <TableCell
                                          key={cellIdx}
                                          className="font-mono text-xs max-w-[200px] truncate"
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
                        {part.output.results.length > 10 && (
                          <div className="px-4 py-2 text-xs text-muted-foreground bg-muted/30 border-t text-center">
                            Showing first 10 of {part.output.results.length}{" "}
                            rows
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                }
              />
            )}
            {part.state === "output-error" && (
              <ToolOutput errorText={part.errorText} output={undefined} />
            )}
          </ToolContent>
        </Tool>
      ),

      "tool-executeAggregation": () => (
        <Tool defaultOpen={part.state === "output-available"}>
          <ToolHeader
            state={part.state}
            title="Execute Aggregation"
            type={part.type}
          />
          <ToolContent>
            {part.state === "output-available" && (
              <ToolOutput
                errorText={part.errorText}
                output={
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
                        code={JSON.stringify(part.output.results, null, 2)}
                      />
                    </div>
                  </Card>
                }
              />
            )}
            {part.state === "output-error" && (
              <ToolOutput errorText={part.errorText} output={undefined} />
            )}
          </ToolContent>
        </Tool>
      ),

      "tool-getSchema": () => (
        <Tool defaultOpen={part.state === "output-available"}>
          <ToolHeader
            state={part.state}
            title="Database Schema"
            type={part.type}
          />
          <ToolContent>
            {part.state === "output-available" && (
              <ToolOutput
                errorText={part.errorText}
                output={
                  <Card>
                    <div className="p-4 space-y-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Database className="h-4 w-4 text-primary" />
                        <span className="font-semibold text-sm">
                          Database Schema
                        </span>
                        <Badge variant="secondary">
                          {part.output.tableCount} tables
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
                            code={JSON.stringify(part.output, null, 2)}
                          />
                        </div>
                      </details>
                    </div>
                  </Card>
                }
              />
            )}
            {part.state === "output-error" && (
              <ToolOutput errorText={part.errorText} output={undefined} />
            )}
          </ToolContent>
        </Tool>
      ),

      "tool-askForConfirmation": () => (
        <Tool defaultOpen>
          <ToolHeader
            state={part.state}
            title="Confirmation Required"
            type={part.type}
          />
          <ToolContent>
            <ToolInput input={part.input} />
            <Confirmation
              approval={
                part.state === "output-available"
                  ? { id: callId, approved: part.output?.confirmed }
                  : undefined
              }
              state={
                part.state === "input-available"
                  ? "input-available"
                  : part.state === "output-available"
                  ? "output-available"
                  : "input-available"
              }
            >
              <ConfirmationTitle>
                <ConfirmationRequest>
                  {part.input?.message || "Do you want to proceed?"}
                </ConfirmationRequest>
                <ConfirmationAccepted>
                  <CheckIcon className="size-4 text-green-600 dark:text-green-400" />
                  <span>Confirmed</span>
                </ConfirmationAccepted>
                <ConfirmationRejected>
                  <XIcon className="size-4 text-destructive" />
                  <span>Cancelled</span>
                </ConfirmationRejected>
              </ConfirmationTitle>
              {part.state === "input-available" && (
                <ConfirmationActions>
                  <ConfirmationAction
                    onClick={() =>
                      addToolOutput({
                        tool: "askForConfirmation",
                        toolCallId: callId,
                        output: { confirmed: false },
                      })
                    }
                    variant="outline"
                  >
                    <XIcon className="h-4 w-4 mr-2" />
                    Cancel
                  </ConfirmationAction>
                  <ConfirmationAction
                    onClick={() =>
                      addToolOutput({
                        tool: "askForConfirmation",
                        toolCallId: callId,
                        output: { confirmed: true },
                      })
                    }
                    variant="default"
                  >
                    <CheckIcon className="h-4 w-4 mr-2" />
                    Proceed
                  </ConfirmationAction>
                </ConfirmationActions>
              )}
            </Confirmation>
            {part.input?.queryPreview && (
              <div className="mt-3">
                <CodeBlock language="sql" code={part.input.queryPreview} />
              </div>
            )}
            {part.input?.estimatedRows && (
              <p className="text-sm text-muted-foreground mt-2">
                Estimated rows: {part.input.estimatedRows.toLocaleString()}
              </p>
            )}
            {part.input?.alternatives && part.input.alternatives.length > 0 && (
              <div className="text-sm space-y-2 mt-3">
                <p className="font-medium">Alternatives:</p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  {part.input.alternatives.map((alt: string, i: number) => (
                    <li key={i}>{alt}</li>
                  ))}
                </ul>
              </div>
            )}
          </ToolContent>
        </Tool>
      ),

      "tool-generateExcel": () => (
        <Tool defaultOpen={part.state === "output-available"}>
          <ToolHeader
            state={part.state}
            title="Generate Excel"
            type={part.type}
          />
          <ToolContent>
            {part.state === "output-available" && (
              <ToolOutput
                errorText={part.errorText}
                output={
                  part.output.success ? (
                    <Alert className="border-green-500/50 bg-green-500/5">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <AlertDescription className="flex items-center gap-2">
                        <FileSpreadsheet className="h-4 w-4" />
                        <span>{part.output.message}</span>
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{part.output.error}</AlertDescription>
                    </Alert>
                  )
                }
              />
            )}
            {part.state === "output-error" && (
              <ToolOutput
                errorText={`Export failed: ${part.errorText}`}
                output={undefined}
              />
            )}
          </ToolContent>
        </Tool>
      ),
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

  // Load messages when sessionId changes from URL navigation (not from our own URL update)
  useEffect(() => {
    const loadSession = async () => {
      // Don't load if:
      // 1. No sessionId
      // 2. We just updated the URL ourselves (new session being created)
      // 3. We already loaded this session
      // 4. We already have messages (ongoing conversation)
      if (
        !sessionId || 
        isUpdatingUrlRef.current || 
        sessionId === loadedSessionRef.current ||
        messages.length > 0
      ) {
        if (isUpdatingUrlRef.current && sessionId) {
          loadedSessionRef.current = sessionId;
        }
        return;
      }

      setIsLoadingSession(true);
      try {
        const response = await axios.get(
          `/api/chat/${projectId}?session=${sessionId}`
        );
        
        if (response.status === 200) {
          console?.log("session messages:",response?.data?.messages)
          setMessages(response.data.messages || []);
          setSessionTitle(response.data.title || "Chat Session");
          loadedSessionRef.current = sessionId;
        }
      } catch (error) {
        console.error("Error loading session:", error);
      } finally {
        setIsLoadingSession(false);
      }
    };

    loadSession();
  }, [sessionId, projectId, setMessages, messages.length]);

  // Clear session when there's no sessionId (new chat)
  useEffect(() => {
    if (!sessionId && loadedSessionRef.current) {
      setSessionTitle("");
      loadedSessionRef.current = null;
      // Only clear messages if we're transitioning from a session to no session
      if (messages.length > 0) {
        setMessages([]);
      }
    }
  }, [sessionId, messages.length, setMessages]);

  return (
    <SidebarProvider
      defaultOpen={false}
      className="group/sidebar"
      style={
        {
          "--sidebar-width": "20rem",
          "--sidebar-width-mobile": "20rem",
        } as React.CSSProperties
      }
    >
      <div className="flex flex-col min-h-screen flex-1 min-w-0 bg-transparent backdrop-blur-md dark:bg-zinc-900/30">
        {/* Top Header */}
        <div className="border-b border-border p-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            {sessionId ? (
              <>
                <MessageSquare className="h-5 w-5 text-muted-foreground" />
                <div>
                  {user?.firstName && (
                    <h1 className="text-sm font-medium truncate max-w-md">
                      {sessionTitle || `Welcome back, ${user?.firstName}`}
                    </h1>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Session: {sessionId.slice(0, 8)}...
                  </p>
                </div>
              </>
            ) : (
              <div>
                <h1 className="text-sm font-medium">New Chat</h1>
                <p className="text-xs text-muted-foreground">
                  Start a conversation with your database
                </p>
              </div>
            )}
          </div>
          <SidebarTrigger />
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {messages.length === 0 ? (
            /* Empty State */
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
                      Ask me anything about your database. I can help you query
                      data, generate insights, and export results.
                    </p>
                  </div>
                </div>

                {/* Example Prompts */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[
                    "Show me all tables in my database",
                    "Count total rows in users table",
                    "Get the latest 10 orders",
                    "Analyze sales data by month",
                  ].map((prompt, idx) => (
                    <Button
                      key={idx}
                      variant="outline"
                      className="justify-start text-left h-auto py-3 px-4"
                      onClick={() => sendMessage({ text: prompt })}
                    >
                      <span className="text-sm">{prompt}</span>
                    </Button>
                  ))}
                </div>

                {/* Input Area */}
                <PromptInputProvider>
                  <PromptInput onSubmit={handleSubmit}>
                    <PromptInputBody>
                      <PromptInputTextarea
                        ref={textareaRef}
                        placeholder="Ask about your database..."
                      />
                    </PromptInputBody>
                    <PromptInputFooter className="flex justify-end">
                      <PromptInputSubmit status={status} />
                    </PromptInputFooter>
                  </PromptInput>
                </PromptInputProvider>
              </div>
            </div>
          ) : (
            /* Chat Messages */
            <>
              <div className="flex-1 overflow-y-auto">
                <div className="max-w-5xl mx-auto">
                  <Conversation>
                    <ConversationContent className="px-4 sm:px-6 lg:px-8 py-6">
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
                              {/* User Message */}
                              {message.role === "user" && (
                                <Message from={message.role}>
                                  <MessageContent>
                                    {textParts.map((part: any, index) => (
                                      <div key={index}>{part.text}</div>
                                    ))}
                                  </MessageContent>
                                </Message>
                              )}

                              {/* Assistant Response Section */}
                              {message.role === "assistant" && (
                                <>
                                  {/* Tool parts - Show first */}
                                  {toolParts.length > 0 && (
                                    <div className="space-y-2">
                                      {toolParts.map((part: any, i: number) => {
                                        const callId =
                                          part.toolCallId ||
                                          `${message.id}-tool-${i}`;
                                        return (
                                          <Fragment key={callId}>
                                            {renderToolPart(part, callId)}
                                          </Fragment>
                                        );
                                      })}
                                    </div>
                                  )}

                                  {/* Text message - Show after tools */}
                                  {textParts.length > 0 && (
                                    <Message from={message.role}>
                                      <MessageContent>
                                        {textParts.map((part: any, index) => (
                                          <Streamdown
                                            isAnimating={
                                              status === "streaming" &&
                                              isLastMessage
                                            }
                                            key={index}
                                          >
                                            {part.text}
                                          </Streamdown>
                                        ))}
                                      </MessageContent>
                                    </Message>
                                  )}

                                  {/* Toolbar - Show last */}
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
                                </>
                              )}
                            </Fragment>
                          );
                        })}

                        {/* Single Loader - Only show one at a time */}
                        {(status === "streaming" || isExporting) && (
                          <Message from="assistant">
                            <MessageContent>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Loader>
                                  {isExporting
                                    ? "Preparing download..."
                                    : "Thinking..."}
                                </Loader>
                              </div>
                            </MessageContent>
                          </Message>
                        )}
                      </div>
                    </ConversationContent>
                    <ConversationScrollButton />
                  </Conversation>
                </div>
              </div>

              {/* Sticky Input */}
              <div className="shrink-0">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                  <PromptInputProvider>
                    <PromptInput onSubmit={handleSubmit}>
                      <PromptInputBody>
                        <PromptInputTextarea
                          ref={textareaRef}
                          placeholder="Ask a follow-up question..."
                        />
                      </PromptInputBody>
                      <PromptInputFooter className="flex justify-end">
                        <PromptInputSubmit status={status} />
                      </PromptInputFooter>
                    </PromptInput>
                  </PromptInputProvider>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
      <ChatSessionSidebar />
    </SidebarProvider>
  );
}

export default ChatPage;