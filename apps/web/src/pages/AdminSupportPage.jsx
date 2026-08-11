import React, { useState, useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { API_SERVER_URL } from '@/lib/apiServerClient';
import pb from '@/lib/pocketbaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Send, RefreshCw, Search, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import SiteHeader from '@/components/SiteHeader';

const STATUS_COLORS = {
  open: 'destructive',
  pending: 'secondary',
  closed: 'outline',
};

const STATUS_ICONS = {
  open: <AlertCircle size={14} />,
  pending: <Clock size={14} />,
  closed: <CheckCircle size={14} />,
};

function formatDate(d) {
  if (!d) return '';
  return new Date(d).toLocaleString();
}

export default function AdminSupportPage() {
  const { user, isAuthed } = useAuth();
  const navigate = useNavigate();

  const [isAdmin, setIsAdmin] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [selected, setSelected] = useState(null);
  const [messages, setMessages] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef(null);

  // Verify admin
  useEffect(() => {
    if (!isAuthed) { navigate('/login'); return; }
    pb.collection('admin_users')
      .getFirstListItem(`email = "${user?.email}"`)
      .then((r) => setIsAdmin(r?.active ?? false))
      .catch(() => setIsAdmin(false));
  }, [isAuthed, user]);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams();
      if (statusFilter !== 'all') qs.set('status', statusFilter);
      if (search) qs.set('search', search);
      const res = await fetch(`${API_SERVER_URL}/support/admin/tickets?${qs}`);
      const data = await res.json();
      setTickets(data?.items || []);
    } catch (e) {
      setError('Failed to load tickets.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (isAdmin) fetchTickets(); }, [isAdmin, statusFilter]);

  const openTicket = async (ticket) => {
    setSelected(ticket);
    try {
      const res = await fetch(`${API_SERVER_URL}/support/admin/tickets/${ticket.id}`);
      const data = await res.json();
      setMessages(data?.messages || []);
    } catch (e) {
      setMessages([]);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendReply = async (e) => {
    e.preventDefault();
    if (!reply.trim()) return;
    setSending(true);
    try {
      await fetch(`${API_SERVER_URL}/support/admin/tickets/${selected.id}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: reply.trim() }),
      });
      setReply('');
      const res = await fetch(`${API_SERVER_URL}/support/admin/tickets/${selected.id}`);
      const data = await res.json();
      setMessages(data?.messages || []);
      fetchTickets();
    } catch (e) {
      setError('Failed to send reply.');
    } finally {
      setSending(false);
    }
  };

  const updateStatus = async (status) => {
    try {
      await fetch(`${API_SERVER_URL}/support/admin/tickets/${selected.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      setSelected((t) => ({ ...t, status }));
      fetchTickets();
    } catch (e) {
      setError('Failed to update status.');
    }
  };

  if (isAdmin === false) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Admins only.</p>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Admin — Support — Testnia</title>
        <meta name="description" content="Manage support tickets for Testnia." />
      </Helmet>
      <SiteHeader />
      <div className="flex h-[calc(100dvh-64px)]">
        {/* Ticket list */}
        <div className="w-80 shrink-0 border-r border-border flex flex-col bg-card">
          <div className="p-4 border-b border-border space-y-3">
            <h2 className="font-semibold text-sm">Support Tickets</h2>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-8 text-xs h-8"
                placeholder="Search subject…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchTickets()}
              />
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {['all', 'open', 'pending', 'closed'].map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${statusFilter === s ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:bg-accent'}`}
                >
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {loading && <p className="text-xs text-muted-foreground p-4">Loading…</p>}
            {!loading && tickets.length === 0 && (
              <p className="text-xs text-muted-foreground p-4">No tickets found.</p>
            )}
            {tickets.map((t) => (
              <button
                key={t.id}
                onClick={() => openTicket(t)}
                className={`w-full text-left px-4 py-3 border-b border-border hover:bg-accent transition-colors ${selected?.id === t.id ? 'bg-accent' : ''}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-xs font-medium truncate flex-1">{t.subject_line}</p>
                  <Badge variant={STATUS_COLORS[t.status]} className="text-[10px] shrink-0 flex items-center gap-1">
                    {STATUS_ICONS[t.status]} {t.status}
                  </Badge>
                </div>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {t.expand?.user?.email || t.user} · {formatDate(t.created)}
                </p>
                <p className="text-[11px] text-muted-foreground mt-1 truncate">{t.message}</p>
              </button>
            ))}
          </div>
          <div className="p-3 border-t border-border">
            <Button size="sm" variant="ghost" className="w-full text-xs" onClick={fetchTickets}>
              <RefreshCw size={12} className="mr-1" /> Refresh
            </Button>
          </div>
        </div>

        {/* Ticket detail */}
        {!selected ? (
          <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
            Select a ticket to view
          </div>
        ) : (
          <div className="flex-1 flex flex-col bg-background">
            {/* Ticket header */}
            <div className="px-6 py-4 border-b border-border flex items-start justify-between gap-4 shrink-0">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold truncate">{selected.subject_line}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {selected.expand?.user?.email || selected.user} · {formatDate(selected.created)}
                  {selected.category && <> · <span className="capitalize">{selected.category}</span></>}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Badge variant={STATUS_COLORS[selected.status]} className="flex items-center gap-1">
                  {STATUS_ICONS[selected.status]} {selected.status}
                </Badge>
                {selected.status !== 'closed' && (
                  <Button size="sm" variant="outline" className="text-xs" onClick={() => updateStatus('closed')}>
                    Mark resolved
                  </Button>
                )}
                {selected.status === 'closed' && (
                  <Button size="sm" variant="outline" className="text-xs" onClick={() => updateStatus('open')}>
                    Reopen
                  </Button>
                )}
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
              {/* Original message bubble */}
              <div className="flex justify-start">
                <div className="max-w-[70%] bg-secondary rounded-2xl rounded-tl-sm px-4 py-3">
                  <p className="text-xs text-muted-foreground mb-1 font-medium">User · {formatDate(selected.created)}</p>
                  <p className="text-sm leading-relaxed">{selected.message}</p>
                </div>
              </div>
              {messages.map((m) => (
                <div key={m.id} className={`flex ${m.sender_role === 'admin' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[70%] rounded-2xl px-4 py-3 ${m.sender_role === 'admin' ? 'bg-primary text-primary-foreground rounded-tr-sm' : 'bg-secondary rounded-tl-sm'}`}>
                    <p className={`text-xs mb-1 font-medium ${m.sender_role === 'admin' ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                      {m.sender_role === 'admin' ? 'Support' : 'User'} · {formatDate(m.created)}
                    </p>
                    <p className="text-sm leading-relaxed">{m.body}</p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Reply box */}
            {selected.status !== 'closed' && (
              <div className="px-6 py-4 border-t border-border shrink-0">
                {error && <p className="text-xs text-destructive mb-2">{error}</p>}
                <form onSubmit={sendReply} className="flex gap-2">
                  <Input
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    placeholder="Type your reply…"
                    className="flex-1 text-sm"
                    disabled={sending}
                  />
                  <Button type="submit" size="icon" disabled={sending || !reply.trim()}>
                    <Send size={16} />
                  </Button>
                </form>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
