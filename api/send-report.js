async function readJsonBody(req) {
  if (req.body && typeof req.body === 'object') {
    return req.body;
  }
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => {
      data += chunk;
      if (data.length > 5_000_000) {
        reject(new Error('Payload muito grande.'));
      }
    });
    req.on('end', () => {
      if (!data) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(data));
      } catch (error) {
        reject(new Error('JSON inválido.'));
      }
    });
    req.on('error', reject);
  });
}

function sanitizeRecipients(value) {
  const candidates = Array.isArray(value) ? value : [value];
  return candidates
    .map((item) => String(item || '').trim())
    .filter((email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email));
}

function sanitizeBase64Pdf(input) {
  if (!input) return '';
  return String(input).replace(/^data:.*;base64,/, '');
}

function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store, max-age=0');

  const resendApiKey = process.env.RESEND_API_KEY;
  const fromAddress = process.env.REPORT_EMAIL_FROM || process.env.RESEND_FROM_EMAIL || process.env.RESEND_FROM || '';

  if (req.method === 'GET') {
    const enabled = Boolean(resendApiKey && fromAddress);
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.status(200).json({ enabled });
    return;
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST, GET');
    res.status(405).json({ error: 'Método não permitido.' });
    return;
  }

  let body;
  try {
    body = await readJsonBody(req);
  } catch (error) {
    res.status(400).json({ error: error.message || 'Não foi possível ler o corpo da requisição.' });
    return;
  }

  const recipients = sanitizeRecipients(body?.to);
  if (!recipients.length) {
    res.status(400).json({ error: 'Informe pelo menos um e-mail de destino válido.' });
    return;
  }

  const pdfBase64 = sanitizeBase64Pdf(body?.pdfBase64);
  if (!pdfBase64) {
    res.status(400).json({ error: 'Conteúdo do PDF não informado.' });
    return;
  }

  if (!resendApiKey || !fromAddress) {
    res.status(501).json({
      error: 'Envio de e-mail não configurado. Defina RESEND_API_KEY e REPORT_EMAIL_FROM nas variáveis de ambiente.',
    });
    return;
  }

  const period = body?.period ? String(body.period).trim() : '';
  const subject = body?.subject && String(body.subject).trim()
    ? String(body.subject).trim()
    : `Relatório financeiro ${period || ''}`.trim() || 'Relatório financeiro';

  const totalEntradas = formatCurrency(body?.totalEntradas);
  const totalSaidas = formatCurrency(body?.totalSaidas);
  const saldo = formatCurrency(body?.saldo);
  const workspace = body?.workspace ? String(body.workspace).trim() : 'Workspace atual';
  const periodoHtml = period ? `<p><strong>Período:</strong> ${period}</p>` : '';

  const htmlContent = `
    <div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.5; color: #0f172a;">
      <p>Olá!</p>
      <p>Segue o relatório financeiro gerado automaticamente pelo Economeo para o espaço <strong>${workspace}</strong>.</p>
      ${periodoHtml}
      <ul style="padding-left: 1rem; margin: 1rem 0;">
        <li><strong>Total de entradas:</strong> ${totalEntradas}</li>
        <li><strong>Total de saídas:</strong> ${totalSaidas}</li>
        <li><strong>Saldo:</strong> ${saldo}</li>
      </ul>
      <p>O PDF em anexo detalha as categorias e demais indicadores do período selecionado.</p>
      <p style="margin-top: 1.5rem;">— Equipe Economeo</p>
    </div>
  `;

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromAddress,
        to: recipients,
        subject,
        html: htmlContent,
        attachments: [
          {
            filename: body?.fileName || 'relatorio-economeo.pdf',
            content: pdfBase64,
            type: 'application/pdf',
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      console.error('Falha ao enviar e-mail via Resend:', response.status, errorText);
      res.status(response.status).json({ error: 'Falha ao enviar e-mail.', details: errorText || undefined });
      return;
    }

    res.status(200).json({ ok: true });
  } catch (error) {
    console.error('Erro interno ao enviar e-mail:', error);
    res.status(500).json({ error: 'Erro interno ao enviar o relatório.' });
  }
}
