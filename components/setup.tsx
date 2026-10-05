// Shown instead of the store when DATABASE_URL is missing.
export function Setup() {
  return (
    <div className="mx-auto max-w-xl py-8">
      <h1 className="text-2xl font-semibold">One more step</h1>
      <p className="mt-3 text-neutral-700">
        This store needs a Postgres connection string in <code>DATABASE_URL</code>. The quickest
        way to get one is a free Neon database attached to your Vercel project.
      </p>
      <ol className="mt-6 list-decimal space-y-4 pl-5 text-neutral-800">
        <li>
          Link this folder to a Vercel project:
          <pre className="mt-2 rounded-lg bg-neutral-900 p-3 text-sm text-neutral-100">vercel link</pre>
        </li>
        <li>
          Provision a free Neon database and attach it:
          <pre className="mt-2 overflow-x-auto rounded-lg bg-neutral-900 p-3 text-sm text-neutral-100">
            vercel install neon --plan free_v3 -e production -e preview -e development
          </pre>
        </li>
        <li>
          Pull the environment variables locally:
          <pre className="mt-2 rounded-lg bg-neutral-900 p-3 text-sm text-neutral-100">vercel env pull</pre>
        </li>
        <li>Restart the dev server. The tables and sample products are created on first load.</li>
      </ol>
      <p className="mt-8 text-sm text-neutral-500">
        Already have a Postgres database? Put its connection string in <code>.env.local</code> as{" "}
        <code>DATABASE_URL</code> instead.
      </p>
    </div>
  );
}
