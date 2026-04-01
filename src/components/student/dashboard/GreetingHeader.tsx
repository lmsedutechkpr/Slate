"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { useTranslations } from "next-intl";

interface GreetingHeaderProps {
  fullName: string;
}

export default function GreetingHeader({ fullName }: GreetingHeaderProps) {
  const [greetingKey, setGreetingKey] = useState("goodMorning");
  const [currentDate, setCurrentDate] = useState("");
  const t = useTranslations("student");

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreetingKey("goodMorning");
    else if (hour < 18) setGreetingKey("goodAfternoon");
    else setGreetingKey("goodEvening");

    setCurrentDate(format(new Date(), "EEEE, MMMM d"));
  }, []);

  const firstName = fullName?.split(" ")[0] || "Student";

  return (
    <div className="flex items-start justify-between">
      <div>
        <h1 className="font-sans text-[28px] font-bold text-gray-900">
          {t(greetingKey as any)}, {firstName} 👋
        </h1>
        <p className="mt-1 text-[14px] text-gray-400">{currentDate}</p>
      </div>
    </div>
  );
}
