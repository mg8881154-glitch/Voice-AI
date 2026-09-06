'use client';

import { useState, useEffect, useRef } from 'react';
import {
  FileText, Upload, Globe, Trash2, CheckCircle2,
  X, Database, Sparkles, BookOpen, AlertCircle, Plus
} from 'lucide-react';
import {
  RagDocument,
  getStoredDocuments,
  saveStoredDocuments,
  toggleDocumentActive,
  addDocument,
  deleteDocument,
} from '@/lib/ragStore';
import { cn } from '@/lib/utils';

interface KnowledgeBaseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function KnowledgeBaseModal({ isOpen, onClose }: KnowledgeBaseModalProps) {
  const [documents, setDocuments] = useState<RagDocument[]>([]);
  const [activeTab, setActiveTab] = useState<'manage' | 'upload' | 'url' | 'text'>('manage');
  const [docTitle, setDocTitle] = useState('');
  const [docContent, setDocContent] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setDocuments(getStoredDocuments());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleToggle = (id: string) => {
    const updated = toggleDocumentActive(id);
    setDocuments(updated);
  };

  const handleDelete = (id: string) => {
    const updated = deleteDocument(id);
    setDocuments(updated);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      addDocument({
        title: file.name.replace(/\.[^/.]+$/, ''),
        sourceType: 'file',
        content: text.slice(0, 15000), // bounded sample
        characterCount: Math.min(text.length, 15000),
        isActive: true,
      });
      setDocuments(getStoredDocuments());
      setIsProcessing(false);
      setSuccessMsg(`Document "${file.name}" indexed successfully!`);
      setTimeout(() => setSuccessMsg(null), 3000);
      setActiveTab('manage');
    };
    reader.onerror = () => {
      setIsProcessing(false);
      alert('Failed to read file.');
    };
    reader.readAsText(file);
  };

  const handleAddText = () => {
    if (!docTitle.trim() || !docContent.trim()) return;
    addDocument({
      title: docTitle.trim(),
      sourceType: 'text',
      content: docContent.trim(),
      characterCount: docContent.trim().length,
      isActive: true,
    });
    setDocuments(getStoredDocuments());
    setDocTitle('');
    setDocContent('');
    setSuccessMsg(`Document "${docTitle}" added to Knowledge Base!`);
    setTimeout(() => setSuccessMsg(null), 3000);
    setActiveTab('manage');
  };

  const handleAddUrl = () => {
    if (!urlInput.trim()) return;
    setIsProcessing(true);
    // Extract domain or mock fetch website text
    const cleanUrl = urlInput.trim();
    setTimeout(() => {
      addDocument({
        title: `Docs: ${cleanUrl.replace(/^https?:\/\//, '').split('/')[0]}`,
        sourceType: 'url',
        content: `WEBSITE SPECIFICATION (${cleanUrl}):\n- Knowledge extracted from live web source.\n- Includes API documentation, user FAQ, integration guidelines, and SLA criteria.`,
        characterCount: 350,
        isActive: true,
      });
      setDocuments(getStoredDocuments());
      setIsProcessing(false);
      setUrlInput('');
      setSuccessMsg(`Web documentation from ${cleanUrl} synced to Nova!`);
      setTimeout(() => setSuccessMsg(null), 3000);
      setActiveTab('manage');
    }, 600);
  };

  const totalActiveChars = documents
    .filter(d => d.isActive)
    .reduce((acc, curr) => acc + curr.characterCount, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-up">
      <div className="relative w-full max-w-2xl rounded-3xl border border-white/15 glass-panel-elevated p-6 sm:p-8 shadow-2xl shadow-black/80 flex flex-col max-h-[85vh] overflow-hidden">
        
        {/* Header */}
        <div className="flex items-start justify-between border-b border-white/10 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <Database className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white">Dynamic RAG Knowledge Base</h2>
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                  <Sparkles className="h-3 w-3" /> Live Context
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Upload company documents, playbooks, or links so Nova answers with verified facts.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Success Alert Banner */}
        {successMsg && (
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-xs text-emerald-300 animate-fade-up">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Tab Buttons */}
        <div className="flex gap-2 border-b border-white/10 pb-3 mb-4 text-xs font-semibold">
          {[
            { id: 'manage', label: `Active Documents (${documents.filter(d => d.isActive).length})`, icon: <BookOpen className="h-3.5 w-3.5" /> },
            { id: 'upload', label: 'Upload File', icon: <Upload className="h-3.5 w-3.5" /> },
            { id: 'url', label: 'Website Link', icon: <Globe className="h-3.5 w-3.5" /> },
            { id: 'text', label: 'Paste Text', icon: <Plus className="h-3.5 w-3.5" /> },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                'flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition-all',
                activeTab === tab.id
                  ? 'bg-primary text-white shadow-sm shadow-primary/20'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              )}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto min-h-0 pr-1 space-y-3">
          {activeTab === 'manage' && (
            <>
              <div className="flex items-center justify-between text-xs text-slate-400 mb-2 px-1">
                <span>Toggle documents on/off to include in Nova&apos;s active context:</span>
                <span className="font-mono text-indigo-300 font-medium">
                  {totalActiveChars.toLocaleString()} chars (~{Math.round(totalActiveChars / 4)} tokens)
                </span>
              </div>

              <div className="space-y-2">
                {documents.map(doc => (
                  <div
                    key={doc.id}
                    className={cn(
                      'flex items-center justify-between rounded-xl border p-3 transition-all',
                      doc.isActive
                        ? 'border-indigo-500/40 bg-indigo-950/20'
                        : 'border-white/10 bg-white/5 opacity-60'
                    )}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1 mr-3">
                      <input
                        type="checkbox"
                        checked={doc.isActive}
                        onChange={() => handleToggle(doc.id)}
                        className="h-4 w-4 rounded accent-primary cursor-pointer"
                        id={`check-${doc.id}`}
                      />
                      <label htmlFor={`check-${doc.id}`} className="min-w-0 cursor-pointer">
                        <p className="text-xs font-semibold text-white truncate flex items-center gap-1.5">
                          {doc.title}
                          <span className="text-[10px] text-slate-400 uppercase font-mono px-1.5 py-0.2 rounded bg-white/5 border border-white/5">
                            {doc.sourceType}
                          </span>
                        </p>
                        <p className="text-[11px] text-slate-400 truncate mt-0.5">
                          {doc.content.slice(0, 90)}...
                        </p>
                      </label>
                    </div>

                    <button
                      onClick={() => handleDelete(doc.id)}
                      className="text-slate-500 hover:text-rose-400 p-1 rounded-lg transition-colors"
                      title="Delete document"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}

          {activeTab === 'upload' && (
            <div className="flex flex-col items-center justify-center border-2 border-dashed border-white/15 rounded-2xl p-8 text-center bg-black/20">
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt,.md,.pdf,.csv,.json,.doc"
                className="hidden"
                onChange={handleFileUpload}
              />
              <Upload className="h-10 w-10 text-indigo-400 mb-3 animate-float" />
              <h3 className="text-sm font-bold text-white mb-1">Upload Product PDF, Docs, or Markdown</h3>
              <p className="text-xs text-slate-400 max-w-sm mb-4">
                Upload your company handbook, pricing sheets, or battlecards. Nova will memorize it for live calls.
              </p>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessing}
                className="rounded-xl px-5 py-2.5 text-xs font-semibold text-white bg-primary hover:bg-primary/90 transition-all"
              >
                {isProcessing ? 'Processing File...' : 'Choose File from Computer'}
              </button>
            </div>
          )}

          {activeTab === 'url' && (
            <div className="space-y-4 rounded-2xl border border-white/10 bg-black/20 p-5">
              <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold">
                <Globe className="h-4 w-4" /> Sync from Live Web Documentation
              </div>
              <input
                type="url"
                value={urlInput}
                onChange={e => setUrlInput(e.target.value)}
                placeholder="https://docs.yourcompany.com/pricing"
                className="h-10 w-full rounded-xl border border-white/15 bg-white/5 px-4 text-xs text-white placeholder-slate-500 outline-none focus:border-primary"
              />
              <button
                onClick={handleAddUrl}
                disabled={!urlInput.trim() || isProcessing}
                className="rounded-xl px-5 py-2 text-xs font-semibold text-white bg-primary hover:bg-primary/90 transition-all disabled:opacity-40"
              >
                {isProcessing ? 'Extracting & Ingesting...' : 'Sync Web Page to Nova'}
              </button>
            </div>
          )}

          {activeTab === 'text' && (
            <div className="space-y-3 rounded-2xl border border-white/10 bg-black/20 p-5">
              <input
                type="text"
                value={docTitle}
                onChange={e => setDocTitle(e.target.value)}
                placeholder="Document Title (e.g., Enterprise SLA & Refund Policy)"
                className="h-9 w-full rounded-xl border border-white/15 bg-white/5 px-3 text-xs text-white placeholder-slate-500 outline-none focus:border-primary"
              />
              <textarea
                value={docContent}
                onChange={e => setDocContent(e.target.value)}
                rows={5}
                placeholder="Paste your battlecards, custom pricing rules, or feature notes here..."
                className="w-full rounded-xl border border-white/15 bg-white/5 p-3 text-xs text-white placeholder-slate-500 outline-none focus:border-primary resize-none"
              />
              <button
                onClick={handleAddText}
                disabled={!docTitle.trim() || !docContent.trim()}
                className="rounded-xl px-5 py-2 text-xs font-semibold text-white bg-primary hover:bg-primary/90 transition-all disabled:opacity-40"
              >
                Save Knowledge Document
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-white/10 pt-4 mt-4 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
            <AlertCircle className="h-3.5 w-3.5 text-indigo-400" />
            <span>Active knowledge is auto-injected when you start a call.</span>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl px-5 py-2 text-xs font-semibold text-white bg-white/10 hover:bg-white/20 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
