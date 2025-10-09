"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const [token, setToken] = useState("");
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (token) {
      localStorage.setItem("apiToken", token);
      router.push("/dashboard");
    }
  };

  const handleRequestAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const res = await fetch("/api/request-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, companyName }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage("Success! Check your email for your API key.");
        setName("");
        setEmail("");
        setCompanyName("");
        setTimeout(() => {
          setShowRequestForm(false);
          setMessage("");
        }, 3000);
      } else {
        setMessage(data.error || "Failed to create API key");
      }
    } catch (error) {
      setMessage("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">Mood Tracker</h1>

        {!showRequestForm ? (
          <>
            <p className="text-gray-600 mb-6 text-center">
              Enter your API token to view your mood data
            </p>
            <form onSubmit={handleSubmit}>
              <input
                type="text"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Enter your API token"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-4"
                required
              />
              <button
                type="submit"
                className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition-colors font-medium mb-3"
              >
                Access Dashboard
              </button>
            </form>

            <div className="text-center mt-4">
              <button
                onClick={() => setShowRequestForm(true)}
                className="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
              >
                Don&apos;t have an API key? Request access →
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="text-gray-600 mb-6 text-center">Request access to Mood Tracker</p>
            <form onSubmit={handleRequestAccess}>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-4"
                required
              />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Your email address"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-4"
                required
              />
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Company name"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-4"
                required
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition-colors font-medium mb-3 disabled:opacity-50"
              >
                {loading ? "Sending..." : "Request API Key"}
              </button>
              <button
                type="button"
                onClick={() => setShowRequestForm(false)}
                className="w-full bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                Back to Login
              </button>
            </form>

            {message && (
              <div
                className={`mt-4 p-3 rounded-lg text-sm ${
                  message.includes("Success")
                    ? "bg-green-50 text-green-800"
                    : "bg-red-50 text-red-800"
                }`}
              >
                {message}
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
