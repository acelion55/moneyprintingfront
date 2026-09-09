'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  PhoneCall, Upload, FileSpreadsheet, Trash2, Play, Square, RefreshCw, Plus,
  Volume2, VolumeX, Mic, PhoneForwarded, PhoneOff, Settings, CheckCircle2,
  AlertCircle, Clock, Loader2, Save, Music, Sparkles, Layers, ListFilter, Users,
  Check, PlayCircle, StopCircle
} from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';

// ─── Interfaces ───────────────────────────────────────────────────────────────

interface Contact {
  id?: string;
  _id?: string;
  name: string;
  phone: string;
  status: 'pending' | 'calling' | 'completed' | 'failed';
  dtmfPressed?: string;
}

interface DTMFRoute {
  digit: string;       // e.g. "1", "2", "3"
  label: string;       // e.g. "Press 1 for Sales"
  action: 'play_audio' | 'transfer_call' | 'hangup';
  audioUrl?: string;   // Audio file URL for keypress
  audioName?: string;
  forwardPhone?: string; // Phone number to transfer call
}

interface IVRTemplate {
  _id?: string;
  name: string;
  description: string;
  welcomeAudioUrl: string;
  welcomeAudioName?: string;
  welcomeText: string;
  dtmfRoutes: DTMFRoute[];
}

export default function IvrCallingPage() {
  // Navigation Tabs
  const [activeTab, setActiveTab] = useState<'campaign' | 'builder' | 'templates'>('builder');

  // Contacts State
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // IVR Builder / Active Template State
  const [templates, setTemplates] = useState<IVRTemplate[]>([]);
  const [activeTemplate, setActiveTemplate] = useState<IVRTemplate>({
    name: 'Main IVR Flow',
    description: 'Automated Call Routing Menu',
    welcomeText: 'Namaste! Welcome to our automated service. Please press 1 for Sales, press 2 for Support.',
    welcomeAudioUrl: '',
    dtmfRoutes: [
      { digit: '1', label: 'Sales & New Enquiries', action: 'play_audio', audioUrl: '', forwardPhone: '' },
      { digit: '2', label: 'Connect to Support Agent', action: 'transfer_call', audioUrl: '', forwardPhone: '9983745802' },
      { digit: '3', label: 'Disconnect Call', action: 'hangup', audioUrl: '', forwardPhone: '' },
    ],
  });

  // Audio Uploading States
  const [uploadingAudioKey, setUploadingAudioKey] = useState<string | null>(null); // 'welcome' or route index

  // Campaign State
  const [delaySeconds, setDelaySeconds] = useState<number>(3);
  const [isRunning, setIsRunning] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const stopCampaignRef = useRef(false);

  // Audio Simulator State
  const [simulatedCallActive, setSimulatedCallActive] = useState(false);
  const [simulatedLog, setSimulatedLog] = useState<string[]>([]);
  const [currentlyPlayingAudio, setCurrentlyPlayingAudio] = useState<string | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  // ── Load Initial Data from Backend ──────────────────────────────────────────

  useEffect(() => {
    loadBackendData();
  }, []);

  async function loadBackendData() {
    try {
      setLoadingContacts(true);
      const [resContacts, resTemplates] = await Promise.all([
        api.get('/ivr/contacts').catch((err) => {
          console.warn('Contacts endpoint notice:', err?.message);
          return { data: [] };
        }),
        api.get('/ivr/templates').catch((err) => {
          console.warn('Templates endpoint notice:', err?.message);
          return { data: [] };
        }),
      ]);

      if (Array.isArray(resContacts.data)) {
        setContacts(resContacts.data.map((c: any) => ({
          id: c._id || Math.random().toString(),
          name: c.name || 'Customer',
          phone: c.phone || '',
          status: c.status || 'pending',
          dtmfPressed: c.dtmfPressed || '',
        })));
      }

      if (Array.isArray(resTemplates.data) && resTemplates.data.length > 0) {
        setTemplates(resTemplates.data);
        setActiveTemplate(resTemplates.data[0]);
      }
    } catch (err: any) {
      console.error('Failed to load IVR data:', err);
    } finally {
      setLoadingContacts(false);
    }
  }

  // ── CSV & Excel File Upload Handling ─────────────────────────────────────────

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const fileName = file.name.toLowerCase();

    if (fileName.endsWith('.csv')) {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          processParsedData(results.data);
        },
        error: (err) => {
          toast.error(`CSV Parsing error: ${err.message}`);
          setIsUploading(false);
        },
      });
    } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const data = new Uint8Array(evt.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const sheet = workbook.Sheets[sheetName];
          const json = XLSX.utils.sheet_to_json(sheet);
          processParsedData(json);
        } catch (err: any) {
          toast.error(`Excel Parsing error: ${err.message}`);
          setIsUploading(false);
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      toast.error('Please upload a valid CSV or XLSX file');
      setIsUploading(false);
    }
  };

  async function processParsedData(data: any[]) {
    try {
      const parsed: { name: string; phone: string }[] = [];

      data.forEach((row) => {
        let phone = '';
        let name = '';

        Object.keys(row).forEach((key) => {
          const k = key.trim().toLowerCase();
          const val = String(row[key] || '').trim();

          if (k.includes('phone') || k.includes('mobile') || k.includes('number') || k.includes('contact')) {
            phone = val.replace(/[^\d+]/g, '');
          }
          if (k.includes('name') || k.includes('customer') || k.includes('user')) {
            name = val;
          }
        });

        // Fallback for unlabeled columns
        if (!phone) {
          const values = Object.values(row).map((v) => String(v).trim());
          for (const v of values) {
            const clean = v.replace(/[^\d+]/g, '');
            if (clean.length >= 10 && clean.length <= 13) {
              phone = clean;
              break;
            }
          }
        }

        if (phone) {
          if (!name) name = 'Customer';
          parsed.push({ name, phone });
        }
      });

      if (parsed.length === 0) {
        toast.error('No valid phone numbers found in the file!');
        setIsUploading(false);
        return;
      }

      // Save to MongoDB via backend
      const res = await api.post('/ivr/contacts', { contacts: parsed });
      if (Array.isArray(res.data)) {
        setContacts(res.data.map((c: any) => ({
          id: c._id || Math.random().toString(),
          name: c.name || 'Customer',
          phone: c.phone || '',
          status: c.status || 'pending',
          dtmfPressed: c.dtmfPressed || '',
        })));
      }
      toast.success(`Uploaded & saved ${parsed.length} contacts successfully!`);
    } catch (err: any) {
      toast.error('Failed to save uploaded contacts');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  const handleClearContacts = async () => {
    if (!confirm('Are you sure you want to clear contacts?')) return;
    try {
      for (const c of contacts) {
        if (c.phone) await api.delete(`/ivr/contacts?phone=${encodeURIComponent(c.phone)}`);
      }
      setContacts([]);
      toast.success('Contacts list cleared');
    } catch (err) {
      toast.error('Failed to clear contacts');
    }
  };

  // ── Audio Upload Handling ────────────────────────────────────────────────────

  const uploadAudioFile = async (file: File, targetKey: 'welcome' | number) => {
    if (!file.type.startsWith('audio/')) {
      toast.error('Please upload an audio file (.mp3, .wav, .m4a)');
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      toast.error('Audio file size must be under 15MB');
      return;
    }

    setUploadingAudioKey(targetKey === 'welcome' ? 'welcome' : `route-${targetKey}`);

    try {
      const fd = new FormData();
      fd.append('file', file);

      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Audio upload failed');

      if (targetKey === 'welcome') {
        setActiveTemplate((prev) => ({
          ...prev,
          welcomeAudioUrl: data.url,
          welcomeAudioName: file.name,
        }));
      } else if (typeof targetKey === 'number') {
        setActiveTemplate((prev) => {
          const updated = [...prev.dtmfRoutes];
          updated[targetKey] = {
            ...updated[targetKey],
            audioUrl: data.url,
            audioName: file.name,
          };
          return { ...prev, dtmfRoutes: updated };
        });
      }

      toast.success('Audio file uploaded successfully! 🎵');
    } catch (err: any) {
      toast.error(err.message || 'Audio upload failed');
    } finally {
      setUploadingAudioKey(null);
    }
  };

  // ── DTMF Route Editing ───────────────────────────────────────────────────────

  const addDtmfRoute = () => {
    const existingDigits = activeTemplate.dtmfRoutes.map((r) => r.digit);
    const availableDigits = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '*', '#'];
    const nextDigit = availableDigits.find((d) => !existingDigits.includes(d)) || '9';

    setActiveTemplate((prev) => ({
      ...prev,
      dtmfRoutes: [
        ...prev.dtmfRoutes,
        {
          digit: nextDigit,
          label: `Press ${nextDigit} for Action`,
          action: 'play_audio',
          audioUrl: '',
          forwardPhone: '',
        },
      ],
    }));
  };

  const removeDtmfRoute = (index: number) => {
    setActiveTemplate((prev) => ({
      ...prev,
      dtmfRoutes: prev.dtmfRoutes.filter((_, i) => i !== index),
    }));
  };

  const updateDtmfRoute = (index: number, field: keyof DTMFRoute, value: any) => {
    setActiveTemplate((prev) => {
      const updated = [...prev.dtmfRoutes];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, dtmfRoutes: updated };
    });
  };

  // ── Save Template ────────────────────────────────────────────────────────────

  const handleSaveTemplate = async () => {
    if (!activeTemplate.name) {
      toast.error('Please enter a template name');
      return;
    }
    try {
      const res = await api.post('/ivr/templates', activeTemplate);
      toast.success('IVR Flow Template saved! ✓');
      loadBackendData();
    } catch (err: any) {
      toast.error('Failed to save template');
    }
  };

  // ── Simulated Interactive Call Dialpad ──────────────────────────────────────

  const startSimulatedCall = () => {
    setSimulatedCallActive(true);
    setSimulatedLog([
      `📞 Simulated Call Started...`,
      `📢 Playing Welcome Greeting: "${activeTemplate.welcomeText || 'Welcome to IVR'}"`,
    ]);

    if (activeTemplate.welcomeAudioUrl) {
      playAudio(activeTemplate.welcomeAudioUrl);
    } else if ('speechSynthesis' in window && activeTemplate.welcomeText) {
      const utterance = new SpeechSynthesisUtterance(activeTemplate.welcomeText);
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleSimulatedKeyPress = (digit: string) => {
    if (!simulatedCallActive) {
      toast.info('Click "Start Live Test Call" to test the dialpad!');
      return;
    }

    const route = activeTemplate.dtmfRoutes.find((r) => r.digit === digit);

    if (!route) {
      setSimulatedLog((prev) => [
        ...prev,
        `👉 Key Pressed: [${digit}] — ⚠️ Invalid option pressed!`,
      ]);
      return;
    }

    if (route.action === 'play_audio') {
      setSimulatedLog((prev) => [
        ...prev,
        `👉 Key Pressed: [${digit}] (${route.label}) → Playing Custom Audio Audio: ${route.audioName || route.audioUrl || 'Default Message'}`,
      ]);
      if (route.audioUrl) {
        playAudio(route.audioUrl);
      } else if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(`Option ${digit} selected: ${route.label}`);
        window.speechSynthesis.speak(utterance);
      }
    } else if (route.action === 'transfer_call') {
      setSimulatedLog((prev) => [
        ...prev,
        `👉 Key Pressed: [${digit}] (${route.label}) → 📞 Transferring call to Agent: ${route.forwardPhone || 'Agent'}`,
      ]);
    } else if (route.action === 'hangup') {
      setSimulatedLog((prev) => [
        ...prev,
        `👉 Key Pressed: [${digit}] (${route.label}) → 📵 Call Ended with Thank You message.`,
      ]);
      setTimeout(() => setSimulatedCallActive(false), 2000);
    }
  };

  const playAudio = (url: string) => {
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
    }
    const audio = new Audio(url);
    audioPlayerRef.current = audio;
    setCurrentlyPlayingAudio(url);
    audio.play().catch(() => {});
    audio.onended = () => setCurrentlyPlayingAudio(null);
  };

  const endSimulatedCall = () => {
    setSimulatedCallActive(false);
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    if (audioPlayerRef.current) audioPlayerRef.current.pause();
    setSimulatedLog((prev) => [...prev, `📵 Call Terminated`]);
  };

  // ── Campaign Execution ──────────────────────────────────────────────────────

  const startCampaign = async () => {
    if (contacts.length === 0) {
      toast.error('Please upload contacts before launching campaign!');
      return;
    }
    stopCampaignRef.current = false;
    setIsRunning(true);

    let count = 0;
    for (let i = 0; i < contacts.length; i++) {
      if (stopCampaignRef.current) break;

      setCurrentIndex(i);
      const contact = contacts[i];

      setContacts((prev) =>
        prev.map((c, idx) => (idx === i ? { ...c, status: 'calling' } : c))
      );

      try {
        const res = await api.post('/ivr/trigger-call', {
          phone: contact.phone,
          templateId: activeTemplate._id,
        });

        if (res.data?.success) {
          setContacts((prev) =>
            prev.map((c, idx) => (idx === i ? { ...c, status: 'completed', dtmfPressed: '1' } : c))
          );
          count++;
        } else {
          setContacts((prev) =>
            prev.map((c, idx) => (idx === i ? { ...c, status: 'failed' } : c))
          );
          toast.error(`Call to ${contact.phone} failed: ${res.data?.error || 'Unknown error'}`);
        }
      } catch (err: any) {
        setContacts((prev) =>
          prev.map((c, idx) => (idx === i ? { ...c, status: 'failed' } : c))
        );
        toast.error(`Call to ${contact.phone} failed: ${err.response?.data?.message || err.message}`);
      }

      if (i < contacts.length - 1 && !stopCampaignRef.current) {
        await new Promise((r) => setTimeout(r, delaySeconds * 1000));
      }
    }

    setIsRunning(false);
    setCurrentIndex(-1);
    toast.success(`IVR Campaign broadcast complete!`);
  };

  const stopCampaign = () => {
    stopCampaignRef.current = true;
    setIsRunning(false);
    toast.info('Campaign broadcast stopped.');
  };

  const filteredContacts = contacts.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone.includes(searchTerm)
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel p-6 rounded-3xl border border-white/10">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
            <PhoneCall className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-white">IVR Cloud Telephony & Calling</h1>
              <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-[10px] font-extrabold uppercase">
                Pro
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Multi-level IVR DTMF Menu Builder, Audio Uploader, & Bulk Automated Calling Suite
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center bg-black/40 p-1.5 rounded-2xl border border-white/10">
          <button
            onClick={() => setActiveTab('builder')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'builder'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Settings className="w-3.5 h-3.5" /> IVR Flow & Audio Builder
          </button>
          <button
            onClick={() => setActiveTab('campaign')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'campaign'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" /> Contacts & Campaign ({contacts.length})
          </button>
          <button
            onClick={() => setActiveTab('templates')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'templates'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" /> Saved IVR Templates ({templates.length})
          </button>
        </div>
      </div>

      {/* ─── TAB 1: IVR FLOW & AUDIO BUILDER ────────────────────────────────────────── */}
      {activeTab === 'builder' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Flow Form (Left Column) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Active Flow Template Details */}
            <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-blue-400" /> IVR Campaign Flow Settings
                </h3>
                <button
                  onClick={handleSaveTemplate}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all"
                >
                  <Save className="w-3.5 h-3.5" /> Save Flow Template
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-400 font-medium block mb-1">Flow Name</label>
                  <input
                    type="text"
                    value={activeTemplate.name}
                    onChange={(e) => setActiveTemplate({ ...activeTemplate, name: e.target.value })}
                    placeholder="e.g. Primary Sales & Support Flow"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 font-medium block mb-1">Description</label>
                  <input
                    type="text"
                    value={activeTemplate.description}
                    onChange={(e) => setActiveTemplate({ ...activeTemplate, description: e.target.value })}
                    placeholder="Short description"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Primary Greeting Audio / Text */}
              <div className="space-y-3 pt-2 border-t border-white/5">
                <label className="text-xs font-bold text-blue-300 flex items-center gap-1.5">
                  <Volume2 className="w-4 h-4" /> Welcome Greeting (Primary IVR Audio)
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Text-To-Speech Fallback */}
                  <div>
                    <span className="text-[11px] text-gray-400 block mb-1">Text-to-Speech Script:</span>
                    <textarea
                      rows={3}
                      value={activeTemplate.welcomeText}
                      onChange={(e) => setActiveTemplate({ ...activeTemplate, welcomeText: e.target.value })}
                      placeholder="Welcome to our cloud service! Press 1 for Sales..."
                      className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-xs focus:outline-none focus:border-blue-500 resize-none"
                    />
                  </div>

                  {/* Audio Upload for Welcome Greeting */}
                  <div>
                    <span className="text-[11px] text-gray-400 block mb-1">Upload Audio File (.mp3/.wav):</span>
                    <div className="border border-dashed border-white/20 rounded-xl p-3 bg-black/30 text-center flex flex-col items-center justify-center space-y-2">
                      {activeTemplate.welcomeAudioUrl ? (
                        <div className="space-y-1 w-full">
                          <span className="text-[11px] text-emerald-400 font-semibold block truncate">
                            ✓ {activeTemplate.welcomeAudioName || 'Welcome Audio Attached'}
                          </span>
                          <div className="flex items-center justify-center gap-2">
                            <button
                              type="button"
                              onClick={() => playAudio(activeTemplate.welcomeAudioUrl)}
                              className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 text-[10px] font-bold flex items-center gap-1"
                            >
                              <Play className="w-3 h-3" /> Preview
                            </button>
                            <button
                              type="button"
                              onClick={() => setActiveTemplate({ ...activeTemplate, welcomeAudioUrl: '', welcomeAudioName: '' })}
                              className="px-2 py-1 rounded-lg bg-red-500/20 text-red-400 text-[10px] font-bold"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      ) : (
                        <label className="cursor-pointer flex flex-col items-center gap-1">
                          {uploadingAudioKey === 'welcome' ? (
                            <Loader2 className="w-5 h-5 animate-spin text-blue-400" />
                          ) : (
                            <Music className="w-5 h-5 text-blue-400" />
                          )}
                          <span className="text-[11px] text-gray-300 font-medium">
                            {uploadingAudioKey === 'welcome' ? 'Uploading...' : 'Click to Upload Audio'}
                          </span>
                          <input
                            type="file"
                            accept="audio/*"
                            className="hidden"
                            onChange={(e) => {
                              const f = e.target.files?.[0];
                              if (f) uploadAudioFile(f, 'welcome');
                            }}
                          />
                        </label>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Keypress (DTMF) Options Mapping */}
            <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <PhoneForwarded className="w-4 h-4 text-purple-400" /> DTMF Keypress Audio Routes (1, 2, 3...)
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Configure what happens when a caller presses a specific keypad number
                  </p>
                </div>
                <button
                  onClick={addDtmfRoute}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Number Option
                </button>
              </div>

              <div className="space-y-4">
                {activeTemplate.dtmfRoutes.map((route, idx) => (
                  <div key={idx} className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      {/* Digit selector */}
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400 font-bold">Press Key:</span>
                        <select
                          value={route.digit}
                          onChange={(e) => updateDtmfRoute(idx, 'digit', e.target.value)}
                          className="px-3 py-1.5 rounded-lg bg-blue-600/30 border border-blue-500/40 text-blue-300 font-black text-xs focus:outline-none"
                        >
                          {['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '*', '#'].map((d) => (
                            <option key={d} value={d} className="bg-gray-900 text-white">
                              Digit {d}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Action selector */}
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400 font-bold">Action:</span>
                        <select
                          value={route.action}
                          onChange={(e) => updateDtmfRoute(idx, 'action', e.target.value as any)}
                          className="px-3 py-1.5 rounded-lg bg-black/60 border border-white/10 text-white text-xs focus:outline-none"
                        >
                          <option value="play_audio">Play Audio Message</option>
                          <option value="transfer_call">Forward / Transfer Call</option>
                          <option value="hangup">Hangup / End Call</option>
                        </select>
                      </div>

                      <button
                        onClick={() => removeDtmfRoute(idx)}
                        className="text-gray-500 hover:text-red-400 p-1.5 rounded-lg hover:bg-white/5 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Route Label */}
                    <div>
                      <input
                        type="text"
                        value={route.label}
                        onChange={(e) => updateDtmfRoute(idx, 'label', e.target.value)}
                        placeholder="Option Description (e.g. Press 1 for Sales)"
                        className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/10 text-white text-xs focus:outline-none"
                      />
                    </div>

                    {/* Action Specific Controls */}
                    {route.action === 'play_audio' && (
                      <div className="p-3 rounded-xl bg-blue-500/5 border border-blue-500/20 flex flex-col sm:flex-row items-center justify-between gap-3">
                        <div className="text-xs text-gray-300">
                          <span className="font-bold text-blue-400 block mb-0.5">Audio for Key [{route.digit}]:</span>
                          {route.audioUrl ? (
                            <span className="text-[11px] text-emerald-400 font-medium truncate block">
                              ✓ {route.audioName || 'Custom Audio Uploaded'}
                            </span>
                          ) : (
                            <span className="text-[11px] text-gray-500">No custom audio uploaded yet</span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          {route.audioUrl && (
                            <button
                              type="button"
                              onClick={() => playAudio(route.audioUrl!)}
                              className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 text-[10px] font-bold flex items-center gap-1"
                            >
                              <Play className="w-3 h-3" /> Play
                            </button>
                          )}
                          <label className="cursor-pointer px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1 transition-all">
                            {uploadingAudioKey === `route-${idx}` ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Upload className="w-3.5 h-3.5" />
                            )}
                            Upload Audio
                            <input
                              type="file"
                              accept="audio/*"
                              className="hidden"
                              onChange={(e) => {
                                const f = e.target.files?.[0];
                                if (f) uploadAudioFile(f, idx);
                              }}
                            />
                          </label>
                        </div>
                      </div>
                    )}

                    {route.action === 'transfer_call' && (
                      <div className="p-3 rounded-xl bg-purple-500/5 border border-purple-500/20 flex items-center gap-3">
                        <PhoneForwarded className="w-4 h-4 text-purple-400 shrink-0" />
                        <div className="flex-1">
                          <label className="text-[11px] text-gray-400 block mb-0.5">Agent Transfer Phone Number:</label>
                          <input
                            type="text"
                            value={route.forwardPhone || ''}
                            onChange={(e) => updateDtmfRoute(idx, 'forwardPhone', e.target.value)}
                            placeholder="e.g. 9983745802"
                            className="w-full px-3 py-1.5 rounded-lg bg-black/60 border border-white/10 text-white text-xs focus:outline-none focus:border-purple-500 font-mono"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Interactive Phone & Live Flow Simulator (Right Column) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-6 sticky top-6">
              <div className="text-center space-y-1">
                <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-extrabold tracking-wider uppercase">
                  Interactive Simulator
                </span>
                <h3 className="text-lg font-bold text-white">Live Dialpad IVR Simulator</h3>
                <p className="text-xs text-gray-400">
                  Test keypress audio responses live in your browser before calling
                </p>
              </div>

              {/* Phone Frame */}
              <div className="max-w-xs mx-auto bg-gray-950 p-5 rounded-[40px] border-4 border-gray-800 shadow-2xl space-y-4">
                {/* Screen Display */}
                <div className="bg-black/90 p-4 rounded-2xl border border-white/10 text-center min-h-[100px] flex flex-col justify-center space-y-1">
                  {simulatedCallActive ? (
                    <>
                      <div className="flex items-center justify-center gap-1.5 text-xs text-emerald-400 font-bold animate-pulse">
                        <PhoneCall className="w-3.5 h-3.5" /> Connected: IVR Live
                      </div>
                      <p className="text-[11px] text-gray-300 line-clamp-2">
                        {simulatedLog[simulatedLog.length - 1]}
                      </p>
                    </>
                  ) : (
                    <p className="text-xs text-gray-500">Ready to test call flow...</p>
                  )}
                </div>

                {/* Keypad Grid (1-9, *, 0, #) */}
                <div className="grid grid-cols-3 gap-3 px-2">
                  {['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'].map((digit) => {
                    const hasRoute = activeTemplate.dtmfRoutes.some((r) => r.digit === digit);
                    return (
                      <button
                        key={digit}
                        onClick={() => handleSimulatedKeyPress(digit)}
                        className={`h-12 rounded-full font-bold text-sm flex flex-col items-center justify-center transition-all ${
                          hasRoute
                            ? 'bg-blue-600/30 text-blue-200 border border-blue-500/40 hover:bg-blue-600 hover:text-white shadow-lg'
                            : 'bg-white/5 text-gray-400 hover:bg-white/10'
                        }`}
                      >
                        <span>{digit}</span>
                        {hasRoute && <span className="text-[8px] text-blue-400">• mapped</span>}
                      </button>
                    );
                  })}
                </div>

                {/* Call Control Button */}
                <div className="pt-2">
                  {simulatedCallActive ? (
                    <button
                      onClick={endSimulatedCall}
                      className="w-full py-3 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-red-600/30 transition-all"
                    >
                      <PhoneOff className="w-4 h-4" /> End Test Call
                    </button>
                  ) : (
                    <button
                      onClick={startSimulatedCall}
                      className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition-all"
                    >
                      <PhoneCall className="w-4 h-4" /> Start Live Test Call
                    </button>
                  )}
                </div>
              </div>

              {/* Call Log Output */}
              {simulatedLog.length > 0 && (
                <div className="p-3 rounded-xl bg-black/60 border border-white/10 max-h-40 overflow-y-auto text-[11px] font-mono text-gray-300 space-y-1">
                  {simulatedLog.map((log, i) => (
                    <div key={i}>{log}</div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 2: CONTACTS & CAMPAIGN ──────────────────────────────────────────────── */}
      {activeTab === 'campaign' && (
        <div className="space-y-6">
          {/* Upload & Controls */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* File Upload Box */}
            <div className="md:col-span-7 glass-panel p-6 rounded-3xl border border-white/10 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <FileSpreadsheet className="w-4 h-4 text-emerald-400" /> Upload Contacts (CSV & Excel)
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Upload file containing Name and Phone Number columns
                  </p>
                </div>

                {contacts.length > 0 && (
                  <button
                    onClick={handleClearContacts}
                    className="text-xs text-red-400 hover:underline flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Clear All
                  </button>
                )}
              </div>

              {/* Upload Dropzone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-white/15 hover:border-blue-500/50 bg-black/30 rounded-2xl p-8 text-center cursor-pointer transition-all space-y-2 group"
              >
                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center mx-auto group-hover:scale-110 transition-all">
                  {isUploading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Upload className="w-6 h-6" />}
                </div>
                <div>
                  <p className="text-xs font-bold text-white">Click or drag & drop CSV / Excel file</p>
                  <p className="text-[11px] text-gray-500">Supports .csv, .xlsx, .xls formats</p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>
            </div>

            {/* Launch Campaign Control Panel */}
            <div className="md:col-span-5 glass-panel p-6 rounded-3xl border border-white/10 space-y-4 flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
                  <PlayCircle className="w-4 h-4 text-blue-400" /> Launch IVR Calling Broadcast
                </h3>

                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">Selected IVR Flow Template:</label>
                    <div className="p-2.5 rounded-xl bg-black/40 border border-white/10 text-xs text-blue-300 font-bold">
                      {activeTemplate.name} ({activeTemplate.dtmfRoutes.length} keypress options)
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-gray-400 block mb-1">Delay Between Calls (Seconds):</label>
                    <input
                      type="number"
                      min={1}
                      max={60}
                      value={delaySeconds}
                      onChange={(e) => setDelaySeconds(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-xs focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div>
                {isRunning ? (
                  <button
                    onClick={stopCampaign}
                    className="w-full py-3 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-red-600/30 transition-all"
                  >
                    <StopCircle className="w-4 h-4" /> Stop Campaign Broadcast
                  </button>
                ) : (
                  <button
                    onClick={startCampaign}
                    className="w-full py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 transition-all"
                  >
                    <Play className="w-4 h-4" /> Launch Automated IVR Calls ({contacts.length})
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Contact Table */}
          <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">Contacts Queue ({filteredContacts.length})</h3>
              <input
                type="text"
                placeholder="Search name or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-3.5 py-1.5 rounded-xl bg-black/40 border border-white/10 text-white text-xs focus:outline-none"
              />
            </div>

            {loadingContacts ? (
              <div className="p-8 text-center text-xs text-gray-400 flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-blue-400" /> Loading contacts...
              </div>
            ) : filteredContacts.length === 0 ? (
              <div className="p-8 text-center text-xs text-gray-500">
                No contacts loaded. Upload a CSV or Excel file above to add numbers.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-gray-300">
                  <thead className="bg-black/40 text-gray-400 uppercase text-[10px] font-bold">
                    <tr>
                      <th className="p-3">#</th>
                      <th className="p-3">Name</th>
                      <th className="p-3">Phone Number</th>
                      <th className="p-3">Call Status</th>
                      <th className="p-3">DTMF Pressed</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredContacts.map((c, i) => (
                      <tr key={i} className="hover:bg-white/5 transition-all">
                        <td className="p-3 text-gray-500 font-mono">{i + 1}</td>
                        <td className="p-3 font-semibold text-white">{c.name}</td>
                        <td className="p-3 font-mono">{c.phone}</td>
                        <td className="p-3">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold capitalize inline-flex items-center gap-1 ${
                              c.status === 'completed'
                                ? 'bg-emerald-500/20 text-emerald-300'
                                : c.status === 'calling'
                                ? 'bg-yellow-500/20 text-yellow-300 animate-pulse'
                                : c.status === 'failed'
                                ? 'bg-red-500/20 text-red-400'
                                : 'bg-gray-500/20 text-gray-400'
                            }`}
                          >
                            {c.status}
                          </span>
                        </td>
                        <td className="p-3 font-mono text-purple-300 font-bold">
                          {c.dtmfPressed ? `Key [${c.dtmfPressed}]` : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── TAB 3: SAVED IVR TEMPLATES ─────────────────────────────────────────────── */}
      {activeTab === 'templates' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((tpl, i) => (
            <div
              key={i}
              className="glass-panel p-6 rounded-3xl border border-white/10 space-y-4 hover:border-blue-500/40 transition-all flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-[10px] font-bold uppercase">
                    Flow Template
                  </span>
                  {tpl._id && (
                    <button
                      onClick={async () => {
                        if (confirm('Delete template?')) {
                          await api.delete(`/ivr/templates?id=${tpl._id}`);
                          loadBackendData();
                        }
                      }}
                      className="text-gray-500 hover:text-red-400 text-xs"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <h3 className="text-base font-bold text-white">{tpl.name}</h3>
                <p className="text-xs text-gray-400 line-clamp-2">{tpl.description}</p>

                <div className="pt-2 border-t border-white/5 space-y-1.5">
                  <span className="text-[11px] text-blue-400 font-semibold block">Mapped Options:</span>
                  {tpl.dtmfRoutes.map((r, idx) => (
                    <div key={idx} className="text-xs text-gray-300 flex items-center justify-between">
                      <span>Digit [{r.digit}]: {r.label}</span>
                      <span className="text-[10px] text-gray-500 capitalize">({r.action.replace('_', ' ')})</span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={() => {
                  setActiveTemplate(tpl);
                  setActiveTab('builder');
                  toast.success(`Loaded "${tpl.name}" into builder!`);
                }}
                className="w-full py-2.5 rounded-xl bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white font-bold text-xs transition-all flex items-center justify-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" /> Load & Edit Flow
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
