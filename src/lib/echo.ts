import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

declare global {
  interface Window {
    Pusher: any;
    Echo: any;
  }
}

window.Pusher = Pusher;

let echoInstance: Echo<'reverb'> | null = null;

export function getEcho(): Echo<'reverb'> | null {
  if (typeof window === 'undefined') return null;

  if (!echoInstance) {
    try {
      const env = typeof import.meta !== 'undefined' && (import.meta as any).env ? (import.meta as any).env : {};
      const reverbKey = env.VITE_REVERB_APP_KEY || 'xuna8ve8pqoywwdienos';
      const reverbHost = env.VITE_REVERB_HOST || (typeof window !== 'undefined' ? window.location.hostname : 'localhost');
      const reverbPort = Number(env.VITE_REVERB_PORT || 8080);
      const isHttps = (env.VITE_REVERB_SCHEME || 'http') === 'https';

      echoInstance = new Echo({
        broadcaster: 'reverb',
        key: reverbKey,
        wsHost: reverbHost,
        wsPort: reverbPort,
        wssPort: reverbPort,
        forceTLS: isHttps,
        enabledTransports: ['ws', 'wss'],
      });

      window.Echo = echoInstance;
    } catch (err) {
      console.warn('Laravel Echo Reverb failed to initialize (continuing offline):', err);
    }
  }

  return echoInstance;
}

export function subscribeToEmergencies(
  onCreated: (emergency: any) => void,
  onConfirmed?: (emergency: any) => void,
  onDowngraded?: (emergency: any) => void
) {
  const echo = getEcho();
  if (!echo) return () => {};

  const channel = echo.channel('emergencies');

  channel.listen('.emergency.created', (event: any) => {
    onCreated(event.emergency);
  });

  if (onConfirmed) {
    channel.listen('.emergency.confirmed', (event: any) => {
      onConfirmed(event.emergency);
    });
  }

  if (onDowngraded) {
    channel.listen('.emergency.downgraded', (event: any) => {
      onDowngraded(event.emergency);
    });
  }

  return () => {
    channel.stopListening('.emergency.created');
    if (onConfirmed) channel.stopListening('.emergency.confirmed');
    if (onDowngraded) channel.stopListening('.emergency.downgraded');
  };
}
