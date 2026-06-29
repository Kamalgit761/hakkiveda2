import { useState } from "react";
import { Phone, MessageCircle, Mail, MapPin, Clock } from "lucide-react";
import api from "@/lib/api";
import { toast } from "sonner";

const Contact = () => {
  const [form, setForm] = useState({ name: "", email: "", phone: "", subject: "", message: "" });
  const [loading, setLoading] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/contact", form);
      toast.success("Message sent! We'll respond within 24 hours.");
      setForm({ name: "", email: "", phone: "", subject: "", message: "" });
    } catch { toast.error("Submission failed"); }
    setLoading(false);
  };
  return (
    <div data-testid="contact-page" className="bg-hk-ivory">
      <section className="bg-hk-ivory-warm py-16 text-center">
        <p className="overline mb-3">Get in Touch</p>
        <h1 className="font-serif text-5xl md:text-6xl">Connect with us</h1>
        <p className="text-hk-charcoal/65 mt-4 max-w-xl mx-auto px-5">Our wellness consultants are here to guide your Ayurvedic journey.</p>
      </section>
      <section className="max-w-6xl mx-auto px-5 lg:px-10 py-16 grid lg:grid-cols-2 gap-10">
        <div className="space-y-5">
          {[
            { icon: Phone, t: "Call Us", d: "+91 76195 36831", href: "tel:+917619536831", testId:"contact-call" },
            { icon: MessageCircle, t: "WhatsApp", d: "+91 76195 36831", href: "https://wa.me/917619536831", testId:"contact-wa" },
            { icon: Mail, t: "Email", d: "care@hakkiveda.com", href: "mailto:care@hakkiveda.com" },
            { icon: MapPin, t: "Visit", d: "Bengaluru · Karnataka · India" },
            { icon: Clock, t: "Hours", d: "Mon–Sat · 9 AM – 7 PM IST" },
          ].map((c) => (
            <a key={c.t} href={c.href || "#"} data-testid={c.testId} target={c.href?.startsWith("http")?"_blank":undefined} rel="noopener noreferrer" className="block bg-white rounded-2xl p-6 border border-hk-green/10 hover:border-hk-gold transition flex items-center gap-5">
              <div className="w-12 h-12 rounded-full bg-hk-ivory-warm flex items-center justify-center text-hk-green"><c.icon size={20}/></div>
              <div>
                <p className="text-xs uppercase tracking-widest text-hk-olive font-semibold">{c.t}</p>
                <p className="font-serif text-xl mt-0.5">{c.d}</p>
              </div>
            </a>
          ))}
        </div>
        <form onSubmit={submit} className="bg-white rounded-2xl p-8 border border-hk-green/10" data-testid="contact-form">
          <h2 className="font-serif text-3xl mb-6">Send us a message</h2>
          <div className="space-y-4">
            {[["name","Name"],["email","Email"],["phone","Phone"],["subject","Subject"]].map(([k,l])=>(
              <input key={k} required={k!=="phone"} type={k==="email"?"email":"text"} placeholder={l} value={form[k]} onChange={(e)=>setForm({...form,[k]:e.target.value})} data-testid={`contact-${k}`} className="w-full px-4 py-3 rounded-lg border border-hk-green/20 bg-hk-ivory text-sm focus:outline-none focus:border-hk-green"/>
            ))}
            <textarea required placeholder="Your message…" rows={5} value={form.message} onChange={(e)=>setForm({...form,message:e.target.value})} data-testid="contact-message" className="w-full px-4 py-3 rounded-lg border border-hk-green/20 bg-hk-ivory text-sm focus:outline-none focus:border-hk-green resize-none"/>
            <button type="submit" disabled={loading} data-testid="contact-submit" className="hk-btn-primary w-full disabled:opacity-50">{loading?"Sending…":"Send Message"}</button>
          </div>
        </form>
      </section>
    </div>
  );
};
export default Contact;
