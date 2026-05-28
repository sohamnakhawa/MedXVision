import { useState } from "react";

function App() {
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleImageChange = (e) => {
    const file = e.target.files[0];

    if (file) {
      setImage(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handlePredict = async () => {
    if (!image) return;

    setLoading(true);

    const formData = new FormData();
    formData.append("image", image);

    try {
      const response = await fetch("http://127.0.0.1:5002/predict", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error("Prediction Error:", error);
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-black text-white p-8">
      <div className="max-w-7xl mx-auto">

        <div className="text-center mb-12">
          <h1 className="text-6xl font-extrabold text-cyan-400 mb-4 tracking-tight">
            MedXVision AI
          </h1>

          <p className="text-slate-300 text-xl max-w-3xl mx-auto leading-relaxed">
            AI-Powered Chest X-ray Disease Detection & Explainable Radiology Analysis Platform
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          <div className="bg-slate-900/80 backdrop-blur-lg border border-slate-800 rounded-3xl p-8 shadow-2xl">
            <h2 className="text-3xl font-bold mb-6 text-cyan-400">
              Upload Chest X-ray
            </h2>

            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="mb-6 block w-full text-sm text-slate-300
              file:mr-4 file:py-3 file:px-6
              file:rounded-xl file:border-0
              file:text-sm file:font-semibold
              file:bg-cyan-500 file:text-white
              hover:file:bg-cyan-600"
            />

            {preview ? (
              <img
                src={preview}
                alt="preview"
                className="w-full rounded-2xl border border-slate-700 shadow-xl"
              />
            ) : (
              <div className="h-[420px] border-2 border-dashed border-slate-700 rounded-2xl flex items-center justify-center text-slate-500 text-lg">
                Upload X-ray Image Preview
              </div>
            )}

            <button
              onClick={handlePredict}
              className="mt-8 w-full bg-cyan-500 hover:bg-cyan-600 transition-all duration-300 py-4 rounded-2xl text-xl font-bold shadow-lg"
            >
              Analyze X-ray
            </button>

            {loading && (
              <div className="mt-6 bg-yellow-500/10 border border-yellow-500 rounded-xl p-4 text-yellow-400 text-lg animate-pulse">
                Running AI analysis and generating Grad-CAM visualization...
              </div>
            )}
          </div>

          <div className="bg-slate-900/80 backdrop-blur-lg border border-slate-800 rounded-3xl p-8 shadow-2xl">

            {!result ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-slate-500">
                <div className="text-7xl mb-6">🩻</div>
                <h2 className="text-3xl font-bold mb-4 text-slate-300">
                  AI Diagnostic Results
                </h2>
                <p className="max-w-md leading-relaxed">
                  Upload a chest X-ray image to generate disease predictions, confidence scores, and Grad-CAM explainability maps.
                </p>
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-4xl font-bold text-green-400">
                    Prediction Result
                  </h2>

                  <div className="px-4 py-2 rounded-full bg-green-500/20 border border-green-500 text-green-300 font-semibold">
                    {result.status}
                  </div>
                </div>

                <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 mb-8">
                  <h3 className="text-2xl font-bold text-cyan-400 mb-3">
                    Primary Detection
                  </h3>

                  <p className="text-4xl font-extrabold mb-3">
                    {result.top_disease || result.disease}
                  </p>

                  <p className="text-xl text-slate-300">
                    Confidence Score:
                    <span className="ml-2 text-cyan-400 font-bold">
                      {result.top_confidence || result.confidence}%
                    </span>
                  </p>
                </div>

                {result.predictions && (
                  <div className="mb-8">
                    <h3 className="text-2xl font-bold text-white mb-5">
                      Disease Probability Analysis
                    </h3>

                    <div className="space-y-5">
                      {result.predictions.map((item, index) => (
                        <div key={index}>
                          <div className="flex justify-between mb-2 text-lg">
                            <span>{item.disease}</span>
                            <span className="text-cyan-400 font-semibold">
                              {item.confidence}%
                            </span>
                          </div>

                          <div className="w-full bg-slate-700 rounded-full h-5 overflow-hidden">
                            <div
                              className="bg-cyan-400 h-5 rounded-full transition-all duration-700"
                              style={{ width: `${item.confidence}%` }}
                            ></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {result.gradcam && (
                  <div>
                    <h3 className="text-2xl font-bold text-cyan-400 mb-5">
                      Grad-CAM Visualization
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <p className="mb-3 text-slate-300 font-semibold">
                          Original X-ray
                        </p>

                        <img
                          src={preview}
                          alt="Original"
                          className="rounded-2xl border border-slate-700 shadow-xl"
                        />
                      </div>

                      <div>
                        <p className="mb-3 text-slate-300 font-semibold">
                          AI Attention Heatmap
                        </p>

                        <img
                          src={result.gradcam}
                          alt="GradCAM"
                          className="rounded-2xl border border-cyan-500 shadow-xl"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;