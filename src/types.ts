/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Note {
  id: string;
  title: string;
  content: string;
  notebookId: string;
  tags: string[];
  isPinned: boolean;
  color: string; // Tailwind color class name (e.g. 'rose', 'amber', 'emerald', 'sky', 'indigo', 'slate')
  createdAt: number;
  updatedAt: number;
}

export interface Notebook {
  id: string;
  name: string;
  color: string; // Tailwind class color configuration
  icon: string; // Name of Lucide icon to use
}

export type ViewMode = 'edit' | 'preview' | 'split';
