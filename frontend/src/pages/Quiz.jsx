import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "@/lib/api";
import { ArrowRight, Sparkles, Loader2 } from "lucide-react";
import { resolveImage } from "@/lib/image";
import { useCart } from "@/lib/CartContext";

const HAIR_QUIZ = [
  { id: "concern", q: "What is your primary hair concern?", opts: ["Hair fall", "Dandruff", "Premature greying", "Slow growth", "Dryness & frizz", "Beard growth"] },
  { id: "type", q: "Your hair type?", opts: ["Oily", "Dry", "Normal", "Combination", "Coloured/Treated"] },
  { id: "scalp", q: "How is your scalp?", opts: ["Itchy & flaky", "Oily", "Sensitive", "Healthy"] },
  { id: "frequency", q: "How often do you wash your hair?", opts: ["Daily", "Alternate days", "2x a week", "Weekly"] },
  { id: "goal", q: "Your goal for the next 3 months?", opts: ["Thicker hair", "Less hair fall", "Healthier scalp", "Faster growth", "Natural shine"] },
];

const SKIN_QUIZ = [
  { id: "concern", q: "What is your primary skin concern?", opts: ["Tan & pigmentation", "Acne marks", "Dullness", "Dark spots", "Uneven tone", "Aging"] },
  { id: "type", q: "Your skin type?", opts: ["Oily", "Dry", "Combination", "Sensitive", "Normal"] },
  { id: "exposure", q: "How much sun exposure?", opts: ["High (outdoor)", "Moderate", "Minimal (indoor)"] },
  { id: "routine", q: "Current routine?", opts: ["Basic (face wash only)", "Moderate (3 products)", "Advanced (multi-step)"] },
  { id: "goal", q: "Your dream skin in 3 months?", opts: ["Even tone", "Glow & radiance", "Clear & blemish-free", "Hydrated", "Brighter"] },
];

const Quiz = () => {
  const { type } = useParams();
  const questions = type === "skin" ? SKIN_QUIZ : HAIR_QUIZ;
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const { addToCart } = useCart();

  const select = async (val) => {
    const next = { ...answers, [questions[step].id]: val };
    setAnswers(next);
    if (step < questions.length - 1) {
      setStep(step + 1);
    } else {
      setLoading(true);
      try {
        const res = await api.post("/quiz/submit", { quiz_type: type, answers: next });
        setResult(res.data);
      } catch {
        setResult({ analysis: "Please try again or contact us via WhatsApp.", recommendations: [] });
      }
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center" data-testid="quiz-loading">
        <Loader2 className="animate-spin text-hk-green mb-4" size={42}/>
        <p className="font-serif text-2xl">Consulting our Ayurvedic AI…</p>
        <p className="text-hk-charcoal/55 mt-2">Crafting your personalised ritual</p>
      </div>
    );
  }

  if (result) {
    return (
      <div className="max-w-3xl mx-auto px-5 py-14" data-testid="quiz-result">
        <p className="overline mb-3">Your Personalised Result</p>
        <h1 className="font-serif text-4xl md:text-5xl mb-6">Your Ayurvedic Profile</h1>
        <div className="bg-white rounded-2xl p-7 border border-hk-gold/30 mb-8">
          <Sparkles className="text-hk-gold mb-3" size={24}/>
          <p className="font-serif italic text-xl leading-relaxed text-hk-charcoal">{result.analysis}</p>
          {result.concerns?.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-2">
              {result.concerns.map((c, i) => <span key={i} className="text-xs px-3 py-1.5 bg-hk-ivory-warm rounded-full uppercase tracking-widest text-hk-olive">{c}</span>)}
            </div>
          )}
        </div>
        <h2 className="font-serif text-3xl mb-5">Recommended for you</h2>
        <div className="space-y-4">
          {result.recommendations?.map((p) => (
            <div key={p.id} className="bg-white rounded-2xl p-5 border border-hk-green/10 flex gap-5" data-testid={`rec-${p.slug}`}>
              <Link to={`/product/${p.slug}`} className="w-24 h-28 rounded-lg overflow-hidden bg-hk-ivory-warm flex-shrink-0">
                <img src={resolveImage(p.images[0])} alt={p.name} className="w-full h-full object-cover"/>
              </Link>
              <div className="flex-1">
                <Link to={`/product/${p.slug}`}><h3 className="font-serif text-xl hover:text-hk-green">{p.name}</h3></Link>
                <p className="text-xs text-hk-charcoal/55 mb-1">{p.subtitle}</p>
                {p.reason && <p className="text-sm text-hk-olive italic">→ {p.reason}</p>}
                <div className="flex justify-between items-end mt-3">
                  <p className="font-serif text-xl text-hk-green font-semibold">₹{p.price}</p>
                  <button onClick={()=>addToCart(p)} className="hk-btn-secondary text-xs px-5 py-2">Add to Cart</button>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="text-center mt-10">
          <Link to="/shop" className="hk-btn-primary">Continue Shopping <ArrowRight size={14}/></Link>
        </div>
      </div>
    );
  }

  const progress = ((step + 1) / questions.length) * 100;
  const Q = questions[step];

  return (
    <div className="max-w-2xl mx-auto px-5 py-14 min-h-[70vh]" data-testid="quiz-page">
      <div className="text-center mb-10">
        <p className="overline mb-3">{type === "hair" ? "Hair Analysis Quiz" : "Skin Analysis Quiz"}</p>
        <h1 className="font-serif text-4xl">Question {step + 1} of {questions.length}</h1>
        <div className="quiz-bar mt-5"><div style={{ width: `${progress}%` }}/></div>
      </div>
      <div className="bg-white rounded-2xl p-8 border border-hk-green/10">
        <h2 className="font-serif text-2xl md:text-3xl mb-7">{Q.q}</h2>
        <div className="grid gap-3">
          {Q.opts.map((opt) => (
            <button key={opt} onClick={()=>select(opt)} data-testid={`opt-${opt}`} className="text-left px-5 py-4 rounded-xl border-2 border-hk-green/15 hover:border-hk-green hover:bg-hk-ivory-warm transition font-medium">{opt}</button>
          ))}
        </div>
      </div>
      {step > 0 && <button onClick={()=>setStep(step-1)} className="mt-4 text-sm text-hk-green hover:text-hk-gold">← Back</button>}
    </div>
  );
};
export default Quiz;
