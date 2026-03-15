'use client';

import { useState } from 'react';
import { Upload, FileText, Loader2, Copy, Check } from 'lucide-react';

type ReviewResult = {
  overall_score: number;
  clarity_score: number;
  impact_score: number;
  ats_score: number;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  line_by_line_suggestions: Array<{
    original: string;
    suggestion: string;
    improved_version: string;
  }>;
};

export default function Home() {
  const [type, setType] = useState<'resume' | 'cover-letter'>('resume');
  const [file, setFile] = useState<File | null>(null);
  const [textInput, setTextInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ReviewResult | null>(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) setFile(selected);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);

    const formData = new FormData();
    if (file) formData.append('file', file);
    if (textInput) formData.append('text', textInput);
    formData.append('type', type);

    try {
      const res = await fetch('/api/review', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Something went wrong');

      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const copySuggestions = () => {
    if (!result) return;
    const text = result.line_by_line_suggestions
      .map(s => `Original: ${s.original}\nSuggestion: ${s.suggestion}\nImproved: ${s.improved_version}\n\n`)
      .join('');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-green-400';
    if (score >= 70) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="min-h-screen bg-zinc-950">
      <div className="max-w-5xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-3">AI Resume & Cover Letter Reviewer</h1>
          <p className="text-zinc-400 text-xl">Instant Grok-powered feedback • Line-by-line suggestions • ATS optimized</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Type Selector */}
          <div className="flex gap-4 justify-center">
            <button
              type="button"
              onClick={() => setType('resume')}
              className={`px-8 py-3 rounded-xl font-medium transition-all ${type === 'resume' ? 'bg-white text-black' : 'bg-zinc-900 hover:bg-zinc-800'}`}
            >
              Resume
            </button>
            <button
              type="button"
              onClick={() => setType('cover-letter')}
              className={`px-8 py-3 rounded-xl font-medium transition-all ${type === 'cover-letter' ? 'bg-white text-black' : 'bg-zinc-900 hover:bg-zinc-800'}`}
            >
              Cover Letter
            </button>
          </div>

          {/* Upload Area */}
          <div className="border-2 border-dashed border-zinc-700 rounded-3xl p-12 text-center hover:border-zinc-500 transition-colors">
            <Upload className="mx-auto mb-4 w-12 h-12 text-zinc-400" />
            <p className="text-lg mb-2">Drop your PDF or TXT here</p>
            <p className="text-sm text-zinc-500 mb-6">or paste text below</p>
            
            <label className="cursor-pointer inline-block bg-white hover:bg-zinc-100 text-black px-8 py-3 rounded-2xl font-medium">
              Choose File
              <input type="file" accept=".pdf,.txt" onChange={handleFile} className="hidden" />
            </label>
            
            {file && <p className="mt-4 text-sm text-emerald-400">✓ {file.name}</p>}
          </div>

          {/* Text Paste */}
          <textarea
            placeholder="Or paste your resume/cover letter text here..."
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            className="w-full h-48 bg-zinc-900 border border-zinc-700 rounded-3xl p-6 text-lg resize-y"
          />

          <button
            type="submit"
            disabled={loading || (!file && !textInput)}
            className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 disabled:opacity-50 py-5 rounded-3xl text-xl font-semibold flex items-center justify-center gap-3"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin w-6 h-6" /> Analyzing with Grok...
              </>
            ) : (
              'Analyze Now →'
            )}
          </button>
        </form>

        {error && <p className="text-red-400 text-center mt-6">{error}</p>}

        {/* Results */}
        {result && (
          <div className="mt-16 space-y-12">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-32 h-32 rounded-full bg-zinc-900 border-8 border-emerald-500 score-circle" style={{ '--score': `${result.overall_score}%` } as any}>
                <div className="text-center">
                  <div className="text-6xl font-bold text-emerald-400">{result.overall_score}</div>
                  <div className="text-sm text-zinc-500 -mt-1">OVERALL</div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-6">
              {[
                { label: 'Clarity', score: result.clarity_score },
                { label: 'Impact', score: result.impact_score },
                { label: 'ATS Score', score: result.ats_score },
              ].map((item) => (
                <div key={item.label} className="bg-zinc-900 rounded-3xl p-8 text-center">
                  <div className={`text-6xl font-bold ${getScoreColor(item.score)}`}>{item.score}</div>
                  <div className="text-zinc-400 mt-2">{item.label}</div>
                </div>
              ))}
            </div>

            <div className="bg-zinc-900 rounded-3xl p-10">
              <h3 className="text-2xl font-semibold mb-6">Summary</h3>
              <p className="text-lg leading-relaxed text-zinc-300">{result.summary}</p>
            </div>

            <div className="grid grid-cols-2 gap-8">
              <div className="bg-emerald-950/50 border border-emerald-900 rounded-3xl p-8">
                <h4 className="text-emerald-400 font-medium mb-4">✅ Strengths</h4>
                <ul className="space-y-3">
                  {result.strengths.map((s, i) => <li key={i} className="flex gap-3"><span className="text-emerald-400">•</span> {s}</li>)}
                </ul>
              </div>
              <div className="bg-red-950/50 border border-red-900 rounded-3xl p-8">
                <h4 className="text-red-400 font-medium mb-4">⚠️ Areas to Improve</h4>
                <ul className="space-y-3">
                  {result.weaknesses.map((w, i) => <li key={i} className="flex gap-3"><span className="text-red-400">•</span> {w}</li>)}
                </ul>
              </div>
            </div>

            {/* Line-by-Line Suggestions */}
            <div className="bg-zinc-900 rounded-3xl p-10">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-semibold">Line-by-Line Suggestions</h3>
                <button onClick={copySuggestions} className="flex items-center gap-2 text-sm bg-zinc-800 hover:bg-zinc-700 px-5 py-2 rounded-full">
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />} Copy All
                </button>
              </div>

              <div className="space-y-10">
                {result.line_by_line_suggestions.map((s, i) => (
                  <div key={i} className="border-l-4 border-zinc-700 pl-8">
                    <div className="text-sm text-zinc-500 mb-2">ORIGINAL</div>
                    <p className="mb-4 text-zinc-300">"{s.original}"</p>
                    
                    <div className="grid grid-cols-2 gap-8">
                      <div>
                        <div className="text-sm text-amber-400 mb-2">SUGGESTION</div>
                        <p className="text-amber-300">{s.suggestion}</p>
                      </div>
                      <div>
                        <div className="text-sm text-emerald-400 mb-2">IMPROVED VERSION</div>
                        <p className="text-emerald-300 font-medium">"{s.improved_version}"</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}