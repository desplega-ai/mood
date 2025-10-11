"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

type Founder = {
  id: string;
  name: string;
  email: string;
  createdAt: string;
};

type Recurrence = "daily" | "weekly" | "monthly";

export default function ConfigPage() {
  const router = useRouter();
  const [token, setToken] = useState<string>("");
  const [founders, setFounders] = useState<Founder[]>([]);
  const [loading, setLoading] = useState(true);
  const [newFounder, setNewFounder] = useState({ name: "", email: "" });
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");
  const [recurrence, setRecurrence] = useState<Recurrence>("daily");
  const [updatingRecurrence, setUpdatingRecurrence] = useState(false);
  const [recurrenceSuccess, setRecurrenceSuccess] = useState(false);

  useEffect(() => {
    const storedToken = localStorage.getItem("apiToken");
    if (!storedToken) {
      router.push("/");
      return;
    }
    setToken(storedToken);
    fetchFounders(storedToken);
    fetchRecurrence(storedToken);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchFounders = async (token: string) => {
    try {
      setLoading(true);
      const res = await fetch("/api/founders", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error("Failed to fetch founders");

      const data = await res.json();
      setFounders(data.founders);
    } catch (error) {
      console.error("Error fetching founders:", error);
      setError("Failed to load founders");
    } finally {
      setLoading(false);
    }
  };

  const fetchRecurrence = async (token: string) => {
    try {
      const res = await fetch("/api/settings/recurrence", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error("Failed to fetch recurrence");

      const data = await res.json();
      setRecurrence(data.recurrence);
    } catch (error) {
      console.error("Error fetching recurrence:", error);
    }
  };

  const updateRecurrence = async (newRecurrence: Recurrence) => {
    try {
      setUpdatingRecurrence(true);
      setRecurrenceSuccess(false);
      setError("");

      const res = await fetch("/api/settings/recurrence", {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ recurrence: newRecurrence }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update recurrence");
      }

      setRecurrence(newRecurrence);
      setRecurrenceSuccess(true);
      setTimeout(() => setRecurrenceSuccess(false), 3000);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to update recurrence");
    } finally {
      setUpdatingRecurrence(false);
    }
  };

  const addFounder = async () => {
    if (!newFounder.name || !newFounder.email) {
      setError("Please fill in all fields");
      return;
    }

    try {
      setAdding(true);
      setError("");

      const res = await fetch("/api/founders", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newFounder),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to add founder");
      }

      setNewFounder({ name: "", email: "" });
      await fetchFounders(token);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to add founder");
    } finally {
      setAdding(false);
    }
  };

  const deleteFounder = async (id: string) => {
    if (!confirm("Are you sure you want to delete this founder?")) {
      return;
    }

    try {
      const res = await fetch(`/api/founders/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error("Failed to delete founder");

      await fetchFounders(token);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to delete founder");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Configure Founders</h1>
              <p className="text-gray-600">Manage founders who will receive mood check emails</p>
            </div>
            <button
              onClick={() => router.push("/dashboard")}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Back to Dashboard
            </button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          <div className="bg-gray-50 p-6 rounded-lg mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Add New Founder</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Name"
                value={newFounder.name}
                onChange={(e) => setNewFounder({ ...newFounder, name: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <input
                type="email"
                placeholder="Email"
                value={newFounder.email}
                onChange={(e) => setNewFounder({ ...newFounder, email: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <button
              onClick={addFounder}
              disabled={adding}
              className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:bg-indigo-300"
            >
              {adding ? "Adding..." : "Add Founder"}
            </button>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Current Founders ({founders.length})
            </h2>
            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                <p className="mt-4 text-gray-600">Loading founders...</p>
              </div>
            ) : founders.length === 0 ? (
              <div className="text-center py-12 text-gray-600">
                No founders configured yet. Add your first founder above.
              </div>
            ) : (
              <div className="space-y-3">
                {founders.map((founder) => (
                  <div
                    key={founder.id}
                    className="flex justify-between items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div>
                      <p className="font-medium text-gray-800">{founder.name}</p>
                      <p className="text-sm text-gray-600">{founder.email}</p>
                      <p className="text-xs text-gray-500">
                        Added: {new Date(founder.createdAt).toLocaleDateString("es-ES")}
                      </p>
                    </div>
                    <button
                      onClick={() => deleteFounder(founder.id)}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-8 bg-gray-50 p-6 rounded-lg">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Email Recurrence</h2>
            <p className="text-sm text-gray-600 mb-4">
              Configure how often founders receive mood check emails
            </p>

            {recurrenceSuccess && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4">
                Recurrence updated successfully!
              </div>
            )}

            <div className="space-y-3">
              <label className="flex items-center p-4 bg-white rounded-lg border-2 border-gray-200 hover:border-indigo-300 cursor-pointer transition-colors">
                <input
                  type="radio"
                  name="recurrence"
                  value="daily"
                  checked={recurrence === "daily"}
                  onChange={(e) => updateRecurrence(e.target.value as Recurrence)}
                  disabled={updatingRecurrence}
                  className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                />
                <div className="ml-3">
                  <p className="font-medium text-gray-800">Daily</p>
                  <p className="text-sm text-gray-600">
                    Send mood check every weekday (Mon-Fri) at 6:00 AM
                  </p>
                </div>
              </label>

              <label className="flex items-center p-4 bg-white rounded-lg border-2 border-gray-200 hover:border-indigo-300 cursor-pointer transition-colors">
                <input
                  type="radio"
                  name="recurrence"
                  value="weekly"
                  checked={recurrence === "weekly"}
                  onChange={(e) => updateRecurrence(e.target.value as Recurrence)}
                  disabled={updatingRecurrence}
                  className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                />
                <div className="ml-3">
                  <p className="font-medium text-gray-800">Weekly</p>
                  <p className="text-sm text-gray-600">Send mood check every Monday at 6:00 AM</p>
                </div>
              </label>

              <label className="flex items-center p-4 bg-white rounded-lg border-2 border-gray-200 hover:border-indigo-300 cursor-pointer transition-colors">
                <input
                  type="radio"
                  name="recurrence"
                  value="monthly"
                  checked={recurrence === "monthly"}
                  onChange={(e) => updateRecurrence(e.target.value as Recurrence)}
                  disabled={updatingRecurrence}
                  className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                />
                <div className="ml-3">
                  <p className="font-medium text-gray-800">Monthly</p>
                  <p className="text-sm text-gray-600">
                    Send mood check on the 1st of each month at 6:00 AM (weekdays only)
                  </p>
                </div>
              </label>
            </div>
          </div>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold text-gray-800 mb-2">About Mood Checks</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Emails sent at 6:00 AM (Spanish time) on weekdays only</li>
              <li>• Each email asks about yesterday and today</li>
              <li>• Founders simply reply to the email with their thoughts</li>
              <li>• AI automatically categorizes mood from the response</li>
              <li>• No emails are sent on weekends (Saturday and Sunday)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
