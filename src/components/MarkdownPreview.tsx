/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface MarkdownPreviewProps {
  content: string;
  onContentChange?: (newContent: string) => void;
}

export const MarkdownPreview: React.FC<MarkdownPreviewProps> = ({ content, onContentChange }) => {
  if (!content.trim()) {
    return (
      <div className="text-slate-400 italic font-sans text-sm py-4">
        No content yet. Write something in your note...
      </div>
    );
  }

  const lines = content.split('\n');
  let inCodeBlock = false;
  let codeBlockLines: string[] = [];
  let codeBlockLang = '';

  const toggleTodoItem = (lineIndex: number) => {
    if (!onContentChange) return;
    const updatedLines = [...lines];
    const targetLine = updatedLines[lineIndex];
    
    // Toggle checked matching
    if (targetLine.includes('[ ]')) {
      updatedLines[lineIndex] = targetLine.replace('[ ]', '[x]');
    } else if (targetLine.includes('[x]')) {
      updatedLines[lineIndex] = targetLine.replace('[x]', '[ ]');
    }
    onContentChange(updatedLines.join('\n'));
  };

  const elements: React.ReactNode[] = [];

  const parseInlineStyles = (text: string): React.ReactNode[] => {
    // Basic regex parser for inline markdown: bold (**), italic (*), inline code (`)
    const parts: React.ReactNode[] = [];
    let currentText = text;
    let key = 0;

    // Fast inline styling processing
    const regex = /(\*\*|__)(.*?)\1|(\*|_)(.*?)\3|(`)(.*?)\5/g;
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(text)) !== null) {
      const matchIndex = match.index;
      
      // Add preceding plain text
      if (matchIndex > lastIndex) {
        parts.push(text.slice(lastIndex, matchIndex));
      }

      if (match[1]) { // Bold
        parts.push(<strong key={key++} className="font-semibold text-slate-900">{match[2]}</strong>);
      } else if (match[3]) { // Italic
        parts.push(<em key={key++} className="italic text-slate-800">{match[4]}</em>);
      } else if (match[5]) { // Inline Code
        parts.push(
          <code key={key++} className="px-1.5 py-0.5 bg-slate-100 text-rose-600 rounded font-mono text-xs border border-slate-200">
            {match[6]}
          </code>
        );
      }

      lastIndex = regex.lastIndex;
    }

    if (lastIndex < text.length) {
      parts.push(text.slice(lastIndex));
    }

    return parts.length > 0 ? parts : [text];
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Handle code blocks
    if (line.trim().startsWith('```')) {
      if (inCodeBlock) {
        // Close code block
        inCodeBlock = false;
        const codeText = codeBlockLines.join('\n');
        const lang = codeBlockLang;
        elements.push(
          <div key={`code-${i}`} className="my-3 font-mono text-xs rounded-lg overflow-hidden border border-slate-200 shadow-sm bg-slate-900 text-slate-100">
            {lang && (
              <div className="bg-slate-800 text-slate-400 px-3 py-1 text-[10px] uppercase font-bold tracking-wider border-b border-slate-700/50 flex justify-between items-center">
                <span>{lang}</span>
                <span className="text-[9px] lowercase italic text-slate-500">code block</span>
              </div>
            )}
            <pre className="p-4 overflow-x-auto whitespace-pre font-mono leading-relaxed select-all">
              <code>{codeText}</code>
            </pre>
          </div>
        );
        codeBlockLines = [];
        codeBlockLang = '';
      } else {
        // Open code block
        inCodeBlock = true;
        codeBlockLang = line.trim().slice(3).trim();
      }
      continue;
    }

    if (inCodeBlock) {
      codeBlockLines.push(line);
      continue;
    }

    // Horizontal Rule
    if (line.match(/^---+\s*$/)) {
      elements.push(<hr key={`hr-${i}`} className="my-6 border-slate-200 border-t-2" />);
      continue;
    }

    // Headings
    if (line.startsWith('# ')) {
      elements.push(
        <h1 key={`h1-${i}`} className="text-2xl font-bold text-slate-900 font-sans tracking-tight mt-6 mb-3 first:mt-2">
          {parseInlineStyles(line.slice(2))}
        </h1>
      );
      continue;
    }
    if (line.startsWith('## ')) {
      elements.push(
        <h2 key={`h2-${i}`} className="text-xl font-bold text-slate-800 font-sans tracking-tight mt-5 mb-2 first:mt-2">
          {parseInlineStyles(line.slice(3))}
        </h2>
      );
      continue;
    }
    if (line.startsWith('### ')) {
      elements.push(
        <h3 key={`h3-${i}`} className="text-lg font-semibold text-slate-800 mt-4 mb-2 first:mt-2">
          {parseInlineStyles(line.slice(4))}
        </h3>
      );
      continue;
    }

    // Blockquote
    if (line.startsWith('>')) {
      const quoteText = line.slice(1).trim();
      elements.push(
        <blockquote key={`quote-${i}`} className="border-l-4 border-slate-300 pl-4 py-1 my-3 text-slate-600 italic bg-slate-50/50 rounded-r pr-2">
          {parseInlineStyles(quoteText)}
        </blockquote>
      );
      continue;
    }

    // Task Checklist: - [ ] or - [x]
    const todoMatch = line.match(/^(\s*)-\s*\[([ xX])\]\s+(.*)$/);
    if (todoMatch) {
      const isChecked = todoMatch[2].toLowerCase() === 'x';
      const text = todoMatch[3];
      const indent = todoMatch[1].length * 12; // indentation padding
      const lineIdx = i; // capture index
      
      elements.push(
        <div 
          key={`todo-${i}`} 
          className="flex items-start my-1.5 focus:outline-none select-none group"
          style={{ paddingLeft: `${indent}px` }}
        >
          <button
            type="button"
            onClick={() => toggleTodoItem(lineIdx)}
            disabled={!onContentChange}
            className={`mr-2.5 mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border border-slate-300 transition-colors cursor-pointer hover:border-slate-500 hover:bg-slate-50 active:scale-95 ${
              isChecked ? 'bg-indigo-600 border-indigo-600 text-white hover:bg-indigo-700' : 'bg-white'
            }`}
          >
            {isChecked && (
              <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            )}
          </button>
          <span className={`text-sm text-slate-700 transition-all ${isChecked ? 'line-through text-slate-400' : ''}`}>
            {parseInlineStyles(text)}
          </span>
        </div>
      );
      continue;
    }

    // Bullet Lists: - or *
    const bulletMatch = line.match(/^(\s*)[-*]\s+(.*)$/);
    if (bulletMatch && !line.includes('[ ]') && !line.includes('[x]')) {
      const text = bulletMatch[2];
      const indent = bulletMatch[1].length * 12;
      elements.push(
        <div key={`bullet-${i}`} className="flex items-start my-1" style={{ paddingLeft: `${indent}px` }}>
          <span className="text-slate-400 mr-2.5 mt-1.5 shrink-0 select-none">•</span>
          <span className="text-sm text-slate-700">{parseInlineStyles(text)}</span>
        </div>
      );
      continue;
    }

    // Numbered Lists: 1. or 2.
    const numberMatch = line.match(/^(\s*)\d+\.\s+(.*)$/);
    if (numberMatch) {
      const text = numberMatch[2];
      const num = line.trim().split('.')[0];
      const indent = numberMatch[1].length * 12;
      elements.push(
        <div key={`num-${i}`} className="flex items-start my-1" style={{ paddingLeft: `${indent}px` }}>
          <span className="font-mono text-xs font-medium text-slate-400 mr-2 shrink-0 select-none w-5 text-right">{num}.</span>
          <span className="text-sm text-slate-700">{parseInlineStyles(text)}</span>
        </div>
      );
      continue;
    }

    // Default Paragraph line
    if (line.trim() === '') {
      // Empty line spacer
      elements.push(<div key={`spacer-${i}`} className="h-2" />);
    } else {
      elements.push(
        <p key={`p-${i}`} className="text-sm text-slate-700 leading-relaxed my-2 font-sans">
          {parseInlineStyles(line)}
        </p>
      );
    }
  }

  // Handle unclosed code blocks at the very end of file
  if (inCodeBlock && codeBlockLines.length > 0) {
    const codeText = codeBlockLines.join('\n');
    const lang = codeBlockLang;
    elements.push(
      <div key="unclosed-code" className="my-3 font-mono text-xs rounded-lg overflow-hidden border border-slate-200 bg-slate-900 text-slate-100">
        {lang && <div className="bg-slate-800 text-slate-400 px-3 py-1 text-[10px] uppercase font-bold tracking-wider">{lang}</div>}
        <pre className="p-4 overflow-x-auto whitespace-pre font-mono">
          <code>{codeText}</code>
        </pre>
      </div>
    );
  }

  return (
    <div className="prose max-w-none prose-slate space-y-0.5">
      {elements}
    </div>
  );
};
