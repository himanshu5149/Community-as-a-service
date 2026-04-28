import React from 'react';
import { Link } from 'react-router-dom';
import { BrandLogo } from './BrandLogo';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  
  const sections = [
    {
      title: 'Ecosystem',
      links: [
        { name: 'Groups Feed', href: '/groups' },
        { name: 'Direct Signals', href: '/messages' },
        { name: 'Global Events', href: '/events' },
        { name: 'Spaces', href: '/spaces' },
      ]
    },
    {
      title: 'Intelligence',
      links: [
        { name: 'AI Nexus', href: '/ai' },
        { name: 'Blog Protocols', href: '/blog' },
        { name: 'Waitlist', href: '/pricing' },
        { name: 'Analytics', href: '/admin' },
      ]
    },
    {
      title: 'Support',
      links: [
        { name: 'How It Works', href: '/how-it-works' },
        { name: 'About CaaS', href: '/about' },
        { name: 'Contact Link', href: '/contact' },
        { name: 'Security Spec', href: '/about' },
      ]
    }
  ];

  return (
    <footer className="bg-bg-dark text-gray-400 py-24 px-6 md:px-10 border-t border-white/5 relative overflow-hidden">
      {/* Background Accent */}
      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
      
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-16 mb-20">
          <div className="lg:col-span-2 space-y-8">
            <Link to="/" className="flex items-center gap-3 active:scale-95 transition-transform w-fit">
              <BrandLogo className="w-10 h-10" />
              <span className="text-2xl font-black text-white tracking-tighter uppercase">CaaS</span>
            </Link>
            <p className="max-w-xs text-sm font-medium leading-relaxed">
              Your community, delivered as an autonomous service. Powered by advanced neural links and community-first protocols.
            </p>
            <div className="flex gap-4">
              {['Twitter', 'Discord', 'GitHub'].map(social => (
                <a 
                  key={social}
                  href="#"
                  className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center hover:bg-primary/20 hover:border-primary/20 transition-all group"
                >
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 group-hover:text-white transition-colors">{social[0]}</span>
                </a>
              ))}
            </div>
          </div>

          {sections.map(section => (
            <div key={section.title} className="space-y-6">
              <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">{section.title}</h4>
              <ul className="space-y-4">
                {section.links.map(link => (
                  <li key={link.name}>
                    <Link 
                      to={link.href} 
                      className="text-sm font-bold text-gray-500 hover:text-primary hover:translate-x-1 transition-all inline-block"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="pt-10 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-700">
            © {currentYear} Community as a Service. All Rights Reserved. Protocol v1.0.4-L
          </div>
          <div className="flex gap-8">
            <Link to="/about" className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-700 hover:text-white transition-colors">Privacy Policy</Link>
            <Link to="/about" className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-700 hover:text-white transition-colors">Terms of Signal</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
