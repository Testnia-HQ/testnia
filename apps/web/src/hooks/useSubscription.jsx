import { useEffect, useState, useCallback } from 'react';
import pb from '@/lib/pocketbaseClient';
import { useAuth } from '@/contexts/AuthContext';

export function useSubscription() {
  const { user, isAuthed } = useAuth();
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!isAuthed || !user?.id) {
      setSubscription(null);
      setLoading(false);
      return;
    }
    try {
      const results = await pb.collection('subscriptions').getFullList({
        filter: pb.filter('user = {:u}', { u: user.id }),
        sort: '-created',
        requestKey: `sub-${user.id}`,
      });
      // Pick active premium first, else latest
      const premium = results.find(s => s.plan === 'pro' && s.status === 'active');
      setSubscription(premium || results[0] || null);
    } catch (_) {
      setSubscription(null);
    } finally {
      setLoading(false);
    }
  }, [isAuthed, user?.id]);

  useEffect(() => { load(); }, [load]);

  const isPremium =
    subscription?.plan === 'pro' &&
    subscription?.status === 'active' &&
    (!subscription?.current_period_end ||
      new Date(subscription.current_period_end) > new Date());

  return { subscription, loading, isPremium, isFreemium: !isPremium, refresh: load };
}
