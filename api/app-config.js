export default function handler(req, res) {
  const firebaseConfig = {
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN,
    projectId: process.env.FIREBASE_PROJECT_ID,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.FIREBASE_APP_ID,
    measurementId: process.env.FIREBASE_MEASUREMENT_ID,
  };

  const hasAnyValue = Object.values(firebaseConfig).some((value) => typeof value === 'string' && value.length > 0);

  res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store, max-age=0');

  if (!hasAnyValue) {
    res.status(200).send(
      "console.warn('Firebase config ausente nas variáveis de ambiente. Defina FIREBASE_API_KEY e demais chaves no painel da Vercel.');"
    );
    return;
  }

  const sanitizedConfig = Object.fromEntries(
    Object.entries(firebaseConfig).filter(([, value]) => value != null && value !== '')
  );

  res.status(200).send(`window.__FIREBASE_CONFIG__ = ${JSON.stringify(sanitizedConfig)};`);
}
