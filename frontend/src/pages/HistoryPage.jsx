import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import api from "../services/api";

export default function HistoryPage() {
  const [rows, setRows] = useState([]);

  useEffect(() => {
    api.get('/predictions').then((res) => setRows(res.data));
  }, []);

  return (
    <Layout>
      <div className="glass-card p-6">
        <h2 className="text-2xl mb-4">Patient History</h2>
        <div className="space-y-3">
          {rows.map((r) => (
            <div key={r.id} className="p-3 rounded bg-slate-800/40">
              <p>{r.created_at} - {r.status} - {r.top_disease || 'No Finding'}</p>
              {r.doctor_notes && <p className="text-sm text-slate-300 mt-1">Notes: {r.doctor_notes}</p>}
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}
