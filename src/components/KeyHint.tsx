import React from 'react';

interface KeyHintProps {
  keys: string[];
  label: string;
}

export const KeyHint: React.FC<KeyHintProps> = ({ keys, label }) => (
  <span className="inline-flex items-center gap-1.5 text-xs text-muted">
    {keys.map((k) => <kbd key={k} className="kbd">{k}</kbd>)}
    <span>{label}</span>
  </span>
);
