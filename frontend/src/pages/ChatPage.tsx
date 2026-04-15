import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import SmartChart from "@/pages/SmartChart";
import { ChatHistory } from "@/pages/ChatHistory";
import {
  Search,
  Send,
  Copy,
  Download,
  RefreshCw,
  MessageSquare,
  User,
  Bot,
  Clock,
  Database,
  FileText,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  Mic,
} from "lucide-react";
import { useApiClient, useWebSocketConnection } from "@/services/ApiService";
import Header from "../components/Header";

// Suggested questions that appear on page load
const SUGGESTED_QUESTIONS = [
  "Show me the total Documents Late Submitted by TSP in Aug 2025",
  "What is the trend (increase/decrease) of call failure rate for Jio over the years 2023–2025",
  "Find TSPs where documents submitted timely are less than documents submitted late in any year",
  "For each year, calculate the average customer satisfaction index across all TSPs",
];

// Voice Listening Animation Component
const VoiceListeningAnimation: React.FC<{ onClose: () => void }> = ({
  onClose,
}) => {
  return (
    <div
      className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl p-8 shadow-2xl max-w-sm w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col items-center gap-6">
          {/* Animated Mic Icon */}
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-[#1e3a8a] opacity-20 animate-ping" />
            <div
              className="relative p-6 rounded-full shadow-lg"
              style={{
                background: "rgb(30, 58, 138)",
              }}
            >
              <Mic className="h-12 w-12 text-white" />
            </div>
          </div>

          {/* Voice Wave Animation */}
          <div className="flex items-center justify-center gap-1.5 h-16">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="w-1.5 rounded-full voice-wave-bar"
                style={{
                  background: "linear-gradient(to top, #1e3a8a, #f44336a1)",
                  animationDelay: `${i * 0.1}s`,
                }}
              />
            ))}
          </div>

          {/* Text */}
          <div className="text-center">
            <h3 className="text-xl font-bold text-[#1e3a8a] mb-2">
              Listening...
            </h3>
            <p className="text-sm text-gray-600">Speak your question clearly</p>
          </div>

          {/* Tap to cancel hint */}
          <p className="text-xs text-gray-500 mt-2">Tap anywhere to cancel</p>
        </div>
      </div>

      <style>{`
        @keyframes voice-wave {
          0%, 100% { height: 16px; }
          50% { height: 48px; }
        }
        .voice-wave-bar {
          animation: voice-wave 1.2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

const SimpleChart = React.memo(
  ({ data, question }: { data: any[]; question?: string }) => {
    return <SmartChart data={data} question={question} />;
  },
  (prevProps, nextProps) => {
    return (
      JSON.stringify(prevProps.data) === JSON.stringify(nextProps.data) &&
      prevProps.question === nextProps.question
    );
  }
);

const ChatPage: React.FC = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<any[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { client, executeWithLoading } = useApiClient();
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Initialize speech recognition
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      ("webkitSpeechRecognition" in window || "SpeechRecognition" in window)
    ) {
      const SpeechRecognition =
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = "en-US";

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputValue((prev) => (prev ? `${prev} ${transcript}` : transcript));
        setIsListening(false);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, []);

  const toggleVoiceInput = () => {
    if (!recognitionRef.current) {
      console.warn("SpeechRecognition not supported in this browser");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    // Only scroll to bottom when there are messages
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages]);

  const handleSendMessage = async (questionText?: string, clearPrevious = false) => {
    const messageText = questionText || inputValue;
    if (!messageText.trim() || isLoading) return;

    // Clear previous messages if requested
    if (clearPrevious) {
      setMessages([]);
    }

    // Hide suggestions once user sends first message
    setShowSuggestions(false);

    const userMessage = {
      id: Date.now(),
      type: "user",
      content: messageText,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    const queryText = messageText;
    setInputValue("");

    await executeRestQuery(queryText);
  };

  const handleClearChat = () => {
    setMessages([]);
    setInputValue("");
    setShowSuggestions(true);
  };

  const handleSuggestionClick = (question: string) => {
    setInputValue(question);
    setShowSuggestions(false);
    handleSendMessage(question);
  };

  const executeRestQuery = async (question: string) => {
    const response = await executeWithLoading(() =>
      client.executeQuery({ question, include_explanation: true })
    );

    if (response) {
      const botMessage = {
        id: Date.now() + 1,
        type: "assistant",
        content:
          response.natural_language_response || "Query executed successfully",
        sql: response.sql_query,
        data: response.results || [],
        timestamp: new Date(),
        success: response.success,
        execution_time: response.execution_time,
      };
      setMessages((prev) => [...prev, botMessage]);
    } else {
      const errorMessage = {
        id: Date.now() + 1,
        type: "assistant",
        content: "Failed to execute query.",
        timestamp: new Date(),
        success: false,
      };
      setMessages((prev) => [...prev, errorMessage]);
    }
    setIsLoading(false);
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  const exportResults = (data: any[], format = "csv") => {
    if (!data || data.length === 0) return;

    if (format === "csv") {
      const headers = Object.keys(data[0] || {});
      const csvContent = [
        headers.join(","),
        ...data.map((row) =>
          headers.map((header) => `"${row[header] || ""}"`).join(",")
        ),
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `query_results_${new Date().getTime()}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    }
  };

  const DataTable = ({
    data,
    maxRows = 100,
  }: {
    data: any[];
    maxRows?: number;
  }) => {
    if (!data || data.length === 0) return null;

    const headers = Object.keys(data[0]);
    const displayRows = data.slice(0, maxRows);

    return (
      <div className="mt-4 rounded-lg overflow-hidden shadow-md">
        <div className="overflow-auto max-h-96">
          <table className="w-full text-sm border-collapse">
            <thead
              className="sticky top-0"
              style={{
                background: "rgb(30, 58, 138)",
              }}
            >
              <tr>
                {headers.map((header) => (
                  <th
                    key={header}
                    className="text-left px-4 py-3 font-semibold text-white border-r border-white/20 last:border-r-0 whitespace-nowrap"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white">
              {displayRows.map((row, idx) => (
                <tr
                  key={idx}
                  className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  {headers.map((header) => (
                    <td
                      key={header}
                      className="px-4 py-3 text-gray-700 border-r border-gray-200 last:border-r-0"
                    >
                      {String(row[header] || "")}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {data.length > maxRows && (
          <div className="px-4 py-3 text-center text-sm text-gray-700 bg-gray-50 border-t border-gray-200 font-medium">
            Showing {maxRows} of {data.length} results
            <Button
              variant="link"
              size="sm"
              onClick={() => exportResults(data)}
              className="ml-3 text-[#1e3a8a] hover:text-[#f44336] h-auto p-0 text-sm font-semibold underline"
            >
              Export All
            </Button>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <Header />

      {/* Voice Listening Animation Overlay */}
      {isListening && <VoiceListeningAnimation onClose={toggleVoiceInput} />}

      {/* BACKGROUND */}
      <div className="flex flex-col min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
        {/* CHAT MESSAGES */}
        <div className="flex-1 flex flex-col py-6">
          <div className="max-w-6xl mx-auto w-full px-6 py-4 space-y-6 mb-24">
            <div className="flex justify-end gap-2 mb-3">
              <Button
                size="sm"
                variant="outline"
                onClick={handleClearChat}
                disabled={isLoading && messages.length === 0}
              >
                Clear Chat
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => handleSendMessage(undefined, true)}
                disabled={!inputValue.trim() || isLoading}
              >
                Clear Previous & Send
              </Button>
            </div>
            {messages.length === 0 && (
              <div className="text-center py-12">
                <div
                  className="inline-flex p-6 rounded-3xl mb-6 shadow-2xl"
                  style={{
                    background:
                      "linear-gradient(135deg, rgb(30, 58, 138) 0%, rgba(244, 67, 54, 0.63) 100%)",
                  }}
                >
                  <MessageSquare className="h-16 w-16 text-white" />
                </div>

                <h3 className="text-3xl font-bold text-gray-800 mb-3">
                  Smart Data Assistance
                </h3>
                <p className="text-gray-600 mb-8 max-w-2xl mx-auto text-base">
                  Ask questions about your data in natural language and get
                  instant insights with powerful analytics
                </p>

                {/* Suggested Questions */}
                {/* {showSuggestions && (
                  <div className="space-y-3 max-w-4xl mx-auto">
                    <p className="text-sm font-semibold text-gray-700 mb-4">
                      Try asking:
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {SUGGESTED_QUESTIONS.map((question, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSuggestionClick(question)}
                          className="text-left p-4 bg-white hover:shadow-lg border border-gray-200 rounded-xl transition-all duration-200 group"
                        >
                          <div className="flex items-start gap-3">
                            <div
                              className="p-2 rounded-lg"
                              style={{
                                background:
                                  "rgb(30, 58, 138)",
                              }}
                            >
                              <MessageSquare className="h-4 w-4 text-white flex-shrink-0" />
                            </div>
                            <span className="text-sm text-gray-700 font-medium leading-relaxed flex-1">
                              {question}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )} */}
              </div>
            )}

            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-4 ${
                  msg.type === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {msg.type === "assistant" && (
                  <div
                    className="flex-shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg"
                    style={{
                      background:
                        "linear-gradient(135deg, rgb(30, 58, 138) 0%, rgba(244, 67, 54, 0.63) 100%)",
                    }}
                  >
                    <Bot className="h-6 w-6 text-white" />
                  </div>
                )}

                <div className="max-w-4xl">
                  <div
                    className={`rounded-2xl p-5 shadow-md ${
                      msg.type === "user"
                        ? "text-white"
                        : "bg-white border border-gray-200"
                    }`}
                    style={
                      msg.type === "user"
                        ? {
                            background: "rgb(30, 58, 138)",
                          }
                        : {}
                    }
                  >
                    <div className="whitespace-pre-wrap text-base leading-relaxed">
                      {msg.content}
                    </div>

                    {msg.sql && (
                      <div className="mt-4 bg-gradient-to-br from-gray-50 to-blue-50 rounded-xl p-4 border border-gray-200">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Database className="h-4 w-4 text-[#1e3a8a]" />
                            <span className="text-sm font-bold text-gray-800">
                              Generated SQL Query
                            </span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(msg.sql)}
                            className="hover:bg-white text-[#1e3a8a] h-8 w-8 p-0 rounded-lg"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>

                        <pre className="text-sm text-gray-800 whitespace-pre-wrap overflow-auto max-h-32 bg-white p-3 rounded-lg border border-gray-200 font-mono">
                          {msg.sql}
                        </pre>
                      </div>
                    )}

                    {msg.data &&
                      Array.isArray(msg.data) &&
                      msg.data.length > 0 && (
                        <div>
                          <DataTable data={msg.data} maxRows={50} />
                          <div className="mt-4">
                            <SmartChart
                              data={msg.data}
                              question={msg.content}
                            />
                          </div>
                        </div>
                      )}

                    {msg.execution_time && (
                      <div className="flex items-center gap-2 mt-4 text-sm text-gray-600 font-medium">
                        <Clock className="h-4 w-4" />
                        <span>
                          Executed in {msg.execution_time.toFixed(3)}s
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {msg.type === "user" && (
                  <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-900 to-red-500/70 flex items-center justify-center shadow-lg">
                    <User className="h-6 w-6 text-white" />
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-4 justify-start">
                <div
                  className="flex-shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg"
                  style={{
                    background: "rgb(30, 58, 138)",
                  }}
                >
                  <Bot className="h-6 w-6 text-white" />
                </div>
                <div className="bg-white rounded-2xl p-5 shadow-md border border-gray-200">
                  <div className="flex items-center gap-3">
                    <RefreshCw className="h-5 w-5 animate-spin text-[#1e3a8a]" />
                    <span className="text-base text-gray-700 font-medium">
                      Processing your query...
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* CHAT INPUT BAR */}
        <div className="fixed bottom-0 left-0 w-full z-50 bg-white border-t border-gray-200 shadow-2xl">
          <div className="max-w-6xl mx-auto px-6 py-4">
            <div className="flex items-center gap-3 bg-gray-50 rounded-2xl p-3 border-2 border-gray-200 focus-within:border-[#1e3a8a] transition-colors shadow-sm">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ask a question about your data..."
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                disabled={isLoading}
                className="flex-1 border-0 bg-transparent focus:ring-0 text-base placeholder:text-gray-400 text-gray-800 font-medium"
              />

              <button
                onClick={toggleVoiceInput}
                disabled={isLoading}
                className={`p-3 rounded-xl transition-all ${
                  isListening
                    ? "text-white shadow-lg"
                    : "text-gray-600 hover:text-[#1e3a8a] hover:bg-white"
                }`}
                style={
                  isListening
                    ? {
                        background: "rgb(30, 58, 138)",
                      }
                    : {}
                }
              >
                <Mic className="h-5 w-5" />
              </button>

              <Button
                onClick={() => handleSendMessage()}
                disabled={isLoading || !inputValue.trim()}
                className="text-white px-6 py-6 rounded-xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-xl transition-all"
                style={{
                  background: "rgb(30, 58, 138)",
                }}
              >
                <Send className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>

        <style>{`
          @keyframes voice-wave {
            0%, 100% { height: 16px; }
            50% { height: 48px; }
          }
          .voice-wave-bar {
            animation: voice-wave 1.2s ease-in-out infinite;
          }
        `}</style>
      </div>
    </>
  );
};

export default ChatPage;
