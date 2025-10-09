"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { getMoodLabel, getMoodColor } from "@/lib/mood-labels";

type MoodEntry = {
  id: string;
  mood: number;
  timeOfDay: string;
  createdAt: string;
  respondedAt: string | null;
  rawResponse: string | null;
  founder: {
    id: string;
    name: string;
    email: string;
  };
};

export default function Dashboard() {
  const router = useRouter();
  const [token, setToken] = useState<string>("");
  const [period, setPeriod] = useState<"all" | "weekly" | "monthly">("all");
  const [moodData, setMoodData] = useState<MoodEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [companyName, setCompanyName] = useState("");
  const [selectedEntry, setSelectedEntry] = useState<MoodEntry | null>(null);

  useEffect(() => {
    const storedToken = localStorage.getItem("apiToken");
    if (!storedToken) {
      router.push("/");
      return;
    }
    setToken(storedToken);
    validateToken(storedToken);
    fetchMoodData(storedToken, period);

    // Auto-refresh every 30 seconds
    const intervalId = setInterval(() => {
      fetchMoodData(storedToken, period);
    }, 30000);

    return () => clearInterval(intervalId);
  }, [period]);

  const validateToken = async (token: string) => {
    try {
      const res = await fetch("/api/auth/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      if (!res.ok) {
        localStorage.removeItem("apiToken");
        router.push("/");
        return;
      }

      const data = await res.json();
      setCompanyName(data.apiKey.companyName);
    } catch (error) {
      console.error("Validation error:", error);
      router.push("/");
    }
  };

  const fetchMoodData = async (token: string, period: string) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/mood?period=${period}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error("Failed to fetch mood data");

      const data = await res.json();
      setMoodData(data.moodEntries);
    } catch (error) {
      console.error("Error fetching mood data:", error);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("apiToken");
    router.push("/");
  };

  const formatChartData = () => {
    return moodData
      .filter((entry) => entry.respondedAt !== null)
      .map((entry) => ({
        date: new Date(entry.createdAt).toLocaleDateString("es-ES", {
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
        mood: entry.mood,
        timeOfDay: entry.timeOfDay,
        founder: entry.founder.name,
        label: getMoodLabel(entry.mood as any),
      }));
  };

  const averageMoodNum =
    moodData.filter((e) => e.respondedAt).length > 0
      ? moodData
          .filter((e) => e.respondedAt)
          .reduce((sum, e) => sum + e.mood, 0) /
        moodData.filter((e) => e.respondedAt).length
      : 0;

  const averageMoodLabel =
    averageMoodNum > 0
      ? getMoodLabel(Math.round(averageMoodNum) as any)
      : "N/A";
  const averageMood = averageMoodNum > 0 ? averageMoodNum.toFixed(1) : "N/A";

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">
                {companyName || "Mood Tracker"}
              </h1>
              <p className="text-gray-600">Track founder mood over time</p>
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => router.push("/dashboard/config")}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Configure Founders
              </button>
              <button
                onClick={logout}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>

          <div className="flex gap-4 mb-6">
            <button
              onClick={() => setPeriod("all")}
              className={`px-4 py-2 rounded-lg transition-colors ${
                period === "all"
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setPeriod("weekly")}
              className={`px-4 py-2 rounded-lg transition-colors ${
                period === "weekly"
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              Weekly
            </button>
            <button
              onClick={() => setPeriod("monthly")}
              className={`px-4 py-2 rounded-lg transition-colors ${
                period === "monthly"
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              Monthly
            </button>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              <p className="mt-4 text-gray-600">Loading mood data...</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Total Responses</p>
                  <p className="text-2xl font-bold text-gray-800">
                    {moodData.filter((e) => e.respondedAt).length}
                  </p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Average Mood</p>
                  <p className="text-2xl font-bold text-gray-800">
                    {averageMoodLabel} ({averageMood})
                  </p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Pending Responses</p>
                  <p className="text-2xl font-bold text-gray-800">
                    {moodData.filter((e) => !e.respondedAt).length}
                  </p>
                </div>
              </div>

              {formatChartData().length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={formatChartData()} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis
                      domain={[0, 5]}
                      ticks={[0, 1, 2, 3, 4, 5]}
                      tickFormatter={(value) => getMoodLabel(value)}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-white p-4 rounded-lg shadow-lg border">
                              <p className="font-semibold">{data.founder}</p>
                              <p className="text-sm text-gray-600">
                                {data.date}
                              </p>
                              <p className="text-sm">
                                Time: {data.timeOfDay}
                              </p>
                              <p
                                className="font-bold"
                                style={{ color: getMoodColor(data.mood) }}
                              >
                                Mood: {data.label}
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend formatter={(value) => "Mood"} />
                    <Line
                      type="monotone"
                      dataKey="mood"
                      stroke="#4f46e5"
                      strokeWidth={2}
                      dot={{ r: 6 }}
                      name="Mood"
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-12 text-gray-600">
                  No mood data available for this period.
                </div>
              )}

              <div className="mt-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">
                  Recent Entries
                </h3>
                <div className="space-y-2">
                  {moodData.slice(0, 10).map((entry) => (
                    <div
                      key={entry.id}
                      onClick={() => entry.respondedAt && setSelectedEntry(entry)}
                      className={`flex justify-between items-center p-4 bg-gray-50 rounded-lg ${
                        entry.respondedAt ? "cursor-pointer hover:bg-gray-100 transition-colors" : ""
                      }`}
                    >
                      <div>
                        <p className="font-medium text-gray-800">
                          {entry.founder.name}
                        </p>
                        <p className="text-sm text-gray-600">
                          {new Date(entry.createdAt).toLocaleString("es-ES")} -{" "}
                          {entry.timeOfDay}
                        </p>
                      </div>
                      <div className="text-right">
                        {entry.respondedAt ? (
                          <>
                            <p
                              className="font-bold"
                              style={{ color: getMoodColor(entry.mood as any) }}
                            >
                              {getMoodLabel(entry.mood as any)}
                            </p>
                            <p className="text-sm text-gray-600">
                              Click to view reply
                            </p>
                          </>
                        ) : (
                          <p className="text-sm text-gray-500">
                            Pending response
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Modal for showing exact reply */}
      {selectedEntry && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedEntry(null)}
        >
          <div
            className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-bold text-gray-800">
                  {selectedEntry.founder.name}'s Response
                </h3>
                <p className="text-sm text-gray-600">
                  {new Date(selectedEntry.createdAt).toLocaleString("es-ES")} -{" "}
                  {selectedEntry.timeOfDay}
                </p>
              </div>
              <button
                onClick={() => setSelectedEntry(null)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>
            <div className="mb-4">
              <p
                className="text-lg font-bold mb-2"
                style={{ color: getMoodColor(selectedEntry.mood as any) }}
              >
                Mood: {getMoodLabel(selectedEntry.mood as any)}
              </p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">Email Reply:</p>
              <p className="text-gray-800 whitespace-pre-wrap">
                {selectedEntry.rawResponse || "No response text available"}
              </p>
            </div>
            <button
              onClick={() => setSelectedEntry(null)}
              className="mt-4 w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
