import { Link } from "react-router-dom";
import { motion } from "framer-motion";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-700 text-white p-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-6xl mx-auto">
        <h1 className="text-5xl font-bold mb-4">AI-Powered Chest X-ray Disease Detection System</h1>
        <p className="text-slate-200 mb-6">Early detection support tool for NORMAL/ABNORMAL classification, multi-disease prediction, and explainable AI visualizations using Grad-CAM.</p>
        <Link to="/login" className="px-6 py-3 rounded-xl bg-primary text-black font-semibold">Get Started</Link>
        <section className="grid md:grid-cols-3 gap-6 mt-12">
          <article className="glass-card p-5"><h3 className="font-semibold mb-2">Dataset</h3><p>NIH ChestXray14 with 14 disease labels + No Finding.</p></article>
          <article className="glass-card p-5"><h3 className="font-semibold mb-2">Explainability</h3><p>Grad-CAM highlights suspicious regions influencing prediction.</p></article>
          <article className="glass-card p-5"><h3 className="font-semibold mb-2">Clinical UX</h3><p>Dashboard, analytics, PDF report export, and case history tracking.</p></article>
        </section>
      </motion.div>
    </div>
  );
}
