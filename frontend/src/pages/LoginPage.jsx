import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function LoginPage() {
  const [isSignup, setIsSignup] = useState(false);
  const [form, setForm] = useState({ full_name: "", email: "", password: "" });
  const { login, signup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSignup) await signup(form); else await login(form.email, form.password);
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white p-4">
      <form onSubmit={handleSubmit} className="glass-card p-8 w-full max-w-md space-y-4">
        <h2 className="text-2xl font-semibold">{isSignup ? "Create Account" : "Welcome Back"}</h2>
        {isSignup && <input className="w-full p-3 rounded bg-slate-800" placeholder="Full name" onChange={(e) => setForm({ ...form, full_name: e.target.value })} />}
        <input className="w-full p-3 rounded bg-slate-800" type="email" placeholder="Email" onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <input className="w-full p-3 rounded bg-slate-800" type="password" placeholder="Password" onChange={(e) => setForm({ ...form, password: e.target.value })} />
        <button className="w-full p-3 rounded bg-primary text-black font-semibold">{isSignup ? "Sign up" : "Login"}</button>
        <button type="button" className="text-accent" onClick={() => setIsSignup(!isSignup)}>{isSignup ? "Already have an account? Login" : "No account? Create one"}</button>
      </form>
    </div>
  );
}
