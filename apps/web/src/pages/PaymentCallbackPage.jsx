import React, { useEffect, useRef, useState } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import apiServerClient from '@/lib/apiServerClient';

export default function PaymentCallbackPage() {
  const [params] = useSearchParams();
  const reference = params.get('reference') || params.get('trxref');
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [status, setStatus] = useState('verifying');
  const [message, setMessage] = useState('');
  const ran = useRef(false);

  useEffect(() => {
    if (!reference || !user?.id || ran.current) return;
    ran.current = true;

    apiServerClient
      .fetch('/payment/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reference, userId: user.id }),
      })
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          setStatus('success');
          setTimeout(() => navigate('/dashboard'), 3000);
        } else {
          setStatus('failed');
          setMessage(data.error || t('common.error'));
        }
      })
      .catch(() => {
        setStatus('failed');
        setMessage(t('payment.contactSupport'));
      });
  }, [reference, user?.id, navigate, t]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 text-foreground">
      <Helmet>
        <title>{t('payment.pageTitle')}</title>
        <meta name="description" content={t('payment.pageDesc')} />
      </Helmet>
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-8 text-center shadow-lg">
        {status === 'verifying' && (
          <>
            <Loader2 className="mx-auto h-10 w-10 animate-spin text-primary" />
            <p className="mt-4 font-display text-xl font-bold">{t('payment.verifying')}</p>
            <p className="mt-2 text-sm text-muted-foreground">{t('payment.verifyingBody')}</p>
          </>
        )}
        {status === 'success' && (
          <>
            <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-500" />
            <p className="mt-4 font-display text-xl font-bold">{t('payment.success')}</p>
            <p className="mt-2 text-sm text-muted-foreground">{t('payment.successBody')}</p>
          </>
        )}
        {status === 'failed' && (
          <>
            <XCircle className="mx-auto h-10 w-10 text-destructive" />
            <p className="mt-4 font-display text-xl font-bold">{t('payment.failed')}</p>
            <p className="mt-2 text-sm text-muted-foreground">{message}</p>
            <div className="mt-6 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => navigate('/upgrade')}
                className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground"
              >
                {t('payment.tryAgain')}
              </button>
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                {t('payment.backToDashboard')}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
