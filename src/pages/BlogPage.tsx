import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Shield, ArrowRight, Calendar, User, Tag } from 'lucide-react';
import { motion } from 'framer-motion';

import { POSTS } from '../lib/data';

export default function BlogPage() {
  useEffect(() => { document.title = 'Blog — ChainGuard AI'; }, []);

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Navbar Minimal */}
      <nav className="sticky top-0 z-50 border-b border-zinc-800/60 bg-zinc-950/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center">
              <Shield size={16} className="text-white" />
            </div>
            <span className="font-bold text-white">ChainGuard AI</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/pricing" className="text-sm text-zinc-400 hover:text-white transition-colors">Pricing</Link>
            <Link to="/about" className="text-sm text-zinc-400 hover:text-white transition-colors">About</Link>
            <Link to="/contact" className="text-sm text-zinc-400 hover:text-white transition-colors">Contact</Link>
          </div>
        </div>
      </nav>

      {/* Header */}
      <section className="py-20 px-4 border-b border-zinc-800/40 bg-zinc-900/20">
        <div className="max-w-6xl mx-auto text-center">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl sm:text-5xl font-black font-display mb-4"
          >
            Insights & Updates
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-zinc-400 max-w-2xl mx-auto text-lg"
          >
            Research, engineering technical deep-dives, and company news from the ChainGuard team.
          </motion.p>
        </div>
      </section>

      {/* Blog Grid */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {POSTS.map((post, i) => (
              <Link key={post.slug} to={`/blog/${post.slug}`} className="group block">
                <motion.article 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * i }}
                  className="flex flex-col h-full bg-zinc-900/40 border border-zinc-800/60 rounded-2xl overflow-hidden group-hover:border-zinc-700 group-hover:bg-zinc-900/80 transition-all cursor-pointer"
                >
                  {/* Image Placeholder */}
                  <div className={`h-48 ${post.image} border-b relative`}>
                      <div className="absolute inset-0 flex items-center justify-center opacity-20 group-hover:scale-110 transition-transform duration-500">
                          <Shield size={64} className="text-white" />
                      </div>
                  </div>
                  
                  <div className="p-6 flex flex-col flex-1">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-md">
                        <Tag size={12} /> {post.category}
                      </span>
                    </div>
                    
                    <h2 className="text-xl font-bold font-display mb-3 group-hover:text-emerald-400 transition-colors">
                      {post.title}
                    </h2>
                    
                    <p className="text-zinc-400 text-sm leading-relaxed mb-6 flex-1">
                      {post.excerpt}
                    </p>
                    
                    <div className="flex items-center justify-between text-xs text-zinc-500 mt-auto pt-4 border-t border-zinc-800/60">
                      <div className="flex items-center gap-1.5">
                        <User size={14} /> {post.author}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Calendar size={14} /> {post.date}
                      </div>
                    </div>
                  </div>
                </motion.article>
              </Link>
            ))}
          </div>

          <div className="mt-16 flex justify-center">
            <button className="px-6 py-2.5 rounded-xl border border-zinc-700 text-zinc-300 hover:bg-zinc-800 transition-colors font-medium text-sm">
              Load More Posts
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
