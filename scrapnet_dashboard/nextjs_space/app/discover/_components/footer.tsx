import Link from 'next/link'

const navLinks = [
  { label: 'Home', href: '/' },
  { label: 'BedrockFAD', href: '/bedrockfad' },
  { label: 'Legacy Healer', href: '/legacy-healer' },
  { label: 'Ledger', href: '/ledger' },
  { label: 'Vault', href: '/vault' },
]

export function DiscoverFooter() {
  return (
    <footer className="border-t border-gray-800/60 py-16 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="url(#footer-grad)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <defs>
                  <linearGradient id="footer-grad" x1="0" y1="0" x2="24" y2="24">
                    <stop offset="0%" stopColor="#10B981" />
                    <stop offset="100%" stopColor="#8B5CF6" />
                  </linearGradient>
                </defs>
                <polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2" />
                <line x1="12" y1="22" x2="12" y2="15.5" />
                <polyline points="22 8.5 12 15.5 2 8.5" />
              </svg>
              <span className="font-display text-lg font-bold text-white">Bedrock ESG</span>
            </div>
            <p className="text-sm text-gray-500 leading-relaxed max-w-xs">
              Sovereign carbon verification. Every kilowatt measured, every proof verified, every record immutable.
            </p>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="font-semibold text-white text-sm mb-4">Platform</h4>
            <ul className="space-y-3">
              {(navLinks ?? []).map((link: typeof navLinks[0]) => (
                <li key={link?.href ?? ''}>
                  <Link
                    href={link?.href ?? '/'}
                    className="text-sm text-gray-400 hover:text-emerald-400 transition-colors duration-200"
                  >
                    {link?.label ?? ''}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Compliance */}
          <div>
            <h4 className="font-semibold text-white text-sm mb-4">Compliance</h4>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-sm text-gray-400">GENIUS Act 2026 Compliant</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-block w-2 h-2 rounded-full bg-purple-500" />
                <span className="text-sm text-gray-400">Solana Token-2022</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-block w-2 h-2 rounded-full bg-cyan-500" />
                <span className="text-sm text-gray-400">PoE Hash Verified</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-800/40 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs text-gray-600">
            © Bedrock ESG. Sovereign carbon verification infrastructure.
          </p>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-3 py-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-xs font-mono">
              Mainnet Live
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
}
