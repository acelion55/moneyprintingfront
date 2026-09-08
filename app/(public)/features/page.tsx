export default function FeaturesPage() {
  return (
    <div className="max-w-7xl mx-auto px-6 py-16">
      <h1 className="text-4xl font-bold text-white text-center mb-12">System Features</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="glass-panel p-8 rounded-2xl">
          <h2 className="text-xl font-bold text-white mb-3">Qdrant Vector Ingestion</h2>
          <p className="text-gray-400 text-sm">Convert unstructured PDFs, TXT docs, and FAQs into dense 1536-dimensional embeddings for real-time RAG context retrieval.</p>
        </div>
        <div className="glass-panel p-8 rounded-2xl">
          <h2 className="text-xl font-bold text-white mb-3">Tenant Data Isolation</h2>
          <p className="text-gray-400 text-sm">Every user account receives a dedicated tenantId string associated with all MongoDB documents and Qdrant payloads.</p>
        </div>
      </div>
    </div>
  );
}
