'use client';

import React, { useState, useEffect } from 'react';
import { Edit2 } from 'lucide-react';

export interface EditableTextProps {
  value: string;
  onChange: (newVal: string) => void;
  className?: string;
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'p' | 'span';
  multiline?: boolean;
  placeholder?: string;
  editable?: boolean;
}

export default function EditableText({
  value,
  onChange,
  className = '',
  as: Component = 'span',
  multiline = false,
  placeholder = '텍스트를 입력하세요...',
  editable = false,
}: EditableTextProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [currentVal, setCurrentVal] = useState(value);

  useEffect(() => {
    setCurrentVal(value);
  }, [value]);

  if (!editable) {
    return <Component className={className}>{value}</Component>;
  }

  const handleBlur = () => {
    setIsEditing(false);
    if (currentVal !== value) {
      onChange(currentVal);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!multiline && e.key === 'Enter') {
      e.preventDefault();
      handleBlur();
    }
  };

  return (
    <span className="relative inline-block group/edit max-w-full">
      {isEditing ? (
        multiline ? (
          <textarea
            autoFocus
            rows={3}
            value={currentVal}
            onChange={(e) => setCurrentVal(e.target.value)}
            onBlur={handleBlur}
            placeholder={placeholder}
            className={`w-full bg-black/80 text-white border-2 border-rose-500 rounded-lg p-2 focus:outline-none shadow-2xl resize-y ${className}`}
          />
        ) : (
          <input
            autoFocus
            type="text"
            value={currentVal}
            onChange={(e) => setCurrentVal(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className={`bg-black/80 text-white border-2 border-rose-500 rounded-lg px-2 py-0.5 focus:outline-none shadow-2xl ${className}`}
          />
        )
      ) : (
        <Component
          onClick={() => setIsEditing(true)}
          className={`cursor-pointer transition-all hover:ring-1 hover:ring-rose-500/80 hover:bg-rose-950/20 rounded px-1 -mx-1 ${className}`}
          title="클릭하여 텍스트 직접 수정"
        >
          {value || <span className="text-zinc-500 italic">{placeholder}</span>}
          <span className="inline-flex ml-1.5 opacity-0 group-hover/edit:opacity-100 transition-opacity text-rose-400">
            <Edit2 className="w-3.5 h-3.5" />
          </span>
        </Component>
      )}
    </span>
  );
}

