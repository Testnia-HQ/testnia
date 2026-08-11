import React, { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import apiServerClient from '@/lib/apiServerClient';
import { useAuth } from '@/contexts/AuthContext';

export default function AdBanner({ placement }) {
  const { user } = useAuth();
  const [ad, setAd] = useState(null);
  const [dismissed, setDismissed] = useState(false);
  const tracked = useRef(false);

  useEffect(() => {
    setDismissed(false);
    tracked.current = false;
    apiServerClient
      .fetch(`/ads?placement=${placement}`)
      .then(r => r.json())
      .then(d => {
        const active = d.ads?.[0];
        setAd(active || null);
      })
      .catch(() => {});
  }, [placement]);

  useEffect(() => {
    if (!ad || tracked.current) return;
    tracked.current = true;
    apiServerClient
      .fetch('/ads/impression', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adId: ad.id, userId: user?.id || '', placement }),
      })
      .catch(() => {});
  }, [ad, placement, user?.id]);

  if (!ad || dismissed) return null;

  return (
    <div className="relative w-full overflow-hidden rounded-xl border border-primary/20 bg-accent/30">
      <button
        type="button"
        onClick={() => setDismissed(true)}
        aria-label="Dismiss ad"
        className="absolute right-2 top-2 z-10 rounded-full bg-background/70 p-1 text-muted-foreground hover:text-foreground"
      >
        <X className="h-3 w-3" />
      </button>
      <a
        href={ad.link_url}
        target={ad.link_url.startsWith('http') ? '_blank' : '_self'}
        rel="noopener noreferrer"
        className="block"
        onClick={() => {
          apiServerClient.fetch('/ads/impression', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ adId: ad.id, userId: user?.id || '', placement: `${placement}_click` }),
          }).catch(() => {});
        }}
      >
        <img
          src={ad.image_url}
          alt={ad.title}
          className="h-auto w-full object-cover"
          loading="lazy"
        />
      </a>
      <p className="px-2 py-0.5 text-right text-[10px] uppercase tracking-wide text-muted-foreground">
        Ad
      </p>
    </div>
  );
}
