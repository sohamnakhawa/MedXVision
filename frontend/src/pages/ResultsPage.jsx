import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import Layout from "../components/Layout";
import api from "../services/api";

export default function ResultsPage() {
  const { id } = useParams();
  const [result, setResult] = useState(null);
  const [doctorNotes, setDoctorNotes] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);

  useEffect(() => {
    api.get(`/predictions/${id}`).then((res) => {
      setResult(res.data);
      setDoctorNotes(res.data.doctor_notes || "");
    });
  }, [id]);

  const saveDoctorNotes = async () => {
    const form = new FormData();
    form.append("doctor_notes", doctorNotes);
    setSavingNotes(true);
    try {
      const { data } = await api.patch(`/predictions/${id}/doctor-notes`, form);
      setResult(data);
    } finally {
      setSavingNotes(false);
    }
  };

  if (!result) return <Layout><p>Loading result...</p></Layout>;

  return (
    <Layout>
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="glass-card p-6">
          <h2 className="text-2xl font-semibold mb-2">Diagnosis Report</h2>
          <p>Status: <span className="font-bold">{result.status}</span></p>
          <p>Severity: {result.severity}</p>
          <ul className="mt-4 space-y-2">
            {result.diseases.map((d) => <li key={d.name}>{d.name}: {(d.probability * 100).toFixed(2)}%</li>)}
          </ul>
          <div className="mt-4 space-x-4 text-sm">
            {result.image_url && <a className="text-accent" href={result.image_url} target="_blank" rel="noreferrer">View original X-ray</a>}
            {result.report_url && <a className="text-accent" href={result.report_url} target="_blank" rel="noreferrer">Download PDF report</a>}
          </div>
        </div>
        <div className="glass-card p-6">
          <h3 className="text-xl mb-3">Grad-CAM Visualization</h3>
          <img src={result.gradcam_url} alt="GradCAM" className="rounded-xl" />
          <p className="mt-2 text-sm text-slate-400">Highlighted regions indicate areas influencing the AI prediction.</p>
        </div>
        <div className="glass-card p-6 lg:col-span-2">
          <h3 className="text-xl mb-3">AI Confidence Chart</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={result.diseases}>
                <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 12 }} />
                <YAxis tick={{ fill: "#94a3b8" }} domain={[0, 1]} />
                <Tooltip formatter={(value) => `${(value * 100).toFixed(2)}%`} />
                <Bar dataKey="probability" fill="#22c55e" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="glass-card p-6 lg:col-span-2">
          <h3 className="text-xl mb-3">Doctor Notes</h3>
          <textarea
            value={doctorNotes}
            onChange={(e) => setDoctorNotes(e.target.value)}
            className="w-full min-h-28 p-3 rounded-xl bg-slate-800/80"
            placeholder="Add interpretation notes, recommendation, and follow-up guidance."
          />
          <button onClick={saveDoctorNotes} disabled={savingNotes} className="mt-4 px-5 py-2 rounded-xl bg-accent text-black font-semibold">
            {savingNotes ? "Saving..." : "Save Notes"}
          </button>
        </div>
      </div>
    </Layout>
  );
}
