"use client";

import { useState, useEffect, useRef } from "react";
import { 
  MessageSquare, 
  Send, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Database, 
  Video, 
  Bot, 
  User, 
  ExternalLink,
  ChevronRight,
  Trash2,
  Zap,
  Radio,
  BookOpen,
  HelpCircle
} from "lucide-react";

function YoutubeIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
    </svg>
  );
}

interface IngestResult {
  status: string;
  video_id: string;
  title: string;
  channel: string;
  chunks_count: number;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

const BACKEND_URL = "http://localhost:8000";

// Simple Markdown Formatter Component for Chat Bubbles
function FormattedMessage({ content }: { content: string }) {
  // Parse lines for bullet points, bolding, etc.
  const lines = content.split("\n");
  
  return (
    <div className="space-y-2 text-sm leading-relaxed">
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={idx} className="h-1" />;

        // Bullet point item
        if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
          const bulletText = trimmed.substring(2);
          return (
            <div key={idx} className="flex items-start gap-2.5 ml-1 my-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-2 shrink-0"></span>
              <span>{renderBoldText(bulletText)}</span>
            </div>
          );
        }

        // Numbered list item
        const numMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
        if (numMatch) {
          return (
            <div key={idx} className="flex items-start gap-2.5 ml-1 my-1">
              <span className="font-bold text-amber-400 text-xs mt-0.5">{numMatch[1]}.</span>
              <span>{renderBoldText(numMatch[2])}</span>
            </div>
          );
        }

        // Regular paragraph
        return <p key={idx}>{renderBoldText(line)}</p>;
      })}
    </div>
  );
}

// Helper to replace **bold** with <strong> tags
function renderBoldText(text: string) {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-semibold text-emerald-300">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<"ingest" | "chat">("ingest");
  
  // Backend Status
  const [backendStatus, setBackendStatus] = useState<"online" | "offline" | "checking">("checking");
  
  // Ingest State
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [isIngesting, setIsIngesting] = useState(false);
  const [ingestResult, setIngestResult] = useState<IngestResult | null>(null);
  const [ingestError, setIngestError] = useState<string | null>(null);
  const [ingestedHistory, setIngestedHistory] = useState<IngestResult[]>([]);

  // Chat State
  const [sessionId] = useState(() => `session_${Math.random().toString(36).substring(2, 9)}`);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Hello! Welcome to YouTube RAG Intelligence.\n- Once you ingest a video, ask me any questions about its content.\n- I will remember our chat history and answer follow-up questions accurately.",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputQuery, setInputQuery] = useState("");
  const [isChatting, setIsChatting] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Check Backend Health
  const checkBackendHealth = async () => {
    setBackendStatus("checking");
    try {
      const res = await fetch(`${BACKEND_URL}/`);
      if (res.ok) {
        setBackendStatus("online");
      } else {
        setBackendStatus("offline");
      }
    } catch {
      setBackendStatus("offline");
    }
  };

  useEffect(() => {
    checkBackendHealth();
  }, []);

  // Auto-scroll chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isChatting]);

  // Handle Ingest
  const handleIngest = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!youtubeUrl.trim()) return;

    setIsIngesting(true);
    setIngestError(null);
    setIngestResult(null);

    try {
      const response = await fetch(`${BACKEND_URL}/api/ingest`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: youtubeUrl.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || data.message || "Failed to process video");
      }

      setIngestResult(data);
      setIngestedHistory((prev) => [data, ...prev.filter(item => item.video_id !== data.video_id)]);
      setYoutubeUrl("");
    } catch (err: any) {
      setIngestError(err.message || "An unexpected error occurred during ingestion.");
    } finally {
      setIsIngesting(false);
    }
  };

  // Handle Chat
  const handleSendMessage = async (e?: React.FormEvent, customQuery?: string) => {
    if (e) e.preventDefault();
    const queryToSend = customQuery || inputQuery;
    if (!queryToSend.trim() || isChatting) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: queryToSend.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!customQuery) setInputQuery("");
    setIsChatting(true);
    setChatError(null);

    try {
      const response = await fetch(`${BACKEND_URL}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: userMsg.content,
          session_id: sessionId
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || data.message || "Failed to fetch response from model");
      }

      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.response || "No response content received.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err: any) {
      setChatError(err.message || "Error connecting to AI chat service.");
    } finally {
      setIsChatting(false);
    }
  };

  const samplePrompts = [
    "What models or techniques are mentioned in the video?",
    "Summarize the main goals and dataset used in this video",
    "Explain the results or conclusion of the comparative study"
  ];

  return (
    <div className="flex flex-col min-h-screen bg-[#0a0f11] text-gray-100 font-sans selection:bg-emerald-500 selection:text-black">
      
      {/* HEADER */}
      <header className="sticky top-0 z-50 border-b border-[#1b262a] bg-[#0c1214]/90 backdrop-blur-md px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-950/60">
            <YoutubeIcon className="w-5 h-5 text-black stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-lg text-white tracking-wide">YT RAG Pipeline</h1>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-800/50">
                v1.1
              </span>
            </div>
            <p className="text-xs text-gray-400">YouTube Video Knowledge Extraction & Vector QA</p>
          </div>
        </div>

        {/* Backend Status Badge */}
        <div className="flex items-center gap-3">
          <button 
            onClick={checkBackendHealth}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#141d20] border border-[#233339] text-xs text-gray-300 hover:text-white hover:border-emerald-600/50 transition-all cursor-pointer"
            title="Click to re-check API status"
          >
            <Radio className={`w-3.5 h-3.5 ${backendStatus === 'online' ? 'text-emerald-400 animate-pulse' : backendStatus === 'checking' ? 'text-amber-400 animate-spin' : 'text-rose-500'}`} />
            <span className="font-medium capitalize">
              API: {backendStatus}
            </span>
            <RefreshCw className="w-3 h-3 text-gray-500 hover:text-gray-300" />
          </button>
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col gap-6">
        
        {/* TAB NAVIGATION */}
        <div className="flex bg-[#141d20] p-1.5 rounded-xl border border-[#233339] self-center sm:self-start shadow-inner">
          <button
            onClick={() => setActiveTab("ingest")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
              activeTab === "ingest"
                ? "bg-gradient-to-r from-emerald-600 to-emerald-700 text-white shadow-md shadow-emerald-950/50"
                : "text-gray-400 hover:text-gray-200 hover:bg-[#1a272b]"
            }`}
          >
            <Database className="w-4 h-4" />
            <span>1. Ingest Video</span>
          </button>

          <button
            onClick={() => setActiveTab("chat")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
              activeTab === "chat"
                ? "bg-gradient-to-r from-emerald-600 to-emerald-700 text-white shadow-md shadow-emerald-950/50"
                : "text-gray-400 hover:text-gray-200 hover:bg-[#1a272b]"
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>2. Ask & Chat</span>
            {ingestedHistory.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
            )}
          </button>
        </div>

        {/* TAB 1: INGESTION SECTION */}
        {activeTab === "ingest" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Input Form Column */}
            <div className="lg:col-span-7 flex flex-col gap-6">
              
              <div className="glass-panel p-6 rounded-2xl flex flex-col gap-5 border border-[#233339]">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-emerald-950/80 border border-emerald-800/40 text-emerald-400">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="font-bold text-gray-100 text-base">Add YouTube Video</h2>
                    <p className="text-xs text-gray-400">Extract transcript, chunk with overlap & store in ChromaDB</p>
                  </div>
                </div>

                <form onSubmit={handleIngest} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-semibold text-gray-300">YouTube Video URL</label>
                    <div className="relative flex items-center">
                      <div className="absolute left-3.5 text-gray-500">
                        <YoutubeIcon className="w-5 h-5 text-rose-500/80" />
                      </div>
                      <input
                        type="url"
                        value={youtubeUrl}
                        onChange={(e) => setYoutubeUrl(e.target.value)}
                        placeholder="https://www.youtube.com/watch?v=..."
                        required
                        className="w-full pl-11 pr-4 py-3 bg-[#11191c] border border-[#27373e] rounded-xl text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isIngesting || !youtubeUrl.trim()}
                    className="w-full py-3.5 px-6 bg-gradient-to-r from-emerald-500 via-emerald-600 to-emerald-700 hover:from-emerald-400 hover:to-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-black font-bold rounded-xl shadow-lg shadow-emerald-950/50 flex items-center justify-center gap-2.5 transition-all text-sm uppercase tracking-wide cursor-pointer"
                  >
                    {isIngesting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin text-black" />
                        <span>Processing & Embedding Video...</span>
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4 text-black fill-black" />
                        <span>Process Video</span>
                      </>
                    )}
                  </button>
                </form>

                {/* Progress Info box during ingestion */}
                {isIngesting && (
                  <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-800/40 text-xs text-amber-300 flex items-center gap-3 animate-pulse">
                    <RefreshCw className="w-4 h-4 animate-spin shrink-0 text-amber-400" />
                    <span>Downloading audio, transcribing via ASR & embedding into ChromaDB...</span>
                  </div>
                )}

                {/* Error Banner */}
                {ingestError && (
                  <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/60 text-xs text-rose-300 flex items-start gap-3">
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-semibold text-rose-200">Ingestion Failed</p>
                      <p className="mt-1 text-rose-300/90 leading-relaxed">{ingestError}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Latest Result Card */}
              {ingestResult && (
                <div className="glass-panel p-6 rounded-2xl border border-emerald-800/50 bg-gradient-to-b from-emerald-950/20 to-[#101719] flex flex-col gap-4">
                  <div className="flex items-center justify-between border-b border-emerald-900/40 pb-3">
                    <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Ingestion Successful</span>
                    </div>
                    <button
                      onClick={() => setActiveTab("chat")}
                      className="text-xs bg-emerald-500 hover:bg-emerald-400 text-black font-bold px-3.5 py-1.5 rounded-lg flex items-center gap-1 transition-all cursor-pointer shadow-sm"
                    >
                      <span>Start Chat</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div className="p-3 rounded-lg bg-[#141d20] border border-[#233339]">
                      <span className="text-gray-400">Video Title</span>
                      <p className="font-semibold text-gray-100 mt-1 line-clamp-2">{ingestResult.title}</p>
                    </div>

                    <div className="p-3 rounded-lg bg-[#141d20] border border-[#233339]">
                      <span className="text-gray-400">Channel</span>
                      <p className="font-semibold text-gray-100 mt-1">{ingestResult.channel || "Unknown"}</p>
                    </div>

                    <div className="p-3 rounded-lg bg-[#141d20] border border-[#233339]">
                      <span className="text-gray-400">Video ID</span>
                      <p className="font-mono font-semibold text-amber-400 mt-1">{ingestResult.video_id}</p>
                    </div>

                    <div className="p-3 rounded-lg bg-[#141d20] border border-[#233339]">
                      <span className="text-gray-400">Text Chunks Stored</span>
                      <p className="font-semibold text-emerald-400 mt-1 text-sm">{ingestResult.chunks_count} Chunks (1000 chars)</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Ingested Videos History Sidebar */}
            <div className="lg:col-span-5 flex flex-col gap-4">
              <div className="glass-panel p-5 rounded-2xl border border-[#233339] flex flex-col gap-4 min-h-[350px]">
                <div className="flex items-center justify-between border-b border-[#233339] pb-3">
                  <div className="flex items-center gap-2">
                    <Video className="w-4 h-4 text-amber-400" />
                    <h3 className="font-semibold text-sm text-gray-200">Ingested Videos</h3>
                  </div>
                  <span className="text-xs bg-[#1a272b] px-2.5 py-0.5 rounded-full text-gray-400 border border-[#2c3f46]">
                    {ingestedHistory.length} Total
                  </span>
                </div>

                {ingestedHistory.length === 0 ? (
                  <div className="flex flex-col items-center justify-center flex-1 p-6 text-center text-gray-500 gap-3">
                    <Database className="w-8 h-8 text-gray-600 stroke-[1.5]" />
                    <p className="text-xs">No videos ingested yet in this session.</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3 max-h-[400px] overflow-y-auto pr-1">
                    {ingestedHistory.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-xl bg-[#131b1e] border border-[#223136] hover:border-emerald-600/40 transition-all flex flex-col gap-2"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-medium text-xs text-gray-200 line-clamp-1">{item.title}</p>
                          <a
                            href={`https://youtube.com/watch?v=${item.video_id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-gray-500 hover:text-emerald-400 transition-colors"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-gray-400">
                          <span>{item.channel}</span>
                          <span className="text-emerald-400 font-medium">{item.chunks_count} chunks</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

          </div>
        )}

        {/* TAB 2: RAG CHAT SECTION */}
        {activeTab === "chat" && (
          <div className="glass-panel p-4 sm:p-6 rounded-2xl border border-[#233339] flex flex-col h-[750px] shadow-2xl">
            
            {/* Chat Header */}
            <div className="flex items-center justify-between border-b border-[#233339] pb-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-950 border border-emerald-800/50 text-emerald-400 shadow-sm">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-bold text-sm text-white flex items-center gap-2">
                    <span>Vector Knowledge Assistant</span>
                    <span className="text-[10px] bg-emerald-950 text-emerald-400 px-2 py-0.5 rounded border border-emerald-800/40">k=5 Similarity</span>
                  </h2>
                  <p className="text-xs text-gray-400">Search ChromaDB vectors & answer questions with Llama 3.3 70B</p>
                </div>
              </div>

              {messages.length > 1 && (
                <button
                  onClick={() => setMessages([messages[0]])}
                  className="flex items-center gap-1.5 text-xs text-gray-300 hover:text-rose-400 px-3 py-1.5 rounded-lg bg-[#162024] border border-[#26353b] hover:border-rose-900/50 transition-all cursor-pointer"
                  title="Clear conversation"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear Chat</span>
                </button>
              )}
            </div>

            {/* Chat Message Stream */}
            <div className="flex-1 overflow-y-auto pr-2 flex flex-col gap-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-3 max-w-[88%] ${
                    msg.role === "user" ? "self-end flex-row-reverse" : "self-start"
                  }`}
                >
                  {/* Avatar */}
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 ${
                      msg.role === "user"
                        ? "bg-amber-400 text-black shadow-md shadow-amber-950/40"
                        : "bg-emerald-500 text-black shadow-md shadow-emerald-950/40"
                    }`}
                  >
                    {msg.role === "user" ? <User className="w-4 h-4 stroke-[2.5]" /> : <Bot className="w-4 h-4 stroke-[2.5]" />}
                  </div>

                  {/* Message Bubble */}
                  <div
                    className={`p-4 rounded-2xl shadow-sm ${
                      msg.role === "user"
                        ? "bg-amber-400 text-gray-950 font-medium rounded-tr-none border border-amber-300"
                        : "bg-[#131b1e] border border-[#24343a] text-gray-100 rounded-tl-none"
                    }`}
                  >
                    {msg.role === "user" ? (
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                    ) : (
                      <FormattedMessage content={msg.content} />
                    )}

                    <span className={`block text-[10px] mt-2 text-right ${
                      msg.role === "user" ? "text-gray-900/70 font-semibold" : "text-gray-500"
                    }`}>
                      {msg.timestamp}
                    </span>
                  </div>
                </div>
              ))}

              {/* Typing indicator */}
              {isChatting && (
                <div className="flex gap-3 max-w-[80%] self-start animate-pulse">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500 text-black flex items-center justify-center shrink-0">
                    <Bot className="w-4 h-4 stroke-[2.5]" />
                  </div>
                  <div className="p-4 rounded-2xl bg-[#131b1e] border border-[#24343a] text-emerald-400 text-xs flex items-center gap-2.5">
                    <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
                    <span>Retrieving context & generating answer...</span>
                  </div>
                </div>
              )}

              {/* Chat Error */}
              {chatError && (
                <div className="p-3.5 rounded-xl bg-rose-950/50 border border-rose-800/60 text-xs text-rose-300 flex items-center gap-2 self-center my-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{chatError}</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick Sample Prompts */}
            {messages.length <= 2 && !isChatting && (
              <div className="flex flex-wrap gap-2 pt-3 border-t border-[#1d292d]">
                <span className="w-full text-xs text-gray-400 mb-1 flex items-center gap-1.5">
                  <HelpCircle className="w-3.5 h-3.5 text-emerald-400" /> Suggested questions:
                </span>
                {samplePrompts.map((prompt, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(undefined, prompt)}
                    className="text-xs bg-[#131b1e] hover:bg-emerald-950/60 border border-[#24343a] hover:border-emerald-700/50 text-gray-300 hover:text-emerald-300 px-3 py-1.5 rounded-lg transition-all text-left cursor-pointer"
                  >
                    💡 {prompt}
                  </button>
                ))}
              </div>
            )}

            {/* Input Form */}
            <form onSubmit={handleSendMessage} className="mt-4 pt-3 border-t border-[#1d292d] flex items-center gap-2.5">
              <input
                type="text"
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                placeholder="Ask a question about the ingested video..."
                disabled={isChatting}
                className="flex-1 bg-[#101719] border border-[#27383e] rounded-xl px-4.5 py-3.5 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={isChatting || !inputQuery.trim()}
                className="p-3.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-black font-bold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-emerald-950/50 transition-all cursor-pointer"
              >
                <Send className="w-5 h-5 stroke-[2.5]" />
              </button>
            </form>

          </div>
        )}

      </main>

      {/* FOOTER */}
      <footer className="border-t border-[#1a2428] py-4 text-center text-xs text-gray-500 mt-auto">
        <p>YT RAG Pipeline • Powered by LangChain, ChromaDB & Groq Llama 3.3</p>
      </footer>
    </div>
  );
}
