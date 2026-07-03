import { parseWebEnv } from '@creative-factory/env-config';

const env = parseWebEnv(process.env);

export default function HomePage() {
  return (
    <main className="container">
      <h1>{env.NEXT_PUBLIC_APP_NAME}</h1>
      <p>Monorepo scaffold. No business features yet.</p>
      <dl>
        <dt>API URL</dt>
        <dd>{env.NEXT_PUBLIC_API_URL}</dd>
        <dt>Environment</dt>
        <dd>{env.NODE_ENV}</dd>
      </dl>
    </main>
  );
}
