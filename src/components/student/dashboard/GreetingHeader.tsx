"use client";

import { useEffect, useState } from "react";

import { format } from "date-fns";

interface GreetingHeaderProps {
  fullName: string;
}

export default function GreetingHeader({ fullName }: GreetingHeaderProps) {
  const [greeting, setGreeting] = useState("Good day");
  const [currentDate, setCurrentDate] = useState("");

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good morning");
    else if (hour < 18) setGreeting("Good afternoon");
    else setGreeting("Good evening");

    setCurrentDate(format(new Date(), "EEEE, MMMM d"));
  }, []);

  const firstName = fullName?.split(" ")[0] || "Student";

  return (
    <div className="flex items-start justify-between">
      <div>
        <h1 className="font-sans text-[28px] font-bold text-gray-900">
          {greeting}, {firstName} 👋
        </h1>
        <p className="mt-1 text-[14px] text-gray-400">{currentDate}</p>
      </div>
    </div>
  );
}
