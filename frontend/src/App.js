import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import "./App.css";

// 🔹 Chart imports
import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

import { Line } from "react-chartjs-2";

// Register chart components
ChartJS.register(
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Title,
  Tooltip,
  Legend
);

function App() {
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [barcode, setBarcode] = useState("");
  const [barcodeImage, setBarcodeImage] = useState("");
  const [searchBarcode, setSearchBarcode] = useState("");
  const [patient, setPatient] = useState(null);
  const [scanInput, setScanInput] = useState("");
  const [liveWeight, setLiveWeight] = useState(0);
  const [stable, setStable] = useState(false);
  const API = "https://weighingautomationback-production.up.railway.app";

  const registerPatient = async () => {
    const res = await axios.post(`${API}/register`, {
      name,
      age: parseInt(age),
    });

    setBarcode(res.data.barcode);
    setBarcodeImage(res.data.barcode_image);
  };

  const fetchPatient = useCallback(async () => {
  try {
    const res = await axios.get(`${API}/patient/${searchBarcode}`);
    setPatient(res.data);
  } catch {
    alert("Patient not found");
  }
}, [searchBarcode]);
  const handleScan = async (e) => {
    if (e.key === "Enter") {
      try {
        await axios.post(`${API}/scan`, {
          barcode: scanInput
        });

        alert("Barcode scanned successfully ✔");

        setScanInput("");

      } catch (err) {
        alert("Scan failed ❌");
      }
    }
  };
  useEffect(() => {

  const interval = setInterval(async () => {

    try {

      const res = await axios.get(`${API}/live-weight`);

      setLiveWeight(res.data.live_weight);
      setStable(res.data.stable);

      // 🔥 Auto refresh patient data after stable save
      if (res.data.stable && searchBarcode) {
        fetchPatient();
      }

    } catch (err) {}

  }, 300);

  return () => clearInterval(interval);

}, [searchBarcode, fetchPatient]);

  return (
    <div className="container">
      <h1>Smart Patient Weight System</h1>

      <div className="grid">

        {/* Register Card */}
        <div className="card">
          <h2>Register Patient</h2>

          <input
            placeholder="Patient Name"
            onChange={(e) => setName(e.target.value)}
          />

          <input
            placeholder="Age"
            onChange={(e) => setAge(e.target.value)}
          />

          <button onClick={registerPatient}>Register</button>

          {barcode && (
            <div className="barcode-box">
              <p><b>Barcode:</b> {barcode}</p>

              <img src={barcodeImage} alt="barcode" />

              <a href={barcodeImage} download>
                <button className="secondary">Download</button>
              </a>
            </div>
          )}
        </div>

        {/* Search Card */}
        <div className="card">
          <h2>Search Patient</h2>
          <div
              style={{
                background: "#f5f5f5",
                padding: "15px",
                borderRadius: "10px",
                marginBottom: "15px",
                textAlign: "center"
              }}
            >

              <h2>
                Live Weight: {liveWeight.toFixed(2)} kg
              </h2>

              {stable ? (
                <p style={{ color: "green", fontWeight: "bold" }}>
                  Stable Weight Detected ✔
                </p>
              ) : (
                <p style={{ color: "orange", fontWeight: "bold" }}>
                  Stabilizing...
                </p>
              )}

            </div>

          <div className="search-row">
            <input
              placeholder=" Scan barcode here"
              value={scanInput}
              onChange={(e) => setScanInput(e.target.value)}
              onKeyDown={handleScan}
              autoFocus
            />
            <input
              placeholder="Enter Barcode"
              onChange={(e) => setSearchBarcode(e.target.value)}
            />
            <button onClick={fetchPatient}>Search</button>
          </div>

          {patient && (
            <div className="patient-info">
              <h3>{patient.name} (Age: {patient.age})</h3>

              <h4>Weight History</h4>

              {/* FILTER VALID WEIGHTS */}
              {(() => {
                const validWeights = patient.weights.filter(w => w.weight > 20);

                return (
                  <>
                    <div style={{ height: "300px", marginBottom: "20px" }}>
                        <Line
                            data={{
                              labels: validWeights.map(w =>
                                new Date(w.timestamp).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })
                              ),
                              datasets: [
                                {
                                  label: "Weight (kg)",
                                  data: validWeights.map(w => w.weight),

                                  // 🎨 Styling
                                  borderColor: "#4CAF50",
                                  backgroundColor: "rgba(76, 175, 80, 0.2)",
                                  pointBackgroundColor: "#4CAF50",
                                  pointBorderColor: "#fff",
                                  pointRadius: 5,
                                  pointHoverRadius: 7,

                                  borderWidth: 3,
                                  tension: 0.4, // smoother curve
                                  fill: true,
                                },
                              ],
                            }}
                            options={{
                              responsive: true,
                              maintainAspectRatio: false,

                              plugins: {
                                legend: {
                                  display: true,
                                  labels: {
                                    font: {
                                      size: 14,
                                      weight: "bold",
                                    },
                                  },
                                },

                                tooltip: {
                                  callbacks: {
                                    label: (context) =>
                                      `${context.raw} kg`,
                                  },
                                },
                              },

                              scales: {
                                x: {
                                  ticks: {
                                    maxRotation: 0,
                                    minRotation: 0,
                                    font: {
                                      size: 12,
                                    },
                                  },
                                  grid: {
                                    display: false,
                                  },
                                },

                                y: {
                                  beginAtZero: false,
                                  ticks: {
                                    font: {
                                      size: 12,
                                    },
                                  },
                                  grid: {
                                    color: "rgba(200,200,200,0.2)",
                                  },
                                },
                              },
                            }}
                          />
                    </div>

                    {/*  LIST */}
                    <ul>
                      {patient.weights.map((w, i) => (
                        <li key={i}>
                          {w.weight} kg —{" "}
                          {new Date(w.timestamp).toLocaleString()}
                        </li>
                      ))}
                    </ul>
                  </>
                );
              })()}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

export default App;
