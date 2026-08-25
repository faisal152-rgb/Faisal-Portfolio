import React from "react";
import "./SkillBar.css";

export default function SkillBar({ name, value }) {
  return (
    <div className="mb-4">
      <div className="flex justify-between text-sm mb-1.5">
        <span className="text-slate-700 font-medium">{name}</span>
        <span className="text-purple-600 font-semibold">{value}%</span>
     </div>
      <div className="h-2 w-full rounded-full bg-purple-100 overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-purple-500 to-fuchsia-500"
          style={{ width: `${value}%` }}
        />
     </div>
   </div>
  );
}

