"use client";

import { useState } from "react";

export default function AddFaculty() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    facultyCode: "",
    username: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const response = await fetch("/api/faculty", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });

    const data = await response.json();
    alert(data.message + (data.password ? `\nGenerated Password: ${data.password}` : ""));
  };

  return (
    <div className="flex justify-center items-center h-screen bg-gray-100">
      <form
        onSubmit={handleSubmit}
        className="bg-white shadow-lg rounded-2xl p-6 w-96"
      >
        <h2 className="text-xl font-bold mb-4">Add New Faculty</h2>

        <input
          type="text"
          name="name"
          placeholder="Full Name"
          className="w-full border rounded p-2 mb-3"
          onChange={handleChange}
          required
        />
        <input
          type="email"
          name="email"
          placeholder="Email"
          className="w-full border rounded p-2 mb-3"
          onChange={handleChange}
          required
        />
        <input
          type="text"
          name="facultyCode"
          placeholder="Faculty Code"
          className="w-full border rounded p-2 mb-3"
          onChange={handleChange}
          required
        />
        <input
          type="text"
          name="username"
          placeholder="Username"
          className="w-full border rounded p-2 mb-3"
          onChange={handleChange}
          required
        />

        <button
          type="submit"
          className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
        >
          Add Faculty
        </button>
      </form>
    </div>
  );
}
