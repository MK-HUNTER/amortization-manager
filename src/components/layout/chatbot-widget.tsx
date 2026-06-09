import { useState, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare,
  X,
  Send,
  Sparkles,
  RefreshCw,
  PlusCircle,
  TrendingUp,
  HelpCircle,
  Check,
} from "lucide-react";
import { queryOptions, useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useRouter } from "@tanstack/react-router";
import { toast } from "sonner";

import { listLoans, createLoan, updateLoan } from "@/lib/loans/loans.functions";
import { processMessage, type BotResponse } from "@/lib/chatbot/nlp";
import { currency, percent } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { LoanRow } from "@/lib/loans/schema";

const loansQuery = queryOptions({
  queryKey: ["loans"],
  queryFn: () => listLoans(),
});

interface ChatMessage {
  id: string;
  sender: "user" | "bot";
  text: string;
  timestamp: Date;
  intent?: BotResponse["intent"];
  data?: any;
  actionExecuted?: boolean;
}

export function ChatBotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      sender: "bot",
      text: "Hi there! I am the **Amortix Assistant**, your conversational loan analyst. Ask me about EMI formulas, interest savings, or command me to create or update loan parameters directly!\n\nTry typing: *'How do extra payments save money?'*",
      timestamp: new Date(),
      intent: "conversational",
    },
  ]);
  const [inputVal, setInputVal] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const qc = useQueryClient();

  const createFn = useServerFn(createLoan);
  const updateFn = useServerFn(updateLoan);

  // Fetch loans to use in NLP matching
  const { data: loansData } = useSuspenseQuery(loansQuery);
  const loans = (loansData.loans ?? []) as LoanRow[];

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSend = (textToSend: string) => {
    const text = textToSend.trim();
    if (!text) return;

    const userMsg: ChatMessage = {
      id: Math.random().toString(),
      sender: "user",
      text,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputVal("");

    // Process using our client-side NLP engine
    setTimeout(() => {
      const response = processMessage(text, loans);
      const botMsg: ChatMessage = {
        id: Math.random().toString(),
        sender: "bot",
        text: response.message,
        timestamp: new Date(),
        intent: response.intent,
        data: response.data,
      };
      setMessages((prev) => [...prev, botMsg]);
    }, 400);
  };

  const [executingMessageId, setExecutingMessageId] = useState<string | null>(null);

  const handleConfirmAdd = async (msgId: string, data: any) => {
    try {
      setExecutingMessageId(msgId);
      const res = await createFn({ data });
      
      // Update message state so button disables
      setMessages((prev) =>
        prev.map((m) => (m.id === msgId ? { ...m, actionExecuted: true } : m))
      );

      // Trigger standard invalidated refetches
      await qc.invalidateQueries({ queryKey: ["loans"] });
      router.invalidate();

      toast.success(`Successfully registered new loan from ${data.bank_name}!`);

      // Add success response from bot
      setMessages((prev) => [
        ...prev,
        {
          id: Math.random().toString(),
          sender: "bot",
          text: `Awesome! I've created the loan record for **${data.bank_name}** with borrowed amount **${currency(data.borrowed_amount)}** at **${percent(data.interest_rate)}** for **${data.tenure_months} months**. You can drill into it in the loans registry registry.`,
          timestamp: new Date(),
          intent: "conversational",
        },
      ]);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setExecutingMessageId(null);
    }
  };

  const handleConfirmModify = async (msgId: string, data: any) => {
    try {
      setExecutingMessageId(msgId);
      
      const patchPayload: any = {};
      if (data.borrowed_amount !== undefined) patchPayload.borrowed_amount = Number(data.borrowed_amount);
      if (data.interest_rate !== undefined) patchPayload.interest_rate = Number(data.interest_rate);
      if (data.tenure_months !== undefined) patchPayload.tenure_months = Number(data.tenure_months);
      if (data.extra_payment !== undefined) patchPayload.extra_payment = Number(data.extra_payment);

      await updateFn({
        data: {
          id: data.loanId,
          patch: patchPayload,
        },
      });

      // Update message state so button disables
      setMessages((prev) =>
        prev.map((m) => (m.id === msgId ? { ...m, actionExecuted: true } : m))
      );

      await qc.invalidateQueries({ queryKey: ["loans"] });
      await qc.invalidateQueries({ queryKey: ["loan", data.loanId] });
      router.invalidate();

      toast.success(`Successfully updated parameters for ${data.bank_name}!`);

      // Add success response from bot
      setMessages((prev) => [
        ...prev,
        {
          id: Math.random().toString(),
          sender: "bot",
          text: `Success! I have committed the new parameters for **${data.bank_name}** (#${data.loan_number}) to the database. The amortization schedules are updated.`,
          timestamp: new Date(),
          intent: "conversational",
        },
      ]);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setExecutingMessageId(null);
    }
  };

  // Helper markdown parser
  const renderMessageText = (content: string) => {
    const lines = content.split("\n");
    return lines.map((line, idx) => {
      let clean = line.trim();
      if (clean.startsWith("### ")) {
        return (
          <h4 key={idx} className="text-sm font-bold mt-3 mb-1 text-primary">
            {clean.slice(4)}
          </h4>
        );
      }
      if (clean.startsWith("* ") || clean.startsWith("- ")) {
        return (
          <li key={idx} className="ml-4 list-disc text-xs text-foreground/90 my-0.5">
            {parseBold(clean.slice(2))}
          </li>
        );
      }
      if (clean === "") {
        return <div key={idx} className="h-2" />;
      }
      return (
        <p key={idx} className="text-xs leading-relaxed text-foreground/90 my-1">
          {parseBold(line)}
        </p>
      );
    });
  };

  const parseBold = (text: string) => {
    const parts = text.split(/\*\*([^*]+)\*\*/g);
    return parts.map((part, index) => {
      if (index % 2 === 1) {
        return (
          <strong key={index} className="font-bold text-foreground">
            {part}
          </strong>
        );
      }
      return part;
    });
  };

  const suggestions = [
    "EMI calculation formula",
    "Reducing vs flat interest",
    "Add Chase loan of 300k",
  ];

  return (
    <>
      {/* Floating Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-primary shadow-glow hover:scale-105 active:scale-95 transition-transform text-white cursor-pointer"
        title="Open Assistant"
      >
        {isOpen ? <X className="h-6 w-6" /> : <MessageSquare className="h-6 w-6" />}
      </button>

      {/* Floating Chat Drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 350, damping: 25 }}
            className="fixed bottom-24 right-6 z-50 h-[520px] w-[380px] max-w-[calc(100vw-32px)] glass-card flex flex-col rounded-3xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex h-16 shrink-0 items-center justify-between bg-sidebar px-4 text-sidebar-foreground">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-primary text-white shadow-glow">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-sm font-bold">Amortix Assistant</div>
                  <div className="text-[10px] text-sidebar-foreground/60">
                    Conversational Loan Manager
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-lg p-1.5 text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-white transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Message Feed */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
              {messages.map((m) => {
                const isBot = m.sender === "bot";
                return (
                  <div
                    key={m.id}
                    className={cn("flex flex-col max-w-[85%]", isBot ? "self-start" : "self-end ml-auto")}
                  >
                    {/* Message text bubble */}
                    <div
                      className={cn(
                        "rounded-2xl px-4 py-3 text-xs leading-normal",
                        isBot
                          ? "bg-accent/40 text-foreground border border-border/40"
                          : "bg-gradient-primary text-white ml-auto"
                      )}
                    >
                      {isBot ? renderMessageText(m.text) : <p>{m.text}</p>}

                      {/* Render Draft confirmation cards if applicable */}
                      {isBot && m.intent === "add_loan" && m.data && (
                        <div className="mt-3 rounded-xl border border-border/80 bg-background/80 p-3 text-foreground space-y-2">
                          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                            <PlusCircle className="h-3.5 w-3.5 text-primary" /> Proposed Loan Draft
                          </div>
                          <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-xs">
                            <div>Lender:</div>
                            <div className="font-semibold">{m.data.bank_name}</div>
                            <div>Principal:</div>
                            <div className="font-semibold">{currency(m.data.borrowed_amount)}</div>
                            <div>Rate:</div>
                            <div className="font-semibold">{percent(m.data.interest_rate)}</div>
                            <div>Tenure:</div>
                            <div className="font-semibold">{m.data.tenure_months} months</div>
                          </div>
                          <button
                            disabled={m.actionExecuted || executingMessageId === m.id}
                            onClick={() => handleConfirmAdd(m.id, m.data)}
                            className={cn(
                              "w-full h-8 flex items-center justify-center gap-1.5 rounded-lg text-xs font-semibold text-white transition-all cursor-pointer",
                              m.actionExecuted
                                ? "bg-success/20 text-success cursor-default"
                                : executingMessageId === m.id
                                ? "bg-muted text-muted-foreground cursor-wait"
                                : "bg-gradient-primary hover:shadow-glow"
                            )}
                          >
                            {m.actionExecuted ? (
                              <>
                                <Check className="h-3.5 w-3.5" /> Added to DB
                              </>
                            ) : executingMessageId === m.id ? (
                              <RefreshCw className="h-3 w-3 animate-spin" />
                            ) : (
                              "Confirm & Create Loan"
                            )}
                          </button>
                        </div>
                      )}

                      {isBot && m.intent === "modify_loan" && m.data && (
                        <div className="mt-3 rounded-xl border border-border/80 bg-background/80 p-3 text-foreground space-y-2">
                          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                            <TrendingUp className="h-3.5 w-3.5 text-primary" /> Proposed Modification
                          </div>
                          <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-xs">
                            <div>Target Loan:</div>
                            <div className="font-semibold">
                              {m.data.bank_name} (#{m.data.loan_number})
                            </div>
                            {m.data.borrowed_amount !== undefined && (
                              <>
                                <div>New Principal:</div>
                                <div className="font-semibold">
                                  {currency(m.data.borrowed_amount)}
                                </div>
                              </>
                            )}
                            {m.data.interest_rate !== undefined && (
                              <>
                                <div>New Rate:</div>
                                <div className="font-semibold">{percent(m.data.interest_rate)}</div>
                              </>
                            )}
                            {m.data.tenure_months !== undefined && (
                              <>
                                <div>New Tenure:</div>
                                <div className="font-semibold">
                                  {m.data.tenure_months} months
                                </div>
                              </>
                            )}
                            {m.data.extra_payment !== undefined && (
                              <>
                                <div>New Extra Pay:</div>
                                <div className="font-semibold">
                                  {currency(m.data.extra_payment)}
                                </div>
                              </>
                            )}
                          </div>
                          <button
                            disabled={m.actionExecuted || executingMessageId === m.id}
                            onClick={() => handleConfirmModify(m.id, m.data)}
                            className={cn(
                              "w-full h-8 flex items-center justify-center gap-1.5 rounded-lg text-xs font-semibold text-white transition-all cursor-pointer",
                              m.actionExecuted
                                ? "bg-success/20 text-success cursor-default"
                                : executingMessageId === m.id
                                ? "bg-muted text-muted-foreground cursor-wait"
                                : "bg-gradient-primary hover:shadow-glow"
                            )}
                          >
                            {m.actionExecuted ? (
                              <>
                                <Check className="h-3.5 w-3.5" /> Updated in DB
                              </>
                            ) : executingMessageId === m.id ? (
                              <RefreshCw className="h-3 w-3 animate-spin" />
                            ) : (
                              "Confirm & Update Loan"
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                    {/* Timestamp */}
                    <span className="text-[9px] text-muted-foreground mt-1 px-1">
                      {m.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input & Suggestions Footer */}
            <div className="shrink-0 border-t border-border bg-card/60 p-3 space-y-2.5">
              {/* suggestion pills */}
              <div className="flex flex-wrap gap-1.5">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    onClick={() => handleSend(s)}
                    className="inline-flex items-center gap-1 rounded-full border border-border/80 bg-background/50 px-2.5 py-1 text-[10px] text-muted-foreground hover:text-foreground hover:bg-accent transition-colors cursor-pointer"
                  >
                    <HelpCircle className="h-3 w-3 text-primary" />
                    {s}
                  </button>
                ))}
              </div>

              {/* Form Input */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend(inputVal);
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  value={inputVal}
                  onChange={(e) => setInputVal(e.target.value)}
                  placeholder="Ask a question or enter a command..."
                  className="h-10 flex-1 rounded-xl border border-input bg-background/50 px-3 text-xs placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30 transition-all"
                />
                <button
                  type="submit"
                  disabled={!inputVal.trim()}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-primary text-white shadow-card disabled:opacity-40 transition-transform active:scale-95 disabled:active:scale-100 cursor-pointer"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
