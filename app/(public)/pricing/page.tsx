export default function PricingPage() {
  return (
    <div className="max-w-7xl mx-auto px-6 py-16">
      <div className="text-center max-w-2xl mx-auto mb-12">
        <h1 className="text-4xl font-bold text-white mb-4">Transparent Subscription Plans</h1>
        <p className="text-gray-400">Scale your AI communication infrastructure with ease.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="glass-panel p-8 rounded-2xl border border-white/10 flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-300">Starter</h3>
            <div className="text-4xl font-bold text-white my-4">$49<span className="text-sm font-normal text-gray-400">/mo</span></div>
            <ul className="space-y-3 text-sm text-gray-400">
              <li>✓ 1 WhatsApp Bot</li>
              <li>✓ Up to 1,000 Vectors</li>
              <li>✓ Community Support</li>
            </ul>
          </div>
          <button className="mt-8 w-full py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium text-sm transition-colors">
            Get Started
          </button>
        </div>

        <div className="glass-panel p-8 rounded-2xl border border-purple-500/50 relative flex flex-col justify-between bg-purple-950/20">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-purple-600 text-white text-xs font-semibold rounded-full">Popular</div>
          <div>
            <h3 className="text-lg font-semibold text-purple-300">Pro Business</h3>
            <div className="text-4xl font-bold text-white my-4">$149<span className="text-sm font-normal text-gray-400">/mo</span></div>
            <ul className="space-y-3 text-sm text-gray-400">
              <li>✓ Unlimited WhatsApp Bots</li>
              <li>✓ 50,000 Vectors</li>
              <li>✓ IVR & AI Calling Access</li>
            </ul>
          </div>
          <button className="mt-8 w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-medium text-sm transition-colors shadow-lg shadow-purple-500/30">
            Start Pro Trial
          </button>
        </div>

        <div className="glass-panel p-8 rounded-2xl border border-white/10 flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-300">Enterprise</h3>
            <div className="text-4xl font-bold text-white my-4">$499<span className="text-sm font-normal text-gray-400">/mo</span></div>
            <ul className="space-y-3 text-sm text-gray-400">
              <li>✓ Dedicated Qdrant Node</li>
              <li>✓ Custom Voice Fine-Tuning</li>
              <li>✓ 24/7 SLA Support</li>
            </ul>
          </div>
          <button className="mt-8 w-full py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium text-sm transition-colors">
            Contact Sales
          </button>
        </div>
      </div>
    </div>
  );
}
