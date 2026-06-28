"use client";

import { useRef, useState, KeyboardEvent } from "react";

interface Option {
  value: string;
  label: string;
}

interface TypeAheadSelectProps {
  name: string;
  options: Option[];
  defaultValue?: string;
  className?: string;
}

export function TypeAheadSelect({
  name,
  options,
  defaultValue,
  className,
}: TypeAheadSelectProps) {
  const selectRef = useRef<HTMLSelectElement | null>(null);
  const [buffer, setBuffer] = useState("");
  const [lastKeyTime, setLastKeyTime] = useState<number>(0);

  function handleKeyDown(e: KeyboardEvent<HTMLSelectElement>) {
    const now = Date.now();
    const char = e.key.length === 1 ? e.key.toLowerCase() : "";

    if (!char.match(/[a-z0-9]/)) return;

    let newBuffer = buffer;

    if (now - lastKeyTime > 700) {
      newBuffer = char;
    } else {
      newBuffer = buffer + char;
    }

    setBuffer(newBuffer);
    setLastKeyTime(now);

    const idx = options.findIndex((opt) =>
      opt.label.toLowerCase().startsWith(newBuffer)
    );

    if (idx >= 0 && selectRef.current) {
      selectRef.current.selectedIndex = idx;
    }
  }

  return (
    <select
      ref={selectRef}
      name={name}
      defaultValue={defaultValue}
      className={className}
      onKeyDown={handleKeyDown}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
