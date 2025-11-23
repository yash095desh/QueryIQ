'use client'

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-black/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-5 gap-12 mb-12">
          <div>
            <h3 className="text-2xl font-bold gradient-green-text mb-4">QueryIQ</h3>
            <p className="text-gray-400 text-sm">AI-powered database chat assistant</p>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-4">Product</h4>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li><a href="#" className="hover:text-lime-400 transition">Features</a></li>
              <li><a href="#" className="hover:text-lime-400 transition">Pricing</a></li>
              <li><a href="#" className="hover:text-lime-400 transition">Security</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-4">Developers</h4>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li><a href="#" className="hover:text-lime-400 transition">Documentation</a></li>
              <li><a href="#" className="hover:text-lime-400 transition">API Reference</a></li>
              <li><a href="#" className="hover:text-lime-400 transition">Blog</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-4">Company</h4>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li><a href="#" className="hover:text-lime-400 transition">About</a></li>
              <li><a href="#" className="hover:text-lime-400 transition">Contact</a></li>
              <li><a href="#" className="hover:text-lime-400 transition">Careers</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-4">Legal</h4>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li><a href="#" className="hover:text-lime-400 transition">Privacy</a></li>
              <li><a href="#" className="hover:text-lime-400 transition">Terms</a></li>
              <li><a href="#" className="hover:text-lime-400 transition">Cookies</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 pt-8 flex flex-col sm:flex-row justify-between items-center">
          <p className="text-gray-500 text-sm">&copy; 2025 QueryIQ. All rights reserved.</p>
          <div className="flex gap-6 mt-4 sm:mt-0">
            <a href="#" className="text-gray-400 hover:text-lime-400 transition">Twitter</a>
            <a href="#" className="text-gray-400 hover:text-lime-400 transition">LinkedIn</a>
            <a href="#" className="text-gray-400 hover:text-lime-400 transition">GitHub</a>
          </div>
        </div>
      </div>
    </footer>
  )
}
