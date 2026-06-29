import { useState, useRef, useEffect } from "react";
import { MessageCircle, Phone, X, Send, Sparkles } from "lucide-react";
import api from "@/lib/api";

const WHATSAPP_URL = "https://wa.me/917619536831?text=" + encodeURIComponent("Hello HAKKIVEDA Team, I would like to know more about your products.");

const FloatingButtons = () => {
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: "assistant", text: "Namaste 🙏 I'm Vana, your HAKKIVEDA Ayurvedic concierge. How may I guide you today?" },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId] = useState(() => {
    let s = localStorage.getItem("hk_chat_session");
    if (!s) { s = "sess-" + Math.random().toString(36).slice(2); localStorage.setItem("hk_chat_session", s); }
    return s;
  });
  const scrollRef = useRef(null);

  useEffect(() => { scrollRef.current?.scrollTo({ top: 9e9, behavior: "smooth" }); }, [messages, chatOpen]);

  const send = async () => {
    const msg = input.trim();
    if (!msg || loading) return;
    setMessages((m) => [...m, { role: "user", text: msg }]);
    setInput("");
    setLoading(true);
    try {
      const res = await api.post("/chat", { session_id: sessionId, message: msg });
      setMessages((m) => [...m, { role: "assistant", text: res.data.reply }]);
    } catch {
      setMessages((m) => [...m, { role: "assistant", text: "Please WhatsApp us at +91 76195 36831 for assistance." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating chat panel */}
      {chatOpen && (
        <div data-testid="ai-chat-panel" className="fixed bottom-24 right-5 z-50 w-[92vw] max-w-sm bg-[#FAF8F3] rounded-2xl shadow-2xl border border-hk-green/15 flex flex-col overflow-hidden" style={{ height: "min(70vh, 540px)" }}>
          <div className="bg-hk-green text-[#FAF8F3] p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-hk-gold flex items-center justify-center text-[#222]"><Sparkles size={18} /></div>
              <div>
                <p className="font-serif text-lg leading-tight">Vana</p>
                <p className="text-[10px] tracking-widest uppercase opacity-80">Ayurvedic Concierge</p>
              </div>
            </div>
            <button onClick={() => setChatOpen(false)} data-testid="close-chat" aria-label="Close" className="p-1 hover:opacity-70"><X size={18} /></button>
          </div>
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${m.role === "user" ? "bg-hk-green text-[#FAF8F3] rounded-br-sm" : "bg-white border border-hk-green/10 text-hk-charcoal rounded-bl-sm"}`}>
                  {m.text}
                </div>
              </div>
            ))}
            {loading && <div className="flex"><div className="bg-white border border-hk-green/10 px-4 py-2.5 rounded-2xl text-sm italic text-hk-charcoal/60">Vana is typing…</div></div>}
          </div>
          <div className="p-3 border-t border-hk-green/10 bg-white flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder="Ask about products, ingredients…"
              data-testid="chat-input"
              className="flex-1 px-4 py-2.5 rounded-full bg-[#FAF8F3] border border-hk-green/15 text-sm focus:outline-none focus:border-hk-green"
            />
            <button onClick={send} disabled={loading} data-testid="chat-send" className="w-10 h-10 rounded-full bg-hk-green text-[#FAF8F3] flex items-center justify-center hover:bg-hk-gold hover:text-[#222] transition disabled:opacity-50"><Send size={16} /></button>
          </div>
        </div>
      )}

      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-3 items-end">
        <button
          onClick={() => setChatOpen(!chatOpen)}
          data-testid="ai-chat-btn"
          aria-label="AI Chat"
          className="w-14 h-14 rounded-full bg-hk-green text-[#FAF8F3] shadow-xl flex items-center justify-center hover:bg-hk-gold hover:text-[#222] transition group"
        >
          <Sparkles size={22} />
          <span className="absolute right-16 bg-hk-charcoal text-[#FAF8F3] text-[10px] tracking-widest uppercase px-3 py-1.5 rounded-full opacity-0 group-hover:opacity-100 transition whitespace-nowrap pointer-events-none">Ask Vana AI</span>
        </button>
        <a
          href={WHATSAPP_URL}
          target="_blank"
          rel="noopener noreferrer"
          data-testid="whatsapp-btn"
          aria-label="WhatsApp"
          className="w-14 h-14 rounded-full bg-[#25D366] text-white shadow-xl flex items-center justify-center hover:scale-110 transition"
        >
          <MessageCircle size={22} />
        </a>
        <a
          href="tel:+917619536831"
          data-testid="call-btn"
          aria-label="Call"
          className="w-14 h-14 rounded-full bg-hk-gold text-[#222] shadow-xl flex items-center justify-center hover:scale-110 transition"
        >
          <Phone size={20} />
        </a>
      </div>
    </>
  );
};

export default FloatingButtons;
