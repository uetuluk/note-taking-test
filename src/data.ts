/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Note, Notebook } from './types';

export const INITIAL_NOTEBOOKS: Notebook[] = [
  {
    id: 'nb-all',
    name: 'All Notes',
    color: 'slate',
    icon: 'Folder'
  },
  {
    id: 'nb-ideas',
    name: 'Personal Ideas',
    color: 'amber',
    icon: 'Lightbulb'
  },
  {
    id: 'nb-work',
    name: 'Work & Projects',
    color: 'sky',
    icon: 'Briefcase'
  },
  {
    id: 'nb-journal',
    name: 'Daily Journal',
    color: 'emerald',
    icon: 'BookOpen'
  },
  {
    id: 'nb-scratch',
    name: 'Quick Scratchpad',
    color: 'indigo',
    icon: 'PenTool'
  }
];

export const NOTE_COLORS = [
  { name: 'Default Slate', value: 'slate', border: 'border-slate-200', bg: 'bg-slate-50/50', text: 'text-slate-800', accent: 'bg-slate-600' },
  { name: 'Warm Amber', value: 'amber', border: 'border-amber-200Check', bg: 'bg-amber-50/40', text: 'text-amber-800', accent: 'bg-amber-500' },
  { name: 'Sunset Rose', value: 'rose', border: 'border-rose-200', bg: 'bg-rose-50/30', text: 'text-rose-800', accent: 'bg-rose-500' },
  { name: 'Sky Breeze', value: 'sky', border: 'border-sky-200', bg: 'bg-sky-50/40', text: 'text-sky-800', accent: 'bg-sky-500' },
  { name: 'Emerald Leaf', value: 'emerald', border: 'border-emerald-200', bg: 'bg-emerald-50/30', text: 'text-emerald-800', accent: 'bg-emerald-500' },
  { name: 'Violet Cloud', value: 'violet', border: 'border-violet-200', bg: 'bg-violet-50/30', text: 'text-violet-800', accent: 'bg-violet-500' }
];

export const getNoteColorConfig = (colorName: string) => {
  return NOTE_COLORS.find(c => c.value === colorName) || NOTE_COLORS[0];
};

export const INITIAL_NOTES: Note[] = [
  {
    id: 'note-welcome',
    title: 'Welcome to your Workspace! ✨',
    content: `# Quick Start Guide 👋

Welcome to your elegant, offline-first notes workspace. Your data remains safe on your device at all times.

Here is what you can do right away:
- **Notebooks**: Filter notes via notebooks in the sidebar.
- **Interactivity**: Try clicking the checkboxes below directly from the *Active Preview* tab!
- **Dual Layout**: Toggle between **Edit**, **Preview**, or side-by-side **Split screen** views.
- **Full Text Search**: Instantly filter notes by typing in the search bar.
- **Pinning**: Keep critical checklists pinned in their own header block.

---

## Workspace Checklist:
- [x] Click the checkmarks in this preview to interact
- [ ] Create a new tag (type a tag in the editor, like "work" or "goals", and hit enter)
- [ ] Make a new note by pressing "+ Create Note"
- [ ] Pin this note using the pin icon up top to keep it at the very first slot
- [ ] Switch the note colors to Rose or Sky using the circle indicators above

---

## Markdown Syntax Helpers
Format text easily while writing:
- Heading styles: Use \`# Title\` or \`## Subtitle\` at the start of a line.
- Custom Quote Blocks: Start a line with \`>\` to isolate thoughts.
> "A beautiful layout opens the path to clearer thinking."
- Code snippets: Enclose tech codes in triple-backticks \`\`\` to get responsive syntax styling.`,
    notebookId: 'nb-scratch',
    tags: ['guide', 'scratchpad', 'tutorial'],
    isPinned: true,
    color: 'slate',
    createdAt: Date.now() - 3600000 * 5, // 5 hours ago
    updatedAt: Date.now() - 3600000 * 5
  },
  {
    id: 'note-ideas',
    title: 'Project Spark Idea 💡',
    content: `# Feature Specs: Project Spark
Brainstorming next additions to our full-scale web product.

## Immediate UI Goals:
- [x] Sleek sidebar toggle to optimize smaller desktop interfaces
- [x] Mobile sliding card hierarchy
- [ ] Custom note templates (e.g. meeting briefs, journals)
- [ ] Rich tag lists on the sidebar margin

---
## Tech Architecture:
Using a custom bundler with clean responsive styling:
\`\`\`typescript
interface SparkConfiguration {
  version: string;
  isProd: boolean;
  theme: "dark" | "light" | "system";
}
\`\`\``,
    notebookId: 'nb-ideas',
    tags: ['spark', 'features', 'brainstorm'],
    isPinned: false,
    color: 'amber',
    createdAt: Date.now() - 3600000 * 24 * 2, // 2 days ago
    updatedAt: Date.now() - 3600000 * 24 * 2
  },
  {
    id: 'note-journal',
    title: 'Mindfulness & Intentions 🌱',
    content: `# Morning Ritual & Focus Log
*Thursday Reflection*

## Today's Intentions:
- [x] Complete primary sprint assignments
- [ ] Stretch/walk outside for 15 minutes at lunch
- [ ] Drink 3 full bottles of filtered spring water
- [ ] Limit non-essential messaging checks to once per block

> "The premium metric of our energy is how clearly we align daily habits with long-term peace."`,
    notebookId: 'nb-journal',
    tags: ['mindfulness', 'journal', 'daily'],
    isPinned: false,
    color: 'emerald',
    createdAt: Date.now() - 3600000 * 24 * 5, // 5 days ago
    updatedAt: Date.now() - 3600000 * 24 * 5
  },
  {
    id: 'note-stretch',
    title: 'Desk Stretching Routine 🧘',
    content: `# Afternoon Ergonomic Flow
Beat desk tension and keyboard fatigue in under 10 minutes:

## Checklist:
1. **Shoulder Rolls**: 10 times forward, 10 times backward.
2. **Neck Flexes**: Tilt left, hold 15s. Tilt right, hold 15s.
3. **Standing Quad Stretch**: 30s per leg.
4. **Wrist Extensions**: Pull fingers back gently for 15s.

*Tip: Do this once at 2 PM to reset posture!*`,
    notebookId: 'nb-ideas',
    tags: ['stretching', 'ergonomics', 'health'],
    isPinned: false,
    color: 'rose',
    createdAt: Date.now() - 3600000 * 24 * 10, // 10 days ago
    updatedAt: Date.now() - 3600000 * 24 * 10
  }
];
