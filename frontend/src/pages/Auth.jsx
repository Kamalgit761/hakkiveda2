import { useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "sonner";
import api from "@/lib/api";

const Auth = () => {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "", new_password: "" });
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "login") {
        await login(form.email, form.password);
        toast.success("Welcome back!");
        navigate("/account");
      } else if (mode === "register") {
        await register(form.name, form.email, form.password);
        toast.success("Welcome to HAKKIVEDA!");
        navigate("/account");
      } else {
        await api.post("/auth/forgot-password", { email: form.email, new_password: form.new_password });
        toast.success("Password reset! Please sign in.");
        setMode("login");
      }
    } catch (e) {
      toast.error(e.response?.data?.detail || "Failed");
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-[80vh] grid lg:grid-cols-2 bg-hk-ivory" data-testid="auth-page">
      <div className="hidden lg:block relative">
        <img src="https://images.pexels.com/photos/35210201/pexels-photo-35210201.jpeg" alt="" className="absolute inset-0 w-full h-full object-cover"/>
        <div className="absolute inset-0 bg-[#0a3d27]/60 flex items-center justify-center">
          <div className="text-center text-[#FAF8F3] px-10">
            <p className="overline text-hk-gold mb-3" style={{color:"#C9A227"}}>HAKKIVEDA</p>
            <h2 className="font-serif text-5xl">Your Ayurvedic Journey<br/>Begins Here</h2>
            <p className="font-display italic text-xl mt-5 text-[#FAF8F3]/80">Hakki Pikki Tribal Wisdom · Ayurvedic Healing</p>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-center p-10">
        <div className="w-full max-w-md">
          <p className="overline mb-3">{mode === "login" ? "Welcome back" : mode === "register" ? "Join HAKKIVEDA" : "Reset password"}</p>
          <h1 className="font-serif text-4xl mb-8">{mode === "login" ? "Sign In" : mode === "register" ? "Create Account" : "Forgot Password"}</h1>
          <form onSubmit={submit} className="space-y-4">
            {mode === "register" && (
              <input required placeholder="Full Name" value={form.name} onChange={(e)=>setForm({...form,name:e.target.value})} data-testid="auth-name" className="w-full px-4 py-3 rounded-lg border border-hk-green/20 bg-white text-sm focus:outline-none focus:border-hk-green"/>
            )}
            <input required type="email" placeholder="Email" value={form.email} onChange={(e)=>setForm({...form,email:e.target.value})} data-testid="auth-email" className="w-full px-4 py-3 rounded-lg border border-hk-green/20 bg-white text-sm focus:outline-none focus:border-hk-green"/>
            {mode !== "forgot" && (
              <input required type="password" placeholder="Password" value={form.password} onChange={(e)=>setForm({...form,password:e.target.value})} data-testid="auth-password" className="w-full px-4 py-3 rounded-lg border border-hk-green/20 bg-white text-sm focus:outline-none focus:border-hk-green"/>
            )}
            {mode === "forgot" && (
              <input required type="password" placeholder="New Password" value={form.new_password} onChange={(e)=>setForm({...form,new_password:e.target.value})} data-testid="auth-new-password" className="w-full px-4 py-3 rounded-lg border border-hk-green/20 bg-white text-sm focus:outline-none focus:border-hk-green"/>
            )}
            <button type="submit" disabled={loading} data-testid="auth-submit" className="hk-btn-primary w-full disabled:opacity-50">
              {loading ? "Please wait…" : mode === "login" ? "Sign In" : mode === "register" ? "Create Account" : "Reset Password"}
            </button>
          </form>
          <div className="mt-6 text-sm text-center space-y-2">
            {mode === "login" && (
              <>
                <p><button onClick={()=>setMode("forgot")} className="text-hk-green hover:text-hk-gold underline">Forgot password?</button></p>
                <p>New to HAKKIVEDA? <button onClick={()=>setMode("register")} data-testid="switch-register" className="text-hk-green font-semibold">Create account</button></p>
              </>
            )}
            {mode === "register" && (
              <p>Already have an account? <button onClick={()=>setMode("login")} data-testid="switch-login" className="text-hk-green font-semibold">Sign in</button></p>
            )}
            {mode === "forgot" && (
              <p>Remember password? <button onClick={()=>setMode("login")} className="text-hk-green font-semibold">Sign in</button></p>
            )}
            <p><Link to="/" className="text-hk-charcoal/55 hover:text-hk-green">← Back to home</Link></p>
          </div>
        </div>
      </div>
    </div>
  );
};
export default Auth;
