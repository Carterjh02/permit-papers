import React from "react";

interface SearchBarProps {
  name?: string;
  label?: string;
  placeholder?: string;
  defaultValue?: string;
  className?: string;
}

export function SearchBar({
  name = "q",
  label = "Search",
  placeholder = "Search...",
  defaultValue,
  className,
}: SearchBarProps) {
  return (
    <div>
      <label className="block text-sm font-medium">{label}</label>
      <input
        type="text"
        name={name}
        defaultValue={defaultValue}
        placeholder={placeholder}
        className={className ?? "input"}
      />
    </div>
  );
}
