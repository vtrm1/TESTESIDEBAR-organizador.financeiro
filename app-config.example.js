// Copie este arquivo para app-config.js e preencha com os valores reais
// Caso hospede na Vercel, você pode definir as mesmas chaves como variáveis de ambiente
// (FIREBASE_API_KEY, FIREBASE_AUTH_DOMAIN, etc.) em vez de manter este arquivo no servidor.

window.__FIREBASE_CONFIG__ = {
  apiKey: 'SUA_API_KEY',
  authDomain: 'seu-projeto.firebaseapp.com',
  projectId: 'seu-projeto',
  storageBucket: 'seu-projeto.appspot.com',
  messagingSenderId: '000000000000',
  appId: '1:000000000000:web:abcdef1234567890',
  measurementId: 'G-XXXXXXXXXX'
};

window.__APP_CONFIG__ = {
  accessControl: {
    // IDs ou e-mails que devem ser aprovados automaticamente
    adminUids: [],
    adminEmails: [],
    allowedEmails: [],
    allowedDomains: [],
    requireApproval: true,
    requireAllowlist: false,
  },
  firebase: {
    // Caso queira expor outros dados específicos do projeto
    client: null,
  },
};
