'use client';
// lib/push-client.js — browserkant van web-push. Gebruikt door /mijn-doelwit en /admin.

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

export function pushOndersteund() {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

// iOS ondersteunt web-push enkel als de site als PWA op het beginscherm staat.
export function isIOS() {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  return /iPad|iPhone|iPod/.test(ua) || (ua.includes('Mac') && 'ontouchend' in document);
}
export function isStandalone() {
  return (
    (typeof window !== 'undefined' && window.matchMedia?.('(display-mode: standalone)').matches) ||
    (typeof navigator !== 'undefined' && navigator.standalone === true)
  );
}

// 'aan' | 'uit' | 'geblokkeerd' | 'niet-ondersteund'
export async function huidigeStatus() {
  if (!pushOndersteund()) return 'niet-ondersteund';
  if (Notification.permission === 'denied') return 'geblokkeerd';
  const reg = await navigator.serviceWorker.getRegistration();
  const sub = reg ? await reg.pushManager.getSubscription() : null;
  return sub && Notification.permission === 'granted' ? 'aan' : 'uit';
}

// auth = { toegangscode } (deelnemer) of { wachtwoord } (marshall)
export async function activeerPush(auth) {
  if (!pushOndersteund()) throw new Error('Deze browser ondersteunt geen meldingen.');

  const reg = await navigator.serviceWorker.register('/sw.js');
  await navigator.serviceWorker.ready;

  const perm = await Notification.requestPermission();
  if (perm !== 'granted') throw new Error('Je hebt de toestemming voor meldingen geweigerd.');

  const cfg = await fetch('/api/push').then((r) => r.json());
  if (!cfg.publicKey) throw new Error('De server heeft nog geen VAPID-sleutel ingesteld.');

  let sub = await reg.pushManager.getSubscription();
  if (!sub) {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(cfg.publicKey),
    });
  }

  const res = await fetch('/api/push', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      actie: 'aanmelden',
      ...auth,
      subscription: sub.toJSON(),
      userAgent: navigator.userAgent,
    }),
  });
  if (!res.ok) {
    const j = await res.json().catch(() => ({}));
    throw new Error(j.error || 'Aanmelden bij de server mislukt.');
  }
  return true;
}

export async function deactiveerPush() {
  const reg = await navigator.serviceWorker.getRegistration();
  if (!reg) return;
  const sub = await reg.pushManager.getSubscription();
  if (!sub) return;
  await fetch('/api/push', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ actie: 'afmelden', endpoint: sub.endpoint }),
  }).catch(() => {});
  await sub.unsubscribe().catch(() => {});
}

export async function testPush(auth) {
  const res = await fetch('/api/push', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ actie: 'test', ...auth }),
  });
  if (!res.ok) {
    const j = await res.json().catch(() => ({}));
    throw new Error(j.error || 'Testmelding mislukt.');
  }
  return res.json();
}
