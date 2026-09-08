export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-16 space-y-8">
      <h1 className="text-4xl font-bold text-white">About MoneyHiest</h1>
      <p className="text-gray-300 leading-relaxed text-lg">
        MoneyHiest is a principal-level SaaS platform designed to bridge business intelligence with conversational automation. Our platform enables organizations to ingest vector embeddings into high-performance vector databases like Qdrant and power customer touchpoints automatically.
      </p>
      <div className="glass-panel p-8 rounded-2xl space-y-4">
        <h2 className="text-2xl font-semibold text-white">Our Architecture</h2>
        <p className="text-gray-400 text-sm">
          Built on isolated multi-tenant architecture with NestJS backend, Mongoose ODM, and Next.js App Router. Each organization maintains strict data isolation and tenant vector namespaces.
        </p>
      </div>
    </div>
  );
}
