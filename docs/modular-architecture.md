# Proposta de estrutura modular para o Economeo

## Objetivos
- Manter 100% das funcionalidades atuais distribuídas hoje no `index.html`, mas segmentadas em módulos com responsabilidades únicas.
- Reaproveitar os arquivos de infraestrutura já existentes (`sw.js`, `manifest.json`, `api/app-config.js`, `app-config.js`) integrando-os ao pipeline de build.
- Permitir evolução incremental sem quebra dos usuários existentes, contemplando suporte offline, Firebase e interface rica.

## Organização sugerida
```
/
├── public/
│   ├── index.html          # HTML mínimo, importa o bundle gerado pelo build
│   ├── manifest.json       # Já existente
│   ├── sw.js               # Já existente
│   └── icons/              # Reutiliza os ícones já hospedados
├── src/
│   ├── main.ts             # Bootstrap da aplicação (tema, inicialização Firebase, stores)
│   ├── app-config/
│   │   ├── index.ts        # Carregamento seguro do app-config
│   │   └── schema.ts       # Validação (Zod/Yup) para configs opcionais
│   ├── firebase/
│   │   ├── client.ts       # Inicializa Firebase compat/ modular, expõe auth/firestore/storage
│   │   └── messaging.ts    # Registro do FCM e helpers de notificação
│   ├── router/
│   │   └── index.ts        # Gerencia hash routes e atalhos de modais
│   ├── services/
│   │   ├── auth.ts         # Fluxos de login, aprovação e guarda de tokens
│   │   ├── firestore.ts    # CRUD dos domínios (gastos, entradas, investimentos)
│   │   ├── storage.ts      # Upload/ download de anexos, se houver
│   │   └── sync.ts         # Estratégias de cache/merge offline-first
│   ├── stores/
│   │   ├── appStore.ts     # Estado global (tema, usuario, preferências)
│   │   ├── budgetStore.ts  # Envelopes e metas
│   │   ├── cashflowStore.ts# Entradas/ saídas
│   │   └── investmentsStore.ts
│   ├── components/
│   │   ├── layout/         # Header, sidebar, grids
│   │   ├── modals/         # Cada modal como componente isolado
│   │   ├── charts/         # Wrapper para Chart.js com temas
│   │   └── widgets/        # Cartões reutilizáveis (KPIs, listas)
│   ├── hooks/
│   │   ├── useModal.ts
│   │   ├── useFirestoreQuery.ts
│   │   └── useTheme.ts
│   ├── utils/
│   │   ├── dates.ts
│   │   ├── numbers.ts
│   │   └── formatters.ts
│   └── styles/
│       ├── index.css       # Entrada Tailwind/ CSS modules
│       └── tailwind.css
├── api/
│   └── app-config.js       # Mantém como função serverless (já existente)
├── app-config.example.js   # Mantido como referência
├── package.json            # Scripts de build (Vite/Parcel), lint e testes
└── vercel.json             # Reaproveitado
```

> Nota: a estrutura acima funciona igualmente bem para projetos em TypeScript + Vite, mas pode ser adaptada para React, Vue ou Web Components conforme preferir.

## Pontos-chave de modularização
1. **Bootstrap enxuto (`src/main.ts`)**
   - Carrega tema salvo, registra service worker e chama `initializeFirebase()` do módulo `firebase/client`.
   - Monta o root da aplicação (por exemplo, via framework ou custom element `AppRoot`).

2. **Configuração segura (`src/app-config`)**
   - `loadConfig()` faz `fetch('/app-config.js?format=json')`, valida contra `schema.ts` e expõe apenas os campos esperados.
   - Evita `new Function` e uso de globals, retornando uma Promise tipada consumida pelo bootstrap.

3. **Camada de serviços**
   - Cada domínio (gastos, entradas, investimentos, envelopes) ganha um serviço dedicado, usando Firestore/Storage através de helpers comuns.
   - Facilita testes unitários e mocking em modo offline.

4. **Stores reativas**
   - Utilizar Zustand/Pinia ou mesmo EventTarget customizado para emitir atualizações; UI assina cada store, substituindo os objetos globais de estado.
   - Persistência local (IndexedDB/localStorage) fica encapsulada em `sync.ts`.

5. **Componentização da UI**
   - Cada modal (ex.: `ModalAdicionarGasto`) recebe estado e ações via props/hooks, encapsulando validação, formatação e integração com serviços.
   - Widgets de dashboard (cards, gráficos) podem compartilhar helpers de Chart.js com troca de tema centralizada.

6. **Estilos e build**
   - Configurar Tailwind com `content` apontando para `src/**/*.tsx?` (ou `.html` se mantiver vanilla) e gerar CSS purgado.
   - Bundle único (via Vite) injeta `manifest.json` e `sw.js` no diretório `dist/` pronto para deploy na Vercel.

## Estratégia de migração incremental
1. Criar o pipeline de build (`package.json`, Vite, Tailwind). Renderizar o `index.html` atual consumindo o bundle gerado, sem alterar a UI.
2. Extrair a inicialização Firebase e autenticação para `src/firebase` e `src/services/auth`. Garantir que os listeners existentes continuem funcionando.
3. Migrar cada modal/painel para componentes dentro de `src/components`, eliminando referências globais gradualmente.
4. Introduzir stores reativas e substituir acessos diretos aos objetos globais, começando pelos painéis mais críticos (ex.: fluxo de caixa).
5. Escrever testes unitários de serviços e hooks principais para garantir regressão mínima.
6. Após a migração completa, remover scripts redundantes do `index.html` antigo e manter apenas a versão modular.

## Considerações adicionais
- Manter `sw.js` e `manifest.json` sob `public/` garante que Vite/Vercel sirvam os arquivos sem transformação.
- A função serverless `api/app-config.js` continua protegendo segredos, entregando apenas as chaves configuradas nas variáveis de ambiente.
- Se desejar manter vanilla JS, substitua `components/` por Web Components (classe `HTMLElement`) e utilize `lit-html` ou templating leve para não depender de framework.
- Registrar métricas (ex.: Google Analytics) pode ficar em `src/services/analytics.ts`, importado on-demand para não pesar no bundle inicial.
