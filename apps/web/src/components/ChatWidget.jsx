import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Search, Send, ChevronLeft, CheckCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import pb from '@/lib/pocketbaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

const FAQS = [
  {
    id: 1,
    q: 'What exams does Testnia support?',
    a: 'Testnia supports WAEC, JAMB, GCE, NECO, and KCSE — the five major African exam boards.',
  },
  {
    id: 2,
    q: 'How many free practice sessions do I get?',
    a: 'Freemium users get 5 practice sessions per day and 1 essay submission per week. Upgrade to Premium for unlimited access.',
  },
  {
    id: 3,
    q: 'How does essay grading work?',
    a: 'Submit your essay, choose your exam board, and our AI grades it against official rubrics — giving you a score plus strengths and improvement tips.',
  },
  {
    id: 4,
    q: 'How do I upgrade to Premium?',
    a: 'Click "Upgrade" in the top navigation or visit /upgrade. We accept Mastercard, Visa, Verve, and Mobile Money via Paystack.',
  },
  {
    id: 5,
    q: 'What is the leaderboard?',
    a: 'Any student who scores 90% or above on a practice session earns a spot on the Hero Feature leaderboard. It\'s a Premium feature.',
  },
  {
    id: 6,
    q: 'How do I change my language?',
    a: 'Use the language switcher (EN/FR) in the top navigation to switch between English and French at any time.',
  },
  {
    id: 7,
    q: 'Can I practice without an account?',
    a: 'You can browse the exam catalogue without an account, but a free account is required to start practice sessions and track your progress.',
  },
  {
    id: 8,
    q: 'How do I reset my password?',
    a: 'On the login page click "Forgot password?" and enter your email. You\'ll receive a reset link within a few minutes.',
  },
  {
    id: 9,
    q: 'How do I cancel my Premium subscription?',
    a: 'Premium access lasts 30 days from payment. It does not auto-renew, so no cancellation is needed — simply do not repurchase.',
  },
  {
    id: 10,
    q: 'Why am I not seeing ads?',
    a: 'Premium users see no ads. Freemium users see ads on the dashboard and practice pages.',
  },
];

const CATEGORIES = ['billing', 'content', 'technical', 'other'];

const VIEW = { HOME: 'home', FAQ: 'faq', TICKET: 'ticket', SUCCESS: 'success' };

export default function ChatWidget() {
  const { t } = useTranslation();
  const { user, isAuthed } = useAuth();
  const [open, setOpen] = useState(false);
  const [view, setView] = useState(VIEW.HOME);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ subject: '', message: '', category: 'other' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef(null);

  const filteredFaqs = FAQS.filter(
    (f) =>
      f.q.toLowerCase().includes(search.toLowerCase()) ||
      f.a.toLowerCase().includes(search.toLowerCase()),
  );

  const handleSubmitTicket = async (e) => {
    e.preventDefault();
    if (!form.subject.trim() || !form.message.trim()) {
      setError('Please fill in all fields.');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      const ticket = await pb.collection('support_tickets').create({
        user: user.id,
        subject_line: form.subject.trim(),
        message: form.message.trim(),
        category: form.category,
        status: 'open',
      });
      // also post initial message to ticket_messages
      await pb.collection('ticket_messages').create({
        ticket: ticket.id,
        sender_role: 'user',
        body: form.message.trim(),
      });
      setView(VIEW.SUCCESS);
    } catch (err) {
      setError('Failed to submit ticket. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const reset = () => {
    setView(VIEW.HOME);
    setSearch('');
    setSelected(null);
    setForm({ subject: '', message: '', category: 'other' });
    setError('');
  };

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => { setOpen((o) => !o); if (!open) reset(); }}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:scale-105 active:scale-95 transition-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label="Open support chat"
      >
        {open ? <X size={22} /> : <MessageCircle size={22} />}
      </button>

      {/* Widget panel */}
      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-[360px] max-w-[calc(100vw-1.5rem)] bg-card border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          style={{ maxHeight: 'min(560px, calc(100dvh - 8rem))' }}>
          {/* Header */}
          <div className="bg-primary text-primary-foreground px-5 py-4 flex items-center gap-3 shrink-0">
            {view !== VIEW.HOME && (
              <button onClick={() => setView(VIEW.HOME)} className="mr-1 hover:opacity-80 transition-opacity">
                <ChevronLeft size={20} />
              </button>
            )}
            <div className="flex-1">
              <p className="font-semibold text-sm leading-tight">Testnia Support</p>
              <p className="text-xs opacity-80">FAQ & Help Tickets</p>
            </div>
            <button onClick={() => setOpen(false)} className="hover:opacity-80 transition-opacity">
              <X size={18} />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto">
            {/* HOME */}
            {view === VIEW.HOME && (
              <div className="p-5 space-y-4">
                <p className="text-sm text-muted-foreground">Hi there! How can we help you today?</p>
                <div className="relative">
                  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    className="pl-9 text-sm"
                    placeholder="Search FAQs…"
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setView(VIEW.FAQ); }}
                    onFocus={() => setView(VIEW.FAQ)}
                  />
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Popular questions</p>
                  {FAQS.slice(0, 4).map((f) => (
                    <button
                      key={f.id}
                      onClick={() => { setSelected(f); setView(VIEW.FAQ); }}
                      className="w-full text-left text-sm px-3 py-2.5 rounded-lg border border-border hover:bg-accent hover:border-primary/30 transition-colors"
                    >
                      {f.q}
                    </button>
                  ))}
                </div>
                <div className="pt-2 border-t border-border">
                  <button
                    onClick={() => { if (isAuthed) { setView(VIEW.TICKET); } else { window.location.href = '/login'; } }}
                    className="w-full text-sm text-primary font-medium hover:underline text-left py-1"
                  >
                    Can't find an answer? Submit a support ticket →
                  </button>
                </div>
              </div>
            )}

            {/* FAQ */}
            {view === VIEW.FAQ && (
              <div className="p-4 space-y-3">
                <div className="relative">
                  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    autoFocus
                    className="pl-9 text-sm"
                    placeholder="Search FAQs…"
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setSelected(null); }}
                  />
                </div>

                {selected ? (
                  <div className="space-y-3">
                    <button onClick={() => setSelected(null)} className="text-xs text-primary hover:underline flex items-center gap-1">
                      <ChevronLeft size={14} /> All questions
                    </button>
                    <div className="bg-secondary rounded-xl p-4 space-y-2">
                      <p className="text-sm font-semibold leading-snug">{selected.q}</p>
                      <p className="text-sm text-muted-foreground leading-relaxed">{selected.a}</p>
                    </div>
                    <div className="pt-2 border-t border-border text-center">
                      <p className="text-xs text-muted-foreground mb-2">Still need help?</p>
                      <button
                        onClick={() => { if (isAuthed) { setView(VIEW.TICKET); } else { window.location.href = '/login'; } }}
                        className="text-xs text-primary font-medium hover:underline"
                      >
                        Submit a support ticket
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {filteredFaqs.length === 0 ? (
                      <div className="text-center py-6 space-y-2">
                        <p className="text-sm text-muted-foreground">No results for "{search}"</p>
                        <button
                          onClick={() => { if (isAuthed) { setView(VIEW.TICKET); } else { window.location.href = '/login'; } }}
                          className="text-xs text-primary font-medium hover:underline"
                        >
                          Submit a support ticket
                        </button>
                      </div>
                    ) : (
                      filteredFaqs.map((f) => (
                        <button
                          key={f.id}
                          onClick={() => setSelected(f)}
                          className="w-full text-left text-sm px-3 py-2.5 rounded-lg border border-border hover:bg-accent hover:border-primary/30 transition-colors"
                        >
                          {f.q}
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}

            {/* TICKET FORM */}
            {view === VIEW.TICKET && (
              <form onSubmit={handleSubmitTicket} className="p-4 space-y-4">
                <p className="text-sm text-muted-foreground">Describe your issue and we'll get back to you.</p>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">Category</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                    className="w-full text-sm border border-input rounded-md px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">Subject</label>
                  <Input
                    className="text-sm"
                    placeholder="Brief description of your issue"
                    value={form.subject}
                    onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">Message</label>
                  <Textarea
                    className="text-sm resize-none"
                    rows={4}
                    placeholder="Tell us more…"
                    value={form.message}
                    onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                    required
                  />
                </div>
                {error && <p className="text-xs text-destructive">{error}</p>}
                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting ? 'Submitting…' : 'Submit ticket'}
                </Button>
              </form>
            )}

            {/* SUCCESS */}
            {view === VIEW.SUCCESS && (
              <div className="p-6 text-center space-y-4">
                <div className="flex justify-center">
                  <CheckCircle size={48} className="text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">Ticket submitted!</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    We'll get back to you as soon as possible.
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={reset}>
                  Ask another question
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
