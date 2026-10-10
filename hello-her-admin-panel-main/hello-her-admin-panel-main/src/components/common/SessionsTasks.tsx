"use client";

import Image from "next/image";
import { useState } from "react";
import { FaVideo } from "react-icons/fa";

type Session = {
  name: string;
  time: string;
  date: string; // format: "2024-03-18"
  duration: string;
};

type TaskDay = {
  date: string; // format: "2024-03-18"
  label: string; // "18 Mar"
  sessions: Session[];
};

const sessionTabs = ["All", "Upcoming", "Missed", "Scheduled"];

const tasks: TaskDay[] = [
  {
    date: "2024-03-18",
    label: "18 Mar",
    sessions: [
      {
        name: "Suman",
        time: "9:00 - 10:00",
        date: "2024-03-18",
        duration: "60 min Session",
      },
      {
        name: "Aman",
        time: "11:00 - 12:00",
        date: "2024-03-18",
        duration: "60 min Session",
      },
    ],
  },
  {
    date: "2024-03-19",
    label: "19 Mar",
    sessions: [],
  },
  {
    date: "2024-03-20",
    label: "20 Mar",
    sessions: [],
  },
];

export default function SessionsTasks() {
  const [selectedDate, setSelectedDate] = useState("2024-03-18");
  const selectedSessions =
    tasks.find((day) => day.date === selectedDate)?.sessions || [];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 rounded-xl">
      {/* Left: Sessions */}
      <div className="bg-white rounded-xl p-4 shadow-sm">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-base font-semibold">Sessions</h3>
          <input
            type="text"
            placeholder="Search"
            className="rounded-md w-1/2 bg-gray-100 px-3 py-2 text-xs"
          />
        </div>

        {/* Radio Tabs */}
        <div className="flex gap-5 mb-4">
          {sessionTabs.map((tab) => (
            <label
              key={tab}
              className="flex items-center gap-1 cursor-pointer text-xs"
            >
              <input
                type="radio"
                name="sessionType"
                className="min-h-5 min-w-5"
              />
              {tab}
            </label>
          ))}
        </div>

        {/* Session List */}
        <div className="space-y-2">
          {Array(3)
            .fill(0)
            .map((_, idx) => (
              <div
                key={idx}
                className="flex justify-between items-center p-3 border rounded-lg"
              >
                <div className="flex gap-2">
                  <div className="flex items-center gap-3">
                    <Image
                      width={100}
                      height={100}
                      alt="avatar"
                      src="https://i.pravatar.cc/40"
                      className="w-10 h-10 rounded-full"
                    />
                  </div>
                  <div className="flex gap-2">
                    <div>
                      <p className="font-medium">Anil Vij</p>
                      <p className="text-xs text-gray-500">9:00 - 10:00</p>
                    </div>
                    <div className="border-l pl-2">
                      <p className="font-medium text-gray-500">18 Mar, Tue</p>
                      <p className="text-xs text-gray-500">60 Min</p>
                    </div>
                  </div>
                </div>
                <p className="bg-cyan-100 p-2 rounded-full">
                  <FaVideo className="text-cyan-500" />
                </p>
              </div>
            ))}
        </div>
      </div>

      {/* Right: Tasks */}
      <div className="bg-white rounded-xl p-4 shadow-sm">
        <h3 className="text-base font-semibold mb-3">Tasks</h3>

        {/* Date Scroller */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {tasks.map((day) => (
            <button
              key={day.date}
              onClick={() => setSelectedDate(day.date)}
              className={`flex flex-col items-center px-3 py-2 rounded-lg min-w-[60px] ${
                day.date === selectedDate
                  ? "bg-cyan-100 text-cyan-600 font-semibold"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              <span className="text-base font-semibold">
                {day.label.split(" ")[0]}
              </span>
              <span className="text-xs py-1">{day.label.split(" ")[1]}</span>
              {day.date === selectedDate && (
                <span className="w-2 h-2 mt-1 bg-cyan-500 rounded-full" />
              )}
            </button>
          ))}
        </div>

        {/* Task List */}
        <div className="mt-4 space-y-3 max-h-[300px] overflow-y-auto pr-1">
          {selectedSessions.length ? (
            selectedSessions.map((session, idx) => (
              <div
                key={idx}
                className="flex justify-between items-center border-l-4 border-cyan-400 pl-3 py-1"
              >
                <div>
                  <p className="font-semibold text-base pb-1">{session.name}</p>
                  <p className="text-xs text-gray-500">{session.duration}</p>
                </div>
                <p className="text-xs text-gray-500">{session.time}</p>
              </div>
            ))
          ) : (
            <p className="text-xs text-gray-500">No tasks for selected date.</p>
          )}
        </div>
      </div>
    </div>
  );
}
