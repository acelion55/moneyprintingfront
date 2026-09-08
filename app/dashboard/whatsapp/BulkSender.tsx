'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import {
  Upload, Users, Clock, Send, Plus, Trash2, Image as ImageIcon,
  List, ToggleLeft, Type, X, Play,
  Pause, CheckCircle2, AlertCircle, Loader2, FileSpreadsheet,
  FileText, Eye, EyeOff, Phone, User, Download
} from 'lucide-react';
import { toast } from 'sonner';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Contact {
  id: string;
  name: string;
  phone: string;
  status: 'pending' | 'sending' | 'sent' | 'failed';
}

type BlockType = 'text' | 'image' | 'options' | 'list';

interface TextBlock   { id: string; type: 'text';    content: string }
interface ImageBlock  { id: string; type: 'image';   cloudinaryUrl: string; fileName: string; caption: string; uploading?: boolean }
interface OptionsBlock{ id: string; type: 'options'; body: string; buttons: string[] }
interface ListBlock   { id: string; type: 'list';    header: string; items: string[] }
type MessageBlock = TextBlock | ImageBlock | OptionsBlock | ListBlock;

// ─── Small helpers ────────────────────────────────────────────────────────────

function uid() { return Math.random().toString(36).slice(2, 10); }

function StatusBadge({ status }: { status: Contact['status'] }) {
  const map = {
    pending: { cls: 'bg-gray-500/20 text-gray-400', icon: <Clock className="w-3 h-3" /> },
    sending: { cls: 'bg-yellow-500/20 text-yellow-300', icon: <Loader2 className="w-3 h-3 animate-spin" /> },
    sent:    { cls: 'bg-emerald-500/20 text-emerald-300', icon: <CheckCircle2 className="w-3 h-3" /> },
    failed:  { cls: 'bg-red-500/20 text-red-400', icon: <AlertCircle className="w-3 h-3" /> },
  };
  const { cls, icon } = map[status];
  return (
    <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize ${cls}`}>
      {icon}{status}
    </span>
  );
}

// ─── Block Editor Components ──────────────────────────────────────────────────

function TextBlockEditor({ block, onChange, onRemove }: {
  block: TextBlock; onChange: (b: TextBlock) => void; onRemove: () => void
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-semibold text-purple-400 uppercase">
          <Type className="w-3.5 h-3.5" /> Text Block
        </div>
        <button onClick={onRemove} className="text-gray-500 hover:text-red-400 p-1 rounded">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
      <textarea
        rows={3}
        value={block.content}
        onChange={e => onChange({ ...block, content: e.target.value })}
        placeholder="Type your message here... Use {{name}} to personalize"
        className="w-full px-3 py-2 rounded-lg bg-black/50 border border-white/10 text-white text-sm focus:outline-none focus:border-purple-500 resize-none"
      />
    </div>
  );
}

function ImageBlockEditor({ block, onChange, onRemove }: {
  block: ImageBlock; onChange: (b: ImageBlock) => void; onRemove: () => void
}) {
  const imgInputRef = useRef<HTMLInputElement>(null);
  const [imgDragging, setImgDragging] = useState(false);

  async function handleImageFile(file: File) {
    if (!file.type.startsWith('image/')) { toast.error('Only image files are allowed'); return; }
    if (file.size > 10 * 1024 * 1024) { toast.error('Max image size is 10MB'); return; }

    // Show uploading state immediately
    onChange({ ...block, uploading: true, fileName: file.name, cloudinaryUrl: '' });

    try {
      const fd = new FormData();
      fd.append('file', file);

      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Upload failed');

      onChange({ ...block, cloudinaryUrl: data.url, fileName: file.name, uploading: false });
      toast.success('Image uploaded to Cloudinary ✓');
    } catch (err: any) {
      onChange({ ...block, uploading: false, fileName: '', cloudinaryUrl: '' });
      toast.error(err.message || 'Upload failed');
    }
  }

  function handleImgDrop(e: React.DragEvent) {
    e.preventDefault();
    setImgDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleImageFile(file);
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-semibold text-blue-400 uppercase">
          <ImageIcon className="w-3.5 h-3.5" /> Image Block
        </div>
        <button onClick={onRemove} className="text-gray-500 hover:text-red-400 p-1 rounded">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Upload area */}
      {!block.cloudinaryUrl && !block.uploading ? (
        <div
          onDragOver={e => { e.preventDefault(); setImgDragging(true); }}
          onDragLeave={() => setImgDragging(false)}
          onDrop={handleImgDrop}
          onClick={() => imgInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all ${
            imgDragging
              ? 'border-blue-500/70 bg-blue-500/8'
              : 'border-white/10 hover:border-blue-500/40 hover:bg-blue-500/5 bg-black/20'
          }`}
        >
          <ImageIcon className="w-8 h-8 text-blue-400/60 mx-auto mb-2" />
          <p className="text-xs text-gray-400">
            {imgDragging ? '📎 Drop image here!' : 'Drag & drop or click to upload'}
          </p>
          <p className="text-[10px] text-gray-600 mt-1">JPG, PNG, GIF, WEBP · Max 10MB</p>
          <input
            ref={imgInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) handleImageFile(f); e.target.value = ''; }}
          />
        </div>
      ) : block.uploading ? (
        /* Uploading spinner */
        <div className="border-2 border-dashed border-blue-500/40 rounded-xl p-6 flex flex-col items-center gap-3 bg-blue-500/5">
          <Loader2 className="w-7 h-7 text-blue-400 animate-spin" />
          <p className="text-xs text-blue-300">Uploading to Cloudinary…</p>
          <p className="text-[10px] text-gray-500 truncate max-w-full">{block.fileName}</p>
        </div>
      ) : (
        /* Uploaded preview */
        <div className="relative rounded-xl overflow-hidden border border-blue-500/30 bg-black/30 group">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={block.cloudinaryUrl} alt="preview" className="w-full max-h-44 object-cover" />
          {/* Hover overlay */}
          <div className="absolute inset-0 bg-black/55 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
            <button
              onClick={() => imgInputRef.current?.click()}
              className="px-3 py-1.5 rounded-lg bg-blue-600/80 hover:bg-blue-500 text-white text-xs font-medium flex items-center gap-1.5"
            >
              <Upload className="w-3 h-3" /> Change
            </button>
            <button
              onClick={() => onChange({ ...block, cloudinaryUrl: '', fileName: '' })}
              className="px-3 py-1.5 rounded-lg bg-red-600/80 hover:bg-red-500 text-white text-xs font-medium flex items-center gap-1.5"
            >
              <Trash2 className="w-3 h-3" /> Remove
            </button>
          </div>
          <input
            ref={imgInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) handleImageFile(f); e.target.value = ''; }}
          />
        </div>
      )}

      {/* Cloudinary badge */}
      {block.cloudinaryUrl && (
        <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20">
          <CheckCircle2 className="w-3 h-3 text-emerald-400 flex-shrink-0" />
          <span className="text-[11px] text-blue-300 truncate flex-1">{block.fileName}</span>
          <span className="text-[10px] text-emerald-400 font-medium flex-shrink-0">Cloudinary ✓</span>
        </div>
      )}

      {/* Caption */}
      <input
        value={block.caption}
        onChange={e => onChange({ ...block, caption: e.target.value })}
        placeholder="Caption (optional)"
        className="w-full px-3 py-2 rounded-lg bg-black/50 border border-white/10 text-white text-sm focus:outline-none focus:border-blue-500"
      />
    </div>
  );
}

function OptionsBlockEditor({ block, onChange, onRemove }: {
  block: OptionsBlock; onChange: (b: OptionsBlock) => void; onRemove: () => void
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 uppercase">
          <ToggleLeft className="w-3.5 h-3.5" /> Quick Reply Buttons
        </div>
        <button onClick={onRemove} className="text-gray-500 hover:text-red-400 p-1 rounded">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
      <textarea
        rows={2}
        value={block.body}
        onChange={e => onChange({ ...block, body: e.target.value })}
        placeholder="Message body before the buttons..."
        className="w-full px-3 py-2 rounded-lg bg-black/50 border border-white/10 text-white text-sm focus:outline-none focus:border-emerald-500 resize-none"
      />
      <div className="space-y-1">
        {block.buttons.map((btn, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              value={btn}
              onChange={e => {
                const btns = [...block.buttons];
                btns[i] = e.target.value;
                onChange({ ...block, buttons: btns });
              }}
              placeholder={`Button ${i + 1} label`}
              className="flex-1 px-3 py-1.5 rounded-lg bg-black/50 border border-white/10 text-white text-sm focus:outline-none focus:border-emerald-500"
            />
            {block.buttons.length > 1 && (
              <button onClick={() => onChange({ ...block, buttons: block.buttons.filter((_, j) => j !== i) })}
                className="text-gray-500 hover:text-red-400">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        ))}
        {block.buttons.length < 3 && (
          <button onClick={() => onChange({ ...block, buttons: [...block.buttons, ''] })}
            className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 px-2 py-1">
            <Plus className="w-3 h-3" /> Add Button (max 3)
          </button>
        )}
      </div>
    </div>
  );
}

function ListBlockEditor({ block, onChange, onRemove }: {
  block: ListBlock; onChange: (b: ListBlock) => void; onRemove: () => void
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-semibold text-orange-400 uppercase">
          <List className="w-3.5 h-3.5" /> List Message
        </div>
        <button onClick={onRemove} className="text-gray-500 hover:text-red-400 p-1 rounded">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
      <input
        value={block.header}
        onChange={e => onChange({ ...block, header: e.target.value })}
        placeholder="List header / title"
        className="w-full px-3 py-2 rounded-lg bg-black/50 border border-white/10 text-white text-sm focus:outline-none focus:border-orange-500"
      />
      <div className="space-y-1">
        {block.items.map((item, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="text-xs text-gray-500 w-5 text-right font-mono">{i + 1}.</span>
            <input
              value={item}
              onChange={e => {
                const items = [...block.items];
                items[i] = e.target.value;
                onChange({ ...block, items });
              }}
              placeholder={`Item ${i + 1}`}
              className="flex-1 px-3 py-1.5 rounded-lg bg-black/50 border border-white/10 text-white text-sm focus:outline-none focus:border-orange-500"
            />
            {block.items.length > 1 && (
              <button onClick={() => onChange({ ...block, items: block.items.filter((_, j) => j !== i) })}
                className="text-gray-500 hover:text-red-400">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        ))}
        <button onClick={() => onChange({ ...block, items: [...block.items, ''] })}
          className="flex items-center gap-1 text-xs text-orange-400 hover:text-orange-300 px-2 py-1">
          <Plus className="w-3 h-3" /> Add Item
        </button>
      </div>
    </div>
  );
}

// ─── Message Preview ──────────────────────────────────────────────────────────

function MessagePreview({ blocks }: { blocks: MessageBlock[] }) {
  if (blocks.length === 0) return (
    <div className="flex flex-col items-center justify-center h-32 text-gray-600 text-sm gap-2">
      <Eye className="w-6 h-6" />
      Preview will appear here
    </div>
  );

  return (
    <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
      {blocks.map(block => {
        if (block.type === 'text') return (
          <div key={block.id} className="bg-[#1a3a2a] rounded-2xl rounded-tl-sm px-4 py-2.5 text-sm text-white max-w-[85%] shadow">
            {block.content || <span className="text-gray-500 italic">Empty text...</span>}
          </div>
        );
        if (block.type === 'image') return (
          <div key={block.id} className="bg-[#1a3a2a] rounded-2xl rounded-tl-sm overflow-hidden max-w-[85%] shadow">
            {block.cloudinaryUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={block.cloudinaryUrl} alt="img" className="w-full max-h-40 object-cover" />
            ) : block.uploading ? (
              <div className="h-20 flex items-center justify-center text-blue-400 text-xs bg-black/30 gap-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Uploading…
              </div>
            ) : (
              <div className="h-20 flex items-center justify-center text-gray-500 text-xs bg-black/30 gap-2">
                <ImageIcon className="w-4 h-4" /> No image selected
              </div>
            )}
            {block.caption && <div className="px-3 py-2 text-xs text-gray-300">{block.caption}</div>}
          </div>
        );
        if (block.type === 'options') return (
          <div key={block.id} className="space-y-1 max-w-[85%]">
            <div className="bg-[#1a3a2a] rounded-2xl rounded-tl-sm px-4 py-2.5 text-sm text-white shadow">
              {block.body || <span className="text-gray-500 italic">Empty body...</span>}
            </div>
            <div className="flex flex-wrap gap-1.5 pl-1">
              {block.buttons.filter(Boolean).map((b, i) => (
                <div key={i} className="px-3 py-1 rounded-full border border-emerald-500/50 text-emerald-300 text-xs bg-emerald-500/10">{b}</div>
              ))}
            </div>
          </div>
        );
        if (block.type === 'list') return (
          <div key={block.id} className="bg-[#1a3a2a] rounded-2xl rounded-tl-sm px-4 py-2.5 max-w-[85%] shadow space-y-1">
            {block.header && <div className="text-sm font-semibold text-white border-b border-white/10 pb-1">{block.header}</div>}
            {block.items.filter(Boolean).map((item, i) => (
              <div key={i} className="flex items-center gap-2 text-sm text-gray-300">
                <span className="text-orange-400 text-xs font-mono">{i + 1}.</span>{item}
              </div>
            ))}
          </div>
        );
        return null;
      })}
      <div className="text-right text-[10px] text-gray-600 pr-1">✓✓ Delivered</div>
    </div>
  );
}

import { api } from '@/lib/api';

// ─── Main Component ───────────────────────────────────────────────────────────

export default function BulkSender() {
  // Contacts
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Delay
  const [delaySeconds, setDelaySeconds] = useState(3);

  // Message blocks
  const [blocks, setBlocks] = useState<MessageBlock[]>([
    { id: uid(), type: 'text', content: '' }
  ]);
  const [showPreview, setShowPreview] = useState(true);

  // Campaign state
  const [isSending, setIsSending] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const pauseRef = useRef(false);
  const stopRef = useRef(false);

  // Available templates from backend
  const [availableTemplates, setAvailableTemplates] = useState<any[]>([]);

  // Fetch contacts and templates on mount from MongoDB backend
  useEffect(() => {
    async function loadData() {
      try {
        setLoadingContacts(true);
        const [contactsRes, tplRes] = await Promise.allSettled([
          api.get('/whatsapp/contacts'),
          api.get('/whatsapp/templates'),
        ]);

        if (contactsRes.status === 'fulfilled' && contactsRes.value.data && Array.isArray(contactsRes.value.data)) {
          const loaded: Contact[] = contactsRes.value.data.map((c: any) => ({
            id: c._id || uid(),
            name: c.name || 'Unknown',
            phone: c.phone,
            status: 'pending' as const
          }));
          setContacts(loaded);
        }

        if (tplRes.status === 'fulfilled' && tplRes.value.data && Array.isArray(tplRes.value.data)) {
          setAvailableTemplates(tplRes.value.data);
        }
      } catch (err) {
        console.error('Failed to load initial data:', err);
      } finally {
        setLoadingContacts(false);
      }
    }
    loadData();
  }, []);

  // Helper to persist contacts to backend MongoDB
  async function persistContactsToDb(newContacts: Omit<Contact, 'id' | 'status'>[]) {
    try {
      await api.post('/whatsapp/contacts', { contacts: newContacts });
    } catch (err) {
      console.error('Failed to persist contacts to MongoDB:', err);
      toast.error('Failed to save contacts to server database');
    }
  }

  async function handleDeleteContact(phone: string) {
    setContacts(prev => prev.filter(c => c.phone !== phone));
    try {
      await api.delete(`/whatsapp/contacts?phone=${encodeURIComponent(phone)}`);
      toast.success('Contact deleted');
    } catch (err) {
      console.error('Failed to delete contact:', err);
    }
  }

  async function handleClearAllContacts() {
    setContacts([]);
    try {
      await api.delete('/whatsapp/contacts');
      toast.success('Cleared all contacts');
    } catch (err) {
      console.error('Failed to clear contacts:', err);
    }
  }


  // ── Contact CSV/Excel parsing ──────────────────────────────────────────────

  // Find column key by aliases (fully case-insensitive + trim)
  function findKey(row: Record<string, unknown>, aliases: string[]): string | undefined {
    return Object.keys(row).find(k => aliases.includes(k.toLowerCase().trim()));
  }

  // Convert any cell value to string cleanly
  function cellStr(val: unknown): string {
    if (val === null || val === undefined) return '';
    return String(val).trim();
  }

  function buildContact(
    row: Record<string, unknown>,
    idx: number
  ): Omit<Contact, 'id' | 'status'> | null {
    const NAME_ALIASES  = ['name', 'nombre', 'contact', 'customer', 'full name', 'fullname', 'client'];
    const PHONE_ALIASES = ['phone', 'number', 'mobile', 'whatsapp', 'phone number', 'mobile number',
                           'contact number', 'cell', 'telephone', 'tel', 'ph no', 'mob no', 'mob'];

    const allKeys = Object.keys(row);

    let nameKey  = findKey(row, NAME_ALIASES);
    let phoneKey = findKey(row, PHONE_ALIASES);

    if (!nameKey)  nameKey  = allKeys.find(k => k.toLowerCase().includes('name'));
    if (!phoneKey) phoneKey = allKeys.find(k =>
      k.toLowerCase().includes('phone') ||
      k.toLowerCase().includes('mobile') ||
      k.toLowerCase().includes('number'));

    const name  = cellStr(nameKey  ? row[nameKey]  : row[allKeys[0]]) || 'Unknown';
    const phone = cellStr(phoneKey ? row[phoneKey] : row[allKeys[1]]);

    console.log(`[Row ${idx}]`, {
      columns: allKeys,
      name_col: nameKey ?? `fallback→${allKeys[0]}`,
      phone_col: phoneKey ?? `fallback→${allKeys[1]}`,
      name, phone,
      skipped: !phone,
    });

    if (!phone) return null;
    return { name, phone };
  }

  const parseFile = useCallback((file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase();

    if (ext === 'csv' || ext === 'txt') {
      Papa.parse<Record<string, unknown>>(file, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: false,
        complete: (results) => {
          const rawRows = results.data as Record<string, unknown>[];
          console.group(`📂 CSV Import: ${file.name}`);
          console.log('Total raw rows:', rawRows.length);
          console.log('Detected columns:', rawRows[0] ? Object.keys(rawRows[0]) : 'none');

          const parsed = rawRows
            .map((row, i) => buildContact(row, i))
            .filter((c): c is Omit<Contact, 'id' | 'status'> => c !== null)
            .map(c => ({ ...c, id: uid(), status: 'pending' as const }));

          console.log('Successfully parsed:', parsed.length, '/', rawRows.length);
          console.log('Parsed contacts:', parsed);
          console.groupEnd();

          if (parsed.length === 0) {
            toast.error('No valid contacts found. Open F12 Console for details.');
            return;
          }
          setContacts(prev => {
            const existing = new Set(prev.map(c => c.phone));
            const fresh = parsed.filter(c => !existing.has(c.phone));
            if (fresh.length < parsed.length)
              toast(`${parsed.length - fresh.length} duplicate numbers skipped`);
            return [...prev, ...fresh];
          });
          persistContactsToDb(parsed.map(c => ({ name: c.name, phone: c.phone })));
          toast.success(`Imported & Saved ${parsed.length} contacts`);
        },
        error: (err) => {
          console.error('CSV parse error:', err);
          toast.error('Failed to parse CSV file');
        },
      });
    } else if (['xlsx', 'xls', 'ods'].includes(ext || '')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const wb = XLSX.read(data, { type: 'array' });
          const ws = wb.Sheets[wb.SheetNames[0]];
          const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: '', raw: false });

          console.group(`📊 Excel Import: ${file.name}`);
          console.log('Sheet:', wb.SheetNames[0]);
          console.log('Total rows:', rows.length);
          console.log('Detected columns:', rows[0] ? Object.keys(rows[0]) : 'none');

          const parsed = rows
            .map((row, i) => buildContact(row, i))
            .filter((c): c is Omit<Contact, 'id' | 'status'> => c !== null)
            .map(c => ({ ...c, id: uid(), status: 'pending' as const }));

          console.log('Successfully parsed:', parsed.length, '/', rows.length);
          console.log('Parsed contacts:', parsed);
          console.groupEnd();

          if (parsed.length === 0) {
            toast.error('No valid contacts found. Open F12 Console for details.');
            return;
          }
          setContacts(prev => {
            const existing = new Set(prev.map(c => c.phone));
            const fresh = parsed.filter(c => !existing.has(c.phone));
            if (fresh.length < parsed.length)
              toast(`${parsed.length - fresh.length} duplicate numbers skipped`);
            return [...prev, ...fresh];
          });
          persistContactsToDb(parsed.map(c => ({ name: c.name, phone: c.phone })));
          toast.success(`Imported & Saved ${parsed.length} contacts`);
        } catch (err) {
          console.error('Excel parse error:', err);
          toast.error('Failed to parse Excel file');
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      toast.error('Unsupported file type. Use .csv or .xlsx');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) parseFile(file);
  }, [parseFile]);

  // ── Block management ───────────────────────────────────────────────────────

  function addBlock(type: BlockType) {
    const base = { id: uid() };
    const newBlock: MessageBlock = type === 'text'    ? { ...base, type: 'text',    content: '' }
      : type === 'image'   ? { ...base, type: 'image',   cloudinaryUrl: '', fileName: '', caption: '' }
      : type === 'options' ? { ...base, type: 'options', body: '', buttons: [''] }
      :                      { ...base, type: 'list',    header: '', items: [''] };
    setBlocks(prev => [...prev, newBlock]);
  }

  function updateBlock(id: string, b: MessageBlock) {
    setBlocks(prev => prev.map(x => x.id === id ? b : x));
  }

  function removeBlock(id: string) {
    setBlocks(prev => prev.filter(x => x.id !== id));
  }

  // ── Build flat message text from blocks (for simulation) ──────────────────

  function buildMessageText(contactName: string): string {
    return blocks.map(b => {
      const personalise = (s: string) => s.replace(/\{\{name\}\}/gi, contactName);
      if (b.type === 'text')    return personalise(b.content);
      if (b.type === 'image')   return `[IMAGE: ${(b as ImageBlock).cloudinaryUrl || (b as ImageBlock).fileName || 'uploaded'}]${b.caption ? ' ' + b.caption : ''}`;
      if (b.type === 'options') return `${personalise(b.body)}\n${b.buttons.filter(Boolean).map((x,i) => `[${i+1}] ${x}`).join(' | ')}`;
      if (b.type === 'list')    return `**${b.header}**\n${b.items.filter(Boolean).map((x,i) => `${i+1}. ${x}`).join('\n')}`;
      return '';
    }).filter(Boolean).join('\n\n');
  }

  // ── Simulate send campaign ─────────────────────────────────────────────────

  async function startCampaign() {
    if (contacts.length === 0) { toast.error('Upload contacts first'); return; }
    if (blocks.length === 0 || blocks.every(b => b.type === 'text' && !(b as TextBlock).content.trim())) {
      toast.error('Build your message first'); return;
    }

    // Extract message content and first image URL if present
    const textBlocks = blocks.filter(b => b.type === 'text') as TextBlock[];
    const imageBlock = blocks.find(b => b.type === 'image') as ImageBlock | undefined;
    
    const baseMessage = textBlocks.map(b => b.content).filter(Boolean).join('\n\n');
    const imageUrl = imageBlock?.cloudinaryUrl || undefined;

    setIsSending(true);
    stopRef.current = false;
    pauseRef.current = false;

    // Reset all to pending
    setContacts(prev => prev.map(c => ({ ...c, status: 'pending' })));

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < contacts.length; i++) {
      if (stopRef.current) break;

      // Wait while paused
      while (pauseRef.current) {
        await new Promise(r => setTimeout(r, 500));
        if (stopRef.current) break;
      }
      if (stopRef.current) break;

      const contact = contacts[i];
      setContacts(prev => prev.map(c => c.id === contact.id ? { ...c, status: 'sending' } : c));

      // Personalize text if {{name}} variable is present
      const personalizedMessage = baseMessage ? baseMessage.replace(/\{\{name\}\}/gi, contact.name || 'Friend') : (imageBlock?.caption || 'Hello!');

      try {
        const res = await api.post('/whatsapp/send-message', {
          recipientPhone: contact.phone,
          messageText: personalizedMessage,
          imageUrl: imageUrl,
        });

        if (res.data && res.data.success) {
          setContacts(prev => prev.map(c => c.id === contact.id ? { ...c, status: 'sent' } : c));
          successCount++;
        } else {
          console.error(`Failed to send to ${contact.phone}:`, res.data?.message);
          setContacts(prev => prev.map(c => c.id === contact.id ? { ...c, status: 'failed' } : c));
          failCount++;
        }
      } catch (err: any) {
        console.error(`Error sending to ${contact.phone}:`, err?.response?.data?.message || err.message);
        setContacts(prev => prev.map(c => c.id === contact.id ? { ...c, status: 'failed' } : c));
        failCount++;
      }

      // Delay between messages (skip on last)
      if (i < contacts.length - 1 && !stopRef.current) {
        await new Promise(r => setTimeout(r, delaySeconds * 1000));
      }
    }

    setIsSending(false);
    setIsPaused(false);
    if (failCount > 0 && successCount === 0) {
      toast.error('Campaign failed. Make sure WhatsApp API Key & Phone Number ID are set by Admin.');
    } else {
      toast.success(`Campaign completed! Sent: ${successCount}, Failed: ${failCount}`);
    }
  }

  function togglePause() {
    const newPaused = !isPaused;
    setIsPaused(newPaused);
    pauseRef.current = newPaused;
    toast(newPaused ? 'Campaign paused' : 'Campaign resumed');
  }

  function stopCampaign() {
    stopRef.current = true;
    pauseRef.current = false;
    setIsSending(false);
    setIsPaused(false);
    toast('Campaign stopped');
  }

  // ── Stats ──────────────────────────────────────────────────────────────────
  const sent    = contacts.filter(c => c.status === 'sent').length;
  const failed  = contacts.filter(c => c.status === 'failed').length;
  const pending = contacts.filter(c => c.status === 'pending').length;
  const sending = contacts.filter(c => c.status === 'sending').length;

  // ── Download Excel template ────────────────────────────────────────────────
  function downloadTemplate() {
    const ws = XLSX.utils.aoa_to_sheet([
      ['name', 'phone'],
      ['John Doe', '919876543210'],
      ['Jane Smith', '918765432109'],
      ['Rahul Kumar', '917654321098'],
    ]);
    // Column widths
    ws['!cols'] = [{ wch: 20 }, { wch: 18 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Contacts');
    XLSX.writeFile(wb, 'contacts_template.xlsx');
  }

  // ── Block type picker styles ───────────────────────────────────────────────
  const blockTypes: { type: BlockType; label: string; icon: React.ReactNode; cls: string }[] = [
    { type: 'text',    label: 'Text',    icon: <Type className="w-4 h-4" />,     cls: 'hover:border-purple-500/60 hover:bg-purple-500/10 text-purple-300' },
    { type: 'image',   label: 'Image',   icon: <ImageIcon className="w-4 h-4" />, cls: 'hover:border-blue-500/60 hover:bg-blue-500/10 text-blue-300' },
    { type: 'options', label: 'Buttons', icon: <ToggleLeft className="w-4 h-4" />, cls: 'hover:border-emerald-500/60 hover:bg-emerald-500/10 text-emerald-300' },
    { type: 'list',    label: 'List',    icon: <List className="w-4 h-4" />,      cls: 'hover:border-orange-500/60 hover:bg-orange-500/10 text-orange-300' },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">

      {contacts.length > 0 && (
        <div className="glass-panel px-4 py-2 rounded-xl border border-white/10 text-sm flex items-center gap-4 w-fit">
          <span className="text-gray-400"><span className="text-white font-bold">{contacts.length}</span> contacts</span>
          {sent > 0    && <span className="text-emerald-400 font-semibold">{sent} sent</span>}
          {failed > 0  && <span className="text-red-400 font-semibold">{failed} failed</span>}
          {sending > 0 && <span className="text-yellow-400 font-semibold">{sending} sending</span>}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

        {/* ── LEFT COLUMN ── */}
        <div className="space-y-6">

          {/* Contact Upload */}
          <div className="glass-panel p-5 rounded-2xl border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                  <Users className="w-3.5 h-3.5" />
                </div>
                <h2 className="text-sm font-semibold text-white">Upload Contacts</h2>
              </div>
              <button
                onClick={downloadTemplate}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-medium transition-all"
              >
                <Download className="w-3 h-3" />
                Download Template
              </button>
            </div>

            {/* Drop Zone */}
            <div
              onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-5 text-center transition-all cursor-pointer
                ${isDragging ? 'border-emerald-500/60 bg-emerald-500/5' : 'border-white/10 hover:border-white/20 bg-black/20'}`}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="flex items-center justify-center gap-3">
                <FileText className="w-5 h-5 text-emerald-400" />
                <span className="text-xs text-gray-400">.csv</span>
                <span className="text-gray-600">·</span>
                <FileSpreadsheet className="w-5 h-5 text-blue-400" />
                <span className="text-xs text-gray-400">.xlsx / .xls</span>
              </div>
              <p className="text-gray-500 text-xs mt-2">
                {isDragging ? 'Drop it here!' : 'Drag & drop or click to browse'}
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls,.ods,.txt"
                className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) parseFile(f); e.target.value = ''; }}
              />
            </div>

            {/* Contact Table */}
            {contacts.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">{contacts.length} contacts loaded</span>
                  <button onClick={handleClearAllContacts} className="text-xs text-red-400 hover:text-red-300">
                    Clear all
                  </button>
                </div>
                <div className="rounded-xl border border-white/10 overflow-hidden max-h-56 overflow-y-auto">
                  <table className="w-full text-xs">
                    <thead className="sticky top-0 bg-black/80 border-b border-white/10">
                      <tr>
                        <th className="px-3 py-2 text-left text-gray-400 font-medium">
                          <User className="w-3 h-3 inline mr-1" />Name
                        </th>
                        <th className="px-3 py-2 text-left text-gray-400 font-medium">
                          <Phone className="w-3 h-3 inline mr-1" />Phone
                        </th>
                        <th className="px-3 py-2 text-left text-gray-400 font-medium">Status</th>
                        <th className="px-3 py-2"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {contacts.map(c => (
                        <tr key={c.id} className="border-b border-white/5 hover:bg-white/3">
                          <td className="px-3 py-2 text-white font-medium">{c.name}</td>
                          <td className="px-3 py-2 text-gray-400 font-mono">{c.phone}</td>
                          <td className="px-3 py-2"><StatusBadge status={c.status} /></td>
                          <td className="px-3 py-2">
                            <button onClick={() => handleDeleteContact(c.phone)}
                              className="text-gray-600 hover:text-red-400">
                              <X className="w-3 h-3" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Delay Settings */}
          <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-yellow-500/10 flex items-center justify-center text-yellow-400">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-white">Message Delay</h2>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex-1">
                <input
                  type="range"
                  min={1}
                  max={60}
                  value={delaySeconds}
                  onChange={e => setDelaySeconds(Number(e.target.value))}
                  className="w-full accent-yellow-500"
                />
                <div className="flex justify-between text-[10px] text-gray-600 mt-0.5">
                  <span>1s</span><span>30s</span><span>60s</span>
                </div>
              </div>
              <div className="relative">
                <input
                  type="number"
                  min={1}
                  max={3600}
                  value={delaySeconds}
                  onChange={e => setDelaySeconds(Math.max(1, Number(e.target.value)))}
                  className="w-24 px-3 py-2 rounded-xl bg-black/50 border border-yellow-500/30 text-white text-center text-xl font-bold focus:outline-none focus:border-yellow-500"
                />
                <span className="absolute -bottom-5 left-0 right-0 text-center text-[10px] text-gray-500">seconds</span>
              </div>
            </div>

            <div className="flex gap-2 flex-wrap mt-2">
              {[1, 3, 5, 10, 15, 30].map(s => (
                <button key={s} onClick={() => setDelaySeconds(s)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                    delaySeconds === s
                      ? 'bg-yellow-500/30 text-yellow-300 border border-yellow-500/50'
                      : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10'
                  }`}>
                  {s}s
                </button>
              ))}
            </div>
          </div>

          {/* Campaign Control */}
          <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400">
                <Send className="w-4 h-4" />
              </div>
              <div>
              <h2 className="text-sm font-semibold text-white">Launch Campaign</h2>
              {contacts.length > 0 && (
                <p className="text-xs text-gray-500">
                  Est. ~{Math.ceil(contacts.length * (delaySeconds + 1) / 60)} min for {contacts.length} contacts
                </p>
              )}
              </div>
            </div>

            {/* Progress Bar */}
            {isSending && (
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-gray-400">
                  <span>Progress</span>
                  <span>{sent + failed} / {contacts.length}</span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-purple-500 transition-all duration-500"
                    style={{ width: `${contacts.length ? ((sent + failed) / contacts.length) * 100 : 0}%` }}
                  />
                </div>
              </div>
            )}

            <div className="flex gap-3">
              {!isSending ? (
                <button
                  onClick={startCampaign}
                  disabled={contacts.length === 0 || blocks.length === 0}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500
                    text-white font-semibold text-sm shadow-lg shadow-emerald-500/25 transition-all disabled:opacity-40 disabled:cursor-not-allowed
                    flex items-center justify-center gap-2"
                >
                  <Play className="w-4 h-4" />
                  Send Campaign
                </button>
              ) : (
                <>
                  <button onClick={togglePause}
                    className="flex-1 py-3 rounded-xl bg-yellow-600/80 hover:bg-yellow-500 text-white font-semibold text-sm transition-all flex items-center justify-center gap-2">
                    {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                    {isPaused ? 'Resume' : 'Pause'}
                  </button>
                  <button onClick={stopCampaign}
                    className="flex-1 py-3 rounded-xl bg-red-600/80 hover:bg-red-500 text-white font-semibold text-sm transition-all flex items-center justify-center gap-2">
                    <X className="w-4 h-4" />
                    Stop
                  </button>
                </>
              )}
            </div>

            {/* Mini stats */}
            {contacts.length > 0 && (
              <div className="grid grid-cols-4 gap-2 pt-1">
                {[
                  { label: 'Pending', val: pending, cls: 'text-gray-400' },
                  { label: 'Sending', val: sending, cls: 'text-yellow-300' },
                  { label: 'Sent',    val: sent,    cls: 'text-emerald-300' },
                  { label: 'Failed',  val: failed,  cls: 'text-red-400' },
                ].map(s => (
                  <div key={s.label} className="bg-black/30 rounded-lg p-2 text-center border border-white/5">
                    <div className={`text-lg font-bold ${s.cls}`}>{s.val}</div>
                    <div className="text-[10px] text-gray-500">{s.label}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT COLUMN — Message Builder ── */}
        <div className="space-y-6">
          <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                  <Type className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-white">Build Message</h2>
                </div>
              </div>
              <button
                onClick={() => setShowPreview(p => !p)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 text-xs"
              >
                {showPreview ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                {showPreview ? 'Hide' : 'Show'} Preview
              </button>
            </div>

            {/* Template Selector & Add Block Buttons */}
            {availableTemplates.length > 0 && (
              <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 space-y-1.5">
                <label className="text-[11px] font-semibold uppercase text-purple-300 flex items-center justify-between">
                  <span>Load Saved Template</span>
                  <span className="text-[9px] text-purple-400">Meta API</span>
                </label>
                <select
                  onChange={(e) => {
                    const tpl = availableTemplates.find(t => t._id === e.target.value || t.name === e.target.value);
                    if (tpl) {
                      const newBlocks: MessageBlock[] = [{ id: uid(), type: 'text', content: tpl.bodyText }];
                      if (tpl.buttons && tpl.buttons.length > 0) {
                        newBlocks.push({ id: uid(), type: 'options', body: '', buttons: tpl.buttons });
                      }
                      setBlocks(newBlocks);
                      toast.success(`Loaded template "${tpl.name}"`);
                    }
                  }}
                  defaultValue=""
                  className="w-full px-3 py-2 rounded-lg bg-black/50 border border-purple-500/30 text-white text-xs focus:outline-none focus:border-purple-400"
                >
                  <option value="" disabled>Select a template to insert...</option>
                  {availableTemplates.map((t: any) => (
                    <option key={t._id || t.name} value={t._id || t.name}>
                      {t.name} ({t.category}) - Status: {t.status}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Add Block Buttons */}
            <div className="flex flex-wrap gap-2">
              {blockTypes.map(bt => (
                <button
                  key={bt.type}
                  onClick={() => addBlock(bt.type)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 bg-black/20 text-xs font-medium transition-all ${bt.cls}`}
                >
                  {bt.icon}
                  + {bt.label}
                </button>
              ))}
            </div>

            {/* Block Editors */}
            {blocks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-gray-600 text-sm gap-2 border-2 border-dashed border-white/5 rounded-xl">
                <Type className="w-8 h-8" />
                Add blocks above to build your message
              </div>
            ) : (
              <div className="space-y-3">
                {blocks.map((block, _idx) => (
                  <div key={block.id} className="relative p-4 rounded-xl bg-black/30 border border-white/8 group">
                    {block.type === 'text' && (
                      <TextBlockEditor
                        block={block as TextBlock}
                        onChange={b => updateBlock(block.id, b)}
                        onRemove={() => removeBlock(block.id)}
                      />
                    )}
                    {block.type === 'image' && (
                      <ImageBlockEditor
                        block={block as ImageBlock}
                        onChange={b => updateBlock(block.id, b)}
                        onRemove={() => removeBlock(block.id)}
                      />
                    )}
                    {block.type === 'options' && (
                      <OptionsBlockEditor
                        block={block as OptionsBlock}
                        onChange={b => updateBlock(block.id, b)}
                        onRemove={() => removeBlock(block.id)}
                      />
                    )}
                    {block.type === 'list' && (
                      <ListBlockEditor
                        block={block as ListBlock}
                        onChange={b => updateBlock(block.id, b)}
                        onRemove={() => removeBlock(block.id)}
                      />
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Personalization tip */}
            {blocks.some(b => b.type === 'text' || b.type === 'options') && (
              <p className="text-[10px] text-gray-600 px-1">
                💡 Use <code className="text-purple-400">{'{{name}}'}</code> in text blocks to personalize with contact name
              </p>
            )}
          </div>

          {/* WhatsApp Preview */}
          {showPreview && (
            <div className="glass-panel p-5 rounded-2xl border border-white/10 space-y-3">
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <Eye className="w-3.5 h-3.5" />
                <span className="font-medium">Live Preview</span>
                <span className="text-gray-600 text-[10px]">— as seen in WhatsApp</span>
              </div>
              {/* Phone frame */}
              <div className="bg-[#111b21] rounded-2xl p-4 min-h-[200px]">
                {/* Chat header */}
                <div className="flex items-center gap-3 pb-3 mb-3 border-b border-white/5">
                  <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-white text-xs font-bold">
                    {contacts[0]?.name?.[0]?.toUpperCase() || 'A'}
                  </div>
                  <div>
                    <div className="text-white text-xs font-semibold">{contacts[0]?.name || 'Arjun Kumar'}</div>
                    <div className="text-emerald-400 text-[10px]">online</div>
                  </div>
                </div>
                <MessagePreview blocks={blocks} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
