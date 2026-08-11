import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { Plus, Trash2, Eye, ToggleLeft, ToggleRight, ArrowLeft } from 'lucide-react';
import apiServerClient from '@/lib/apiServerClient';

const PLACEMENTS = ['dashboard', 'practice', 'leaderboard', 'all'];

export default function AdminAdsPage() {
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ title: '', image_url: '', link_url: '', placement: 'all', active: true });
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);

  const loadAds = () => {
    setLoading(true);
    apiServerClient.fetch('/ads/all')
      .then(r => r.json())
      .then(d => { setAds(d.ads || []); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { loadAds(); }, []);

  const createAd = async (e) => {
    e.preventDefault();
    setError('');
    setAdding(true);
    try {
      const res = await apiServerClient.fetch('/ads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create ad');
      setAds(prev => [data.ad, ...prev]);
      setForm({ title: '', image_url: '', link_url: '', placement: 'all', active: true });
      setShowForm(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setAdding(false);
    }
  };

  const toggleActive = async (ad) => {
    try {
      const res = await apiServerClient.fetch(`/ads/${ad.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !ad.active }),
      });
      const data = await res.json();
      setAds(prev => prev.map(a => a.id === ad.id ? data.ad : a));
    } catch (_) {}
  };

  const deleteAd = async (id) => {
    if (!confirm('Delete this ad?')) return;
    try {
      await apiServerClient.fetch(`/ads/${id}`, { method: 'DELETE' });
      setAds(prev => prev.filter(a => a.id !== id));
    } catch (_) {}
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Helmet>
        <title>Ad Management — Testnia Admin</title>
        <meta name="description" content="Manage Testnia ad inventory for Freemium users." />
      </Helmet>

      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-[80rem] items-center gap-4 px-5 py-3">
          <span className="font-display text-lg font-extrabold uppercase tracking-[0.14em]">Testnia Admin</span>
          <Link to="/dashboard" className="ml-auto inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Dashboard
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-[80rem] px-4 py-8 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="font-display text-3xl font-bold">Ad Inventory</h1>
          <button
            type="button"
            onClick={() => setShowForm(v => !v)}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
          >
            <Plus className="h-4 w-4" /> Add Ad
          </button>
        </div>

        {showForm && (
          <form onSubmit={createAd} className="mt-6 rounded-2xl border border-border bg-card p-5">
            <p className="text-sm font-semibold">New Ad</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div>
                <label className="text-xs text-muted-foreground">Title *</label>
                <input
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="Ad title"
                  required
                  className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:border-primary"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Placement</label>
                <select
                  value={form.placement}
                  onChange={e => setForm(f => ({ ...f, placement: e.target.value }))}
                  className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:border-primary"
                >
                  {PLACEMENTS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs text-muted-foreground">Image URL *</label>
                <input
                  value={form.image_url}
                  onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))}
                  placeholder="https://example.com/ad.jpg"
                  required
                  className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:border-primary"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs text-muted-foreground">Destination URL *</label>
                <input
                  value={form.link_url}
                  onChange={e => setForm(f => ({ ...f, link_url: e.target.value }))}
                  placeholder="https://example.com or /upgrade"
                  required
                  className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:border-primary"
                />
              </div>
            </div>
            {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
            <div className="mt-4 flex gap-2">
              <button type="submit" disabled={adding} className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60">
                {adding ? 'Saving…' : 'Save Ad'}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="rounded-full border border-border px-5 py-2 text-sm font-semibold">Cancel</button>
            </div>
          </form>
        )}

        <div className="mt-6 overflow-hidden rounded-2xl border border-border bg-card">
          {loading && <div className="space-y-2 p-4">{[0,1,2].map(i => <div key={i} className="h-12 animate-pulse rounded bg-muted" />)}</div>}
          {!loading && ads.length === 0 && (
            <div className="p-8 text-center text-sm text-muted-foreground">No ads yet. Create your first ad above.</div>
          )}
          {!loading && ads.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] text-sm">
                <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3">Preview</th>
                    <th className="px-4 py-3">Title</th>
                    <th className="px-4 py-3">Placement</th>
                    <th className="px-4 py-3">Impressions</th>
                    <th className="px-4 py-3">Active</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {ads.map(ad => (
                    <tr key={ad.id} className="hover:bg-accent/20">
                      <td className="px-4 py-3">
                        <img src={ad.image_url} alt={ad.title} className="h-10 w-32 rounded object-cover" />
                      </td>
                      <td className="px-4 py-3 font-medium">{ad.title}</td>
                      <td className="px-4 py-3">
                        <span className="rounded-full bg-accent px-2.5 py-0.5 text-xs">{ad.placement}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-1 text-muted-foreground"><Eye className="h-3.5 w-3.5" />{ad.impressions || 0}</span>
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={() => toggleActive(ad)} className="text-muted-foreground hover:text-primary">
                          {ad.active
                            ? <ToggleRight className="h-5 w-5 text-emerald-500" />
                            : <ToggleLeft className="h-5 w-5" />
                          }
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <a href={ad.link_url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary">
                            <Eye className="h-4 w-4" />
                          </a>
                          <button onClick={() => deleteAd(ad.id)} className="text-muted-foreground hover:text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
