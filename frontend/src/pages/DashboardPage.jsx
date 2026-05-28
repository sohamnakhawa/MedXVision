import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import api from "../services/api";

export default function DashboardPage() {
  const [files, setFiles] = useState([]);
  const [doctorNotes, setDoctorNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleAnalyze = async () => {
    if (!files.length) return;
    const form = new FormData();
    for (const file of files) {
      form.append("images", file);
    }
    form.append("doctor_notes", doctorNotes);
    setLoading(true);
    try {
      const { data } = await api.post("/predictions/analyze-batch", form);
      if (data?.length) {
        navigate(`/results/${data[0].id}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="glass-card p-6 max-w-3xl">
        <h2 className="text-2xl font-semibold mb-4">Analyze Chest X-ray</h2>
        <div className="border-2 border-dashed border-slate-500 rounded-xl p-8 text-center">
          <input type="file" multiple accept="image/*" onChange={(e) => setFiles(Array.from(e.target.files || []))} />
          <p className="mt-2 text-slate-400">Upload one or more X-rays for multi-image analysis.</p>
          {files.length > 0 && <p className="mt-4">Selected: {files.length} file(s)</p>}
        </div>
        <textarea
          value={doctorNotes}
          onChange={(e) => setDoctorNotes(e.target.value)}
          className="w-full mt-4 min-h-24 p-3 rounded-xl bg-slate-800/80"
          placeholder="Doctor notes (optional): clinical context, observed symptoms, follow-up recommendation."
        />
        <button onClick={handleAnalyze} disabled={!files.length || loading} className="mt-6 px-6 py-3 rounded-xl bg-primary text-black font-semibold">
          {loading ? "Analyzing..." : "Analyze"}
        </button>
      </div>
    </Layout>
  );
}
