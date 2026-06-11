/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Folder, 
  Lightbulb, 
  Briefcase, 
  BookOpen, 
  PenTool, 
  Search, 
  Plus, 
  Trash2, 
  Pin, 
  Tag as TagIcon, 
  ChevronLeft, 
  ArrowLeft, 
  Eye, 
  Edit3, 
  Columns, 
  X, 
  Clock, 
  FileText, 
  Undo, 
  Sparkles,
  Calendar,
  CheckCircle2,
  Trash,
  Notebook as NotebookIcon
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { Note, Notebook, ViewMode } from './types';
import { INITIAL_NOTEBOOKS, INITIAL_NOTES, getNoteColorConfig, NOTE_COLORS } from './data';
import { MarkdownPreview } from './components/MarkdownPreview';

// Helper to dynamically render category icons
const getNotebookIcon = (iconName: string) => {
  switch (iconName) {
    case 'Lightbulb': return <Lightbulb className="w-4 h-4 shrink-0" />;
    case 'Briefcase': return <Briefcase className="w-4 h-4 shrink-0" />;
    case 'BookOpen': return <BookOpen className="w-4 h-4 shrink-0" />;
    case 'PenTool': return <PenTool className="w-4 h-4 shrink-0" />;
    default: return <Folder className="w-4 h-4 shrink-0" />;
  }
};

export default function App() {
  // --- Persistent States ---
  const [notes, setNotes] = useState<Note[]>(() => {
    try {
      const saved = localStorage.getItem('notes_app_notes');
      return saved ? JSON.parse(saved) : INITIAL_NOTES;
    } catch {
      return INITIAL_NOTES;
    }
  });

  const [notebooks, setNotebooks] = useState<Notebook[]>(() => {
    try {
      const saved = localStorage.getItem('notes_app_notebooks');
      return saved ? JSON.parse(saved) : INITIAL_NOTEBOOKS;
    } catch {
      return INITIAL_NOTEBOOKS;
    }
  });

  // --- Workspace Filters & Navigation ---
  const [selectedNotebookId, setSelectedNotebookId] = useState<string>('nb-all');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortKey, setSortKey] = useState<'updated-desc' | 'updated-asc' | 'title-asc' | 'title-desc'>('updated-desc');
  
  // Active Selected Note
  const [activeNoteId, setActiveNoteId] = useState<string | null>(() => {
    return INITIAL_NOTES.length > 0 ? INITIAL_NOTES[0].id : null;
  });

  const [viewMode, setViewMode] = useState<ViewMode>('preview');
  
  // Sidebar state
  const [showNotebookModal, setShowNotebookModal] = useState<boolean>(false);
  const [newNotebookName, setNewNotebookName] = useState<string>('');
  const [newNotebookColor, setNewNotebookColor] = useState<string>('amber');
  const [newNotebookIcon, setNewNotebookIcon] = useState<string>('Folder');

  // Tag creation temporary input
  const [tagInput, setTagInput] = useState<string>('');

  // Undo manager
  const [deletedNoteUndo, setDeletedNoteUndo] = useState<Note | null>(null);
  const [showUndoToast, setShowUndoToast] = useState<boolean>(false);

  // Search input node focus helper
  const searchInputRef = useRef<HTMLInputElement>(null);

  // --- Persistence Side Effects ---
  useEffect(() => {
    localStorage.setItem('notes_app_notes', JSON.stringify(notes));
  }, [notes]);

  useEffect(() => {
    localStorage.setItem('notes_app_notebooks', JSON.stringify(notebooks));
  }, [notebooks]);

  // --- Dynamic calculations ---
  // Compile distinct tags list dynamically across all notes
  const allCurrentTags = useMemo(() => {
    const list: string[] = [];
    notes.forEach(note => {
      note.tags.forEach(tag => {
        const cleaned = tag.toLowerCase().trim();
        if (cleaned && !list.includes(cleaned)) {
          list.push(cleaned);
        }
      });
    });
    return list.sort();
  }, [notes]);

  // Retrieve active note configuration
  const activeNote = useMemo(() => {
    return notes.find(n => n.id === activeNoteId) || null;
  }, [notes, activeNoteId]);

  // Filter notes based on Notebook selection, Active tag filtering, and Live Search
  const filteredNotes = useMemo(() => {
    let result = [...notes];

    // 1. Notebook filter
    if (selectedNotebookId !== 'nb-all') {
      result = result.filter(n => n.notebookId === selectedNotebookId);
    }

    // 2. Dynamic Tag filter
    if (selectedTag) {
      result = result.filter(n => n.tags.map(t => t.toLowerCase().trim()).includes(selectedTag));
    }

    // 3. Full Text Search Match inside (Title, Body text, or Tags)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(n => {
        return (
          n.title.toLowerCase().includes(query) ||
          n.content.toLowerCase().includes(query) ||
          n.tags.some(tag => tag.toLowerCase().includes(query))
        );
      });
    }

    // 4. Sort selection
    result.sort((a, b) => {
      // Pinned status gets top priority during sorting
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;

      switch (sortKey) {
        case 'updated-asc':
          return a.updatedAt - b.updatedAt;
        case 'title-asc':
          return a.title.localeCompare(b.title);
        case 'title-desc':
          return b.title.localeCompare(a.title);
        case 'updated-desc':
        default:
          return b.updatedAt - a.updatedAt;
      }
    });

    return result;
  }, [notes, selectedNotebookId, selectedTag, searchQuery, sortKey]);

  // Notebook counts
  const getNoteCountForNotebook = (id: string) => {
    if (id === 'nb-all') return notes.length;
    return notes.filter(n => n.notebookId === id).length;
  };

  // --- Handlers ---
  const handleCreateNote = () => {
    const freshNotebookId = selectedNotebookId !== 'nb-all' ? selectedNotebookId : (notebooks[1]?.id || 'nb-scratch');
    const freshNote: Note = {
      id: `note-${Date.now()}`,
      title: 'Untitled Note 📝',
      content: `# New Note\nWrite something interesting here...`,
      notebookId: freshNotebookId,
      tags: selectedTag ? [selectedTag] : [],
      isPinned: false,
      color: 'slate',
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    setNotes(prev => [freshNote, ...prev]);
    setActiveNoteId(freshNote.id);
    setViewMode('edit');
  };

  const handleUpdateActiveNote = (updates: Partial<Note>) => {
    if (!activeNoteId) return;
    setNotes(prev => prev.map(n => {
      if (n.id === activeNoteId) {
        return {
          ...n,
          ...updates,
          updatedAt: Date.now()
        };
      }
      return n;
    }));
  };

  const handleDeleteNote = (id: string) => {
    const target = notes.find(n => n.id === id);
    if (!target) return;

    // Soft backup for undo feature
    setDeletedNoteUndo(target);
    setShowUndoToast(true);
    setTimeout(() => {
      setShowUndoToast(false);
    }, 5000);

    // Filter list
    setNotes(prev => prev.filter(n => n.id !== id));
    
    // Choose replacement active note
    if (activeNoteId === id) {
      const remaining = notes.filter(n => n.id !== id);
      if (remaining.length > 0) {
        setActiveNoteId(remaining[0].id);
      } else {
        setActiveNoteId(null);
      }
    }
  };

  const handleRestoreDeletedNote = () => {
    if (!deletedNoteUndo) return;
    setNotes(prev => [deletedNoteUndo, ...prev]);
    setActiveNoteId(deletedNoteUndo.id);
    setDeletedNoteUndo(null);
    setShowUndoToast(false);
  };

  const handleCreateNotebook = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNotebookName.trim()) return;

    const fresh: Notebook = {
      id: `nb-${Date.now()}`,
      name: newNotebookName.trim(),
      color: newNotebookColor,
      icon: newNotebookIcon
    };

    setNotebooks(prev => [...prev, fresh]);
    setSelectedNotebookId(fresh.id);
    setNewNotebookName('');
    setShowNotebookModal(false);
  };

  // Tag inputs helper
  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const cleaned = tagInput.trim().toLowerCase().replace(/,/g, '');
      if (cleaned && activeNote) {
        if (!activeNote.tags.includes(cleaned)) {
          const updatedTags = [...activeNote.tags, cleaned];
          handleUpdateActiveNote({ tags: updatedTags });
        }
        setTagInput('');
      }
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    if (!activeNote) return;
    const updatedTags = activeNote.tags.filter(t => t !== tagToRemove);
    handleUpdateActiveNote({ tags: updatedTags });
  };

  // Note words and character statistics
  const wordCount = useMemo(() => {
    if (!activeNote?.content) return 0;
    return activeNote.content.split(/\s+/).filter(w => w.length > 0).length;
  }, [activeNote]);

  const charCount = useMemo(() => {
    return activeNote?.content?.length || 0;
  }, [activeNote]);

  // Clean note snippet builder (strips markdown signs for elegant cards listing)
  const getCleanSnippet = (content: string) => {
    const plain = content
      .replace(/^#+\s+/gm, '') // Strip headers
      .replace(/^-+\s*$/gm, '') // Strip divider rules
      .replace(/^[-\*]\s+/gm, '') // Strip list bullet markers
      .replace(/-?\s*\[[ x]\]\s+/g, '') // Strip interactive markdown todos
      .replace(/\*\*|__|_|`/g, '') // Strip text modifiers
      .replace(/>/g, ' ') // Strip blockquotes
      .replace(/\n+/g, ' ') // Flatten lines
      .trim();
    if (plain.length > 90) return plain.substring(0, 90) + '...';
    return plain || 'Empty note content';
  };

  // Safe color mapper for notebook borders/pills
  const getNotebookColorClasses = (colorName: string) => {
    switch (colorName) {
      case 'amber': return 'text-amber-600 bg-amber-50 border-amber-200';
      case 'sky': return 'text-sky-600 bg-sky-50 border-sky-200';
      case 'emerald': return 'text-emerald-600 bg-emerald-50 border-emerald-200';
      case 'indigo': return 'text-indigo-600 bg-indigo-50 border-indigo-200';
      case 'rose': return 'text-rose-600 bg-rose-50 border-rose-200';
      default: return 'text-slate-600 bg-slate-50 border-slate-200';
    }
  };

  const getNotebookBgClass = (colorName: string) => {
    switch (colorName) {
      case 'amber': return 'bg-amber-500';
      case 'sky': return 'bg-sky-500';
      case 'emerald': return 'bg-emerald-500';
      case 'indigo': return 'bg-indigo-500';
      case 'rose': return 'bg-rose-500';
      default: return 'bg-slate-500';
    }
  };

  return (
    <div className="h-screen w-screen bg-[#F8F9FA] font-sans text-gray-900 flex overflow-hidden" id="applet-container">
      
      {/* 1. SIDEBAR: ORGANIZATION & CATEGORIES */}
      {/* On mobile, standard hidden when a specific note is active so note details gets 100% room */}
      <aside 
        className={`w-60 bg-white border-r border-gray-200 flex flex-col shrink-0 md:flex ${
          activeNoteId ? 'hidden' : 'flex'
        }`}
        id="notebook-sidebar"
      >
        <div className="p-5 flex-1 flex flex-col min-h-0 space-y-6">
          {/* Logo Branding section */}
          <div className="flex items-center gap-2.5 mb-1" id="header-logo-section">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold select-none text-base shadow-sm">
              <span>N</span>
            </div>
            <div>
              <h1 className="text-sm font-semibold tracking-tight text-gray-950 font-sans">Noteflow</h1>
              <span className="text-[10px] text-gray-400 font-mono block -mt-0.5">High Density Workspace</span>
            </div>
          </div>
          
          {/* Folder List container */}
          <div className="space-y-1.5" id="notebook-list-container">
            <div className="flex items-center justify-between px-2">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider font-mono">Folders</span>
              <button
                onClick={() => setShowNotebookModal(true)}
                className="text-[10px] font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-0.5 cursor-pointer"
                title="Add Folder"
                id="add-notebook-trigger"
              >
                <Plus className="w-3 h-3" /> Add
              </button>
            </div>

            <nav className="space-y-0.5 max-h-56 overflow-y-auto" id="notebook-nav">
              {notebooks.map((nb) => {
                const count = getNoteCountForNotebook(nb.id);
                const isSelected = selectedNotebookId === nb.id;
                return (
                  <button
                    key={nb.id}
                    onClick={() => {
                      setSelectedNotebookId(nb.id);
                      setSelectedTag(null); // Clear active tag filter when focusing notebook scope
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer ${
                      isSelected 
                        ? 'bg-indigo-50 text-indigo-700' 
                        : 'text-gray-650 hover:bg-gray-50'
                    }`}
                    id={`notebook-btn-${nb.id}`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <span className={`w-2 h-2 rounded-full ring-2 ring-white ${getNotebookBgClass(nb.color)}`} />
                      <span className="truncate">{nb.name}</span>
                    </div>
                    <span className={`text-[10px] font-mono ${isSelected ? 'text-indigo-500 font-bold' : 'text-gray-400'}`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Dynamic tag index filters list */}
          {allCurrentTags.length > 0 && (
            <div className="space-y-1.5" id="tags-sidebar-container">
              <div className="flex items-center justify-between px-2">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider font-mono">Tags Index</span>
                {selectedTag && (
                  <button
                    onClick={() => setSelectedTag(null)}
                    className="text-[9px] font-medium text-indigo-600 hover:text-indigo-800 cursor-pointer"
                    id="clear-tag-filter"
                  >
                    Reset
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-1 px-1 max-h-48 overflow-y-auto" id="tags-cloud">
                {allCurrentTags.map((tag) => {
                  const isSelected = selectedTag === tag;
                  const occurrence = notes.filter(n => n.tags.map(t => t.toLowerCase()).includes(tag)).length;
                  return (
                    <button
                      key={tag}
                      onClick={() => setSelectedTag(isSelected ? null : tag)}
                      className={`text-[10px] font-sans px-2 py-0.5 rounded border transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-indigo-600 border-indigo-600 text-white'
                          : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                      id={`tag-filter-${tag}`}
                    >
                      <span>#{tag}</span>
                      <span className="text-[8px] font-mono opacity-80 ml-0.5">({occurrence})</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Shortcuts helpful callout block */}
          <div className="bg-gray-50 border border-gray-100 p-3.5 rounded-lg space-y-1 hidden md:block shrink-0" id="applet-info-box">
            <h4 className="text-[10px] font-semibold text-gray-700 flex items-center gap-1 uppercase tracking-wider font-mono">
              <Sparkles className="w-3 h-3 text-indigo-500" />
              Keyboard Help
            </h4>
            <p className="text-[10px] text-gray-400 leading-normal">
              Type keywords in tags input and hit <span className="font-bold font-mono">Enter</span> or comma key to add tags immediately.
            </p>
          </div>

        </div>

        {/* User Identity bottom anchor panel */}
        <div className="mt-auto p-4 border-t border-gray-150 bg-white shrink-0" id="sidebar-user-footer">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-indigo-100 border border-indigo-200 flex items-center justify-center text-indigo-700 font-bold text-xs select-none">
              UR
            </div>
            <div className="min-w-0" id="user-profile-meta">
              <p className="text-xs font-semibold text-gray-800 truncate" title="uet200@nyu.edu">uet200@nyu.edu</p>
              <div className="text-[9px] text-emerald-600 font-medium flex items-center gap-1 font-sans">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                <span>Active Workspace</span>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* 2. NOTE LIST: BROWSING FEED */}
      {/* On mobile, hidden when a note is active to optimize vertical room */}
      <section 
        className={`w-full md:w-80 bg-white border-r border-gray-200 flex flex-col shrink-0 md:flex ${
          activeNoteId ? 'hidden' : 'flex'
        }`}
        id="notes-list-sidebar"
      >
        {/* Dynamic header: searches & instant creations */}
        <div className="p-4 border-b border-gray-100 space-y-2.5 bg-white shrink-0" id="notes-feed-header-panel">
          <div className="relative">
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 bg-gray-100 border-none rounded-lg text-xs font-sans focus:ring-2 focus:ring-indigo-500 text-gray-900 placeholder:text-gray-400 focus:outline-hidden"
              id="global-search-input"
            />
            <span className="absolute left-3 top-2.5 text-gray-400">
              <Search className="w-3.5 h-3.5" />
            </span>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-700"
                id="clear-search-button"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <button
            onClick={handleCreateNote}
            className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-medium flex items-center justify-center gap-2 active:scale-98 transition-all shadow-xs cursor-pointer"
            id="create-note-sidebar-btn"
          >
            <Plus className="w-4 h-4" />
            <span>New Note</span>
          </button>
        </div>

        {/* Counts & Sorting parameters bar */}
        <div className="px-4 py-2 bg-gray-50/50 border-b border-gray-100 flex items-center justify-between text-[10px] text-gray-400 font-mono tracking-tight shrink-0" id="notes-feed-subheader">
          <span>{filteredNotes.length === 1 ? '1 NOTE' : `${filteredNotes.length} NOTES`}</span>
          <select
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as any)}
            className="bg-transparent border-none py-0 text-[10px] text-gray-400 hover:text-gray-700 cursor-pointer focus:ring-0 focus:outline-hidden text-right"
            id="sort-select"
          >
            <option value="updated-desc">Latest</option>
            <option value="updated-asc">Oldest</option>
            <option value="title-asc">A to Z</option>
            <option value="title-desc">Z to A</option>
          </select>
        </div>

        {/* Scrollable feed cards stream */}
        <div className="flex-1 overflow-y-auto divide-y divide-gray-50" id="notes-cards-stack">
          {filteredNotes.length === 0 ? (
            <div className="p-8 text-center" id="empty-feed-graphic">
              <NotebookIcon className="w-8 h-8 text-gray-350 mx-auto stroke-1 mb-2 mt-4" />
              <h3 className="text-xs font-medium text-gray-700">No notes found</h3>
              <p className="text-[11px] text-gray-400 leading-normal max-w-[180px] mx-auto mt-0.5">
                Adjust tags lists, change folders or compose a new note.
              </p>
              {(selectedTag || searchQuery || selectedNotebookId !== 'nb-all') && (
                <button
                  onClick={() => {
                    setSelectedTag(null);
                    setSelectedNotebookId('nb-all');
                    setSearchQuery('');
                  }}
                  className="mt-3 text-[10px] text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded hover:bg-indigo-100 font-bold transition-colors cursor-pointer"
                  id="reset-all-filters-btn"
                >
                  Reset all filters
                </button>
              )}
            </div>
          ) : (
            filteredNotes.map((note) => {
              const isSelected = activeNoteId === note.id;
              const nb = notebooks.find(n => n.id === note.notebookId);
              const colorConfig = getNoteColorConfig(note.color);

              return (
                <div
                  key={note.id}
                  onClick={() => setActiveNoteId(note.id)}
                  className={`p-4 text-left border-l-4 cursor-pointer relative transition-all ${
                    isSelected 
                      ? 'bg-indigo-50/20 border-indigo-600' 
                      : 'hover:bg-gray-50 border-transparent'
                  }`}
                  id={`note-card-${note.id}`}
                >
                  <div className="flex justify-between items-start mb-1" id="card-top-row">
                    <h3 className={`text-xs font-semibold truncate ${isSelected ? 'text-gray-950 font-bold' : 'text-gray-900'}`}>
                      {note.title || 'Untitled Note'}
                    </h3>
                    <span className="text-[10px] text-gray-400 whitespace-nowrap pl-2">
                      {new Date(note.updatedAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  
                  <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                    {getCleanSnippet(note.content)}
                  </p>

                  <div className="mt-2.5 flex items-center justify-between gap-2" id="card-meta-row">
                    <div className="flex gap-1 items-center overflow-hidden">
                      {nb && (
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold tracking-wide uppercase ${getNotebookColorClasses(nb.color)}`}>
                          {nb.name}
                        </span>
                      )}
                      {note.isPinned && (
                        <span className="text-amber-500" title="Pinned Note">
                          <Pin className="w-2.5 h-2.5 fill-amber-500" />
                        </span>
                      )}
                    </div>
                    {/* Small color dot indicator representing workspace background style */}
                    <span className={`w-1.5 h-1.5 rounded-full ${colorConfig.accent}`} />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* 3. EDITOR & ACTIVE PREVIEW AREA */}
      {/* On mobile, only display when activeNoteId is selected */}
      <main 
        className={`flex-1 bg-white flex flex-col min-w-0 h-full overflow-hidden ${
          !activeNoteId ? 'hidden md:flex' : 'flex'
        }`}
        id="note-workspace-column"
      >
        {activeNote ? (
          <div className="flex-1 flex flex-col min-h-0" id="active-note-workspace">
            
            {/* Top action header toolbar */}
            <div className="h-14 px-6 border-b border-gray-100 flex items-center justify-between shrink-0 bg-white" id="workspace-top-bar">
              
              {/* Folder Selector and metadata */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setActiveNoteId(null)}
                  className="flex md:hidden items-center justify-center p-1.5 text-gray-500 hover:text-gray-900 bg-gray-100 rounded-lg cursor-pointer"
                  title="Back to lists"
                  id="mobile-back-button"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-1.5" id="notebook-assign-wrapper">
                  <span className="text-[10px] uppercase font-mono font-semibold text-gray-400">Folder</span>
                  <select
                    value={activeNote.notebookId}
                    onChange={(e) => handleUpdateActiveNote({ notebookId: e.target.value })}
                    className="bg-gray-100 border-none font-medium text-gray-700 text-xs px-2.5 py-1 rounded focus:bg-white focus:ring-1 focus:ring-indigo-400 transition-colors cursor-pointer"
                    id="note-notebook-select"
                  >
                    {notebooks
                      .filter(n => n.id !== 'nb-all')
                      .map(n => (
                        <option key={n.id} value={n.id}>
                          {n.name}
                        </option>
                      ))}
                  </select>
                </div>

                <div className="h-4 w-[1px] bg-gray-200" />

                {/* Pin note button */}
                <button
                  onClick={() => handleUpdateActiveNote({ isPinned: !activeNote.isPinned })}
                  className={`p-1 rounded transition-all cursor-pointer ${
                    activeNote.isPinned
                      ? 'bg-amber-50 text-amber-600'
                      : 'text-gray-400 hover:text-gray-650'
                  }`}
                  title={activeNote.isPinned ? 'Unpin' : 'Pin note to top'}
                  id="note-pin-btn"
                >
                  <Pin className={`w-4 h-4 ${activeNote.isPinned ? 'fill-amber-500 stroke-amber-600' : ''}`} />
                </button>
              </div>

              {/* View options, Color choices, Trash item */}
              <div className="flex items-center gap-4">
                {/* Visual Note Color Circle Picker */}
                <div className="hidden sm:flex items-center gap-1 bg-gray-50 p-1 rounded" id="color-picker-palette">
                  {NOTE_COLORS.map(c => {
                    const isSelected = activeNote.color === c.value;
                    return (
                      <button
                        key={c.value}
                        type="button"
                        onClick={() => handleUpdateActiveNote({ color: c.value })}
                        className={`w-3.5 h-3.5 rounded-full ${c.accent} transition-transform hover:scale-110 cursor-pointer flex items-center justify-center relative`}
                        title={c.name}
                      >
                        {isSelected && <span className="w-1.5 h-1.5 bg-white rounded-full" />}
                      </button>
                    );
                  })}
                </div>

                <div className="h-4 w-[1px] bg-gray-200 hidden sm:block" />

                {/* Sub layout toggles */}
                <div className="flex items-center bg-gray-100 p-0.5 rounded-lg border border-gray-200" id="view-mode-tabs">
                  <button
                    onClick={() => setViewMode('edit')}
                    className={`px-2.5 py-1 text-[11px] font-semibold rounded-md flex items-center gap-1 transition-all cursor-pointer ${
                      viewMode === 'edit'
                        ? 'bg-white text-indigo-700 shadow-3xs'
                        : 'text-gray-500 hover:text-gray-800'
                    }`}
                    id="viewmode-edit-btn"
                  >
                    <Edit3 className="w-3 h-3" />
                    <span className="hidden sm:inline">Edit</span>
                  </button>
                  <button
                    onClick={() => setViewMode('preview')}
                    className={`px-2.5 py-1 text-[11px] font-semibold rounded-md flex items-center gap-1 transition-all cursor-pointer ${
                      viewMode === 'preview'
                        ? 'bg-white text-indigo-700 shadow-3xs'
                        : 'text-gray-500 hover:text-gray-800'
                    }`}
                    id="viewmode-preview-btn"
                  >
                    <Eye className="w-3 h-3" />
                    <span className="hidden sm:inline">Preview</span>
                  </button>
                  <button
                    onClick={() => setViewMode('split')}
                    className={`hidden lg:flex px-2.5 py-1 text-[11px] font-semibold rounded-md items-center gap-1 transition-all cursor-pointer ${
                      viewMode === 'split'
                        ? 'bg-white text-indigo-700 shadow-3xs'
                        : 'text-gray-500 hover:text-gray-800'
                    }`}
                    id="viewmode-split-btn"
                  >
                    <Columns className="w-3 h-3" />
                    <span>Split</span>
                  </button>
                </div>

                <div className="h-4 w-[1px] bg-gray-200" />

                {/* Hard delete button */}
                <button
                  onClick={() => handleDeleteNote(activeNote.id)}
                  className="p-1 hover:bg-rose-50 rounded-md text-gray-450 hover:text-rose-600 transition-colors cursor-pointer"
                  title="Delete Note"
                  id="delete-note-btn"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

            </div>

            {/* Note title line block */}
            <div className="px-12 pt-10 pb-4 max-w-3xl mx-auto w-full shrink-0 bg-white" id="writing-title-area">
              <div className="flex items-center gap-2 mb-3 text-xs text-gray-400 font-semibold uppercase tracking-wider font-mono">
                <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded text-[10px]">
                  {notebooks.find(nb => nb.id === activeNote.notebookId)?.name || 'General'}
                </span>
                <span>•</span>
                <span className="font-sans font-medium text-gray-400 flex items-center gap-1.5 Normal">
                  Last edited {new Date(activeNote.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              </div>

              <input
                type="text"
                value={activeNote.title}
                onChange={(e) => handleUpdateActiveNote({ title: e.target.value })}
                className="w-full text-3xl font-bold text-gray-900 border-none p-0 focus:ring-0 placeholder:text-gray-300 focus:outline-hidden font-sans pb-2"
                placeholder="Note Title"
                id="note-title-input"
              />

              {/* Tag creation wrapper */}
              <div className="flex flex-wrap items-center gap-1.5 mt-3 pt-3 border-t border-gray-100" id="note-active-tags-row">
                {activeNote.tags.map(tag => (
                  <span 
                    key={tag} 
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-gray-100 text-gray-600 text-[10px] font-semibold border border-gray-200 transition-colors hover:border-gray-300"
                  >
                    <span>#{tag}</span>
                    <button 
                      onClick={() => handleRemoveTag(tag)} 
                      className="text-gray-400 hover:text-rose-600 ml-1 cursor-pointer"
                      title={`Remove tag #${tag}`}
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </span>
                ))}
                <input
                  type="text"
                  placeholder="+ Add tag..."
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleAddTag}
                  className="border-none text-[10px] focus:outline-hidden focus:ring-0 bg-transparent text-gray-500 w-24 p-0"
                  id="new-tag-input"
                />
              </div>
            </div>

            {/* Editing and preview panel container */}
            <div className="flex-1 overflow-hidden flex bg-white" id="main-text-panels">
              {/* EDIT MODE: TEXTAREA INPUT */}
              {(viewMode === 'edit' || viewMode === 'split') && (
                <div className={`p-12 overflow-y-auto h-full w-full ${viewMode === 'split' ? 'lg:w-1/2 lg:border-r lg:border-gray-150' : ''}`} id="editor-textarea-wrapper">
                  <textarea
                    placeholder="Write markdown here... e.g. # Title, - Checklist, > Custom Quote Blocks"
                    value={activeNote.content}
                    onChange={(e) => handleUpdateActiveNote({ content: e.target.value })}
                    className="w-full h-full resize-none bg-transparent border-none focus:outline-hidden focus:ring-0 text-gray-800 text-sm font-mono leading-relaxed placeholder:text-gray-300"
                    id="note-body-textarea"
                  />
                </div>
              )}

              {/* PREVIEW MODE: PARSED DECORATIONS */}
              {(viewMode === 'preview' || viewMode === 'split') && (
                <div className={`p-12 overflow-y-auto h-full scroll-smooth w-full ${viewMode === 'split' ? 'lg:w-1/2' : ''}`} id="preview-panel-wrapper">
                  <div className="prose prose-indigo max-w-none">
                    <MarkdownPreview 
                      content={activeNote.content} 
                      onContentChange={(newContent) => handleUpdateActiveNote({ content: newContent })}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Note Bottom Status Bar details */}
            <div className="px-12 py-3.5 border-t border-gray-100 bg-gray-50/50 flex justify-between items-center text-xs text-gray-400 font-medium shrink-0" id="active-note-footer">
              <div className="flex gap-6">
                <span>{wordCount} words</span>
                <span>{charCount} characters</span>
              </div>
              <div className="flex items-center gap-1.5 text-emerald-600 font-medium font-sans">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                <span>Synced with local storage</span>
              </div>
            </div>

          </div>
        ) : (
          <div className="flex-1 flex flex-col justify-center items-center text-center p-8 bg-[#F8F9FA]" id="no-active-state-panel">
            <div className="p-6 bg-white border border-gray-150 rounded-xl max-w-sm shadow-3xs text-center" id="empty-state-wrapper">
              <div className="p-3.5 bg-indigo-50 text-indigo-600 rounded-xl w-12 h-12 flex items-center justify-center mx-auto mb-4">
                <PenTool className="w-6 h-6 stroke-1.25" />
              </div>
              <h3 className="text-sm font-bold text-gray-900 tracking-tight">Select or Compose a Note</h3>
              <p className="text-xs text-gray-400 mt-1 leading-normal max-w-[280px] mx-auto">
                Select an existing draft from your folder list or create a clear, high-density note draft instantly.
              </p>
              <button
                onClick={handleCreateNote}
                className="mt-4 w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold py-2.5 px-4 rounded-lg transition-all shadow-sm active:scale-98 flex items-center justify-center gap-1.5 cursor-pointer"
                id="empty-state-create-btn"
              >
                <Plus className="w-4 h-4" />
                <span>Start a New Note</span>
              </button>
            </div>
          </div>
        )}
      </main>

      {/* 3. DYNAMIC TOAST RECOVERY: UNDO ACTION */}
      <AnimatePresence>
        {showUndoToast && deletedNoteUndo && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-5 right-5 z-40 bg-slate-900 text-slate-100 px-4 py-3 rounded-lg shadow-lg border border-slate-800 flex items-center gap-4 text-xs"
            id="undo-toast"
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Note &quot;{deletedNoteUndo.title}&quot; deleted</span>
            </div>
            <button
              onClick={handleRestoreDeletedNote}
              className="text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1 bg-slate-800 px-2.5 py-1 rounded-md cursor-pointer transition-colors"
              id="undo-toast-action"
            >
              <Undo className="w-3.5 h-3.5" />
              <span>Undo</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 4. MODALS & OVERLAYS: NOTEBOOK ADDITION FORM */}
      <AnimatePresence>
        {showNotebookModal && (
          <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-3xs flex items-center justify-center z-50 p-4" id="modal-container-backdrop">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-sm bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200"
              id="new-notebook-modal"
            >
              {/* Modal Head */}
              <div className="p-4 bg-slate-50 border-b border-slate-200/80 flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                  <NotebookIcon className="w-4 h-4 text-indigo-600" />
                  Create Folder
                </h3>
                <button
                  onClick={() => setShowNotebookModal(false)}
                  className="p-1 rounded bg-slate-200/50 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                  id="close-modal-btn"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Form elements */}
              <form onSubmit={handleCreateNotebook} className="p-5 space-y-4">
                
                {/* Note title */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">Folder Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Health & Sport, Recipes..."
                    value={newNotebookName}
                    onChange={(e) => setNewNotebookName(e.target.value)}
                    required
                    maxLength={30}
                    className="w-full bg-slate-50 text-slate-900 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:bg-white focus:outline-hidden focus:border-indigo-400 transition-all font-sans"
                    id="new-notebook-input"
                  />
                </div>

                {/* Notebook accent selection */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono block">Folder Color Theme</label>
                  <div className="flex gap-2">
                    {['amber', 'sky', 'emerald', 'indigo', 'rose'].map((col) => {
                      const isChosen = newNotebookColor === col;
                      return (
                        <button
                          key={col}
                          type="button"
                          onClick={() => setNewNotebookColor(col)}
                          className={`w-6 h-6 rounded-lg ${getNotebookBgClass(col)} hover:scale-105 cursor-pointer relative flex items-center justify-center transition-all`}
                          id={`modal-color-${col}`}
                        >
                          {isChosen && (
                            <span className="w-2 h-2 bg-white rounded-full shadow-xs" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Notebook Symbol Choice */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-550 uppercase tracking-wider font-mono block">Folder Symbol</label>
                  <div className="grid grid-cols-5 gap-2">
                    {[
                      { id: 'Folder', label: 'Folder' },
                      { id: 'Lightbulb', label: 'Ideas' },
                      { id: 'Briefcase', label: 'Job' },
                      { id: 'BookOpen', label: 'Journal' },
                      { id: 'PenTool', label: 'Draft' },
                    ].map((iconObj) => {
                      const isSelected = newNotebookIcon === iconObj.id;
                      return (
                        <button
                          key={iconObj.id}
                          type="button"
                          onClick={() => setNewNotebookIcon(iconObj.id)}
                          className={`p-2 rounded-lg border text-[10px] font-bold flex flex-col items-center justify-center gap-1 select-none cursor-pointer transition-all ${
                            isSelected 
                              ? 'bg-indigo-50 text-indigo-700 border-indigo-300 shadow-2xs' 
                              : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                          }`}
                          title={iconObj.label}
                          id={`modal-icon-${iconObj.id}`}
                        >
                          {getNotebookIcon(iconObj.id)}
                          <span className="text-[8px] tracking-tight">{iconObj.id}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold py-2.5 px-4 rounded-lg transition-all shadow-sm active:scale-98 mt-2 cursor-pointer"
                  id="new-notebook-submit"
                >
                  Confirm & Create Folder
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
