import { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Shield, ArrowLeft, Calendar, User, Tag } from 'lucide-react';
import { motion } from 'framer-motion';
import { POSTS } from '../lib/data';

export default function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>();
  const post = POSTS.find(p => p.slug === slug);

  useEffect(() => {
    if (post) {
      document.title = `${post.title} — ChainGuard AI Blog`;
    } else {
      document.title = 'Post Not Found — ChainGuard AI';
    }
  }, [post]);

  if (!post) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-3xl font-bold font-display mb-4">Post not found</h1>
          <p className="text-zinc-400 mb-6">The post you're looking for doesn't exist or has been moved.</p>
          <Link to="/blog" className="text-emerald-400 hover:text-emerald-300 flex items-center justify-center gap-2">
            <ArrowLeft size={16} /> Back to Blog
          </Link>
        </div>
      </div>
    );
  }

  // Parse markdown-like content into basic paragraphs (simplistic parsing for the mock data)
  const paragraphs = post.content.split('\n\n').filter(p => p.trim() !== '');

  return (
    <div className="min-h-screen bg-zinc-950 text-white selection:bg-emerald-500/30">
      {/* Navbar Minimal */}
      <nav className="sticky top-0 z-50 border-b border-zinc-800/60 bg-zinc-950/80 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center">
              <Shield size={16} className="text-white" />
            </div>
            <span className="font-bold text-white">ChainGuard AI</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/pricing" className="text-sm text-zinc-400 hover:text-white transition-colors">Pricing</Link>
            <Link to="/about" className="text-sm text-zinc-400 hover:text-white transition-colors">About</Link>
            <Link to="/blog" className="text-sm text-white hover:text-emerald-400 font-medium transition-colors">Blog</Link>
          </div>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-4 py-16 pb-24">
        <Link to="/blog" className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white mb-10 transition-colors group">
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Back to all posts
        </Link>

        <article>
          <header className="mb-12">
            <div className="flex items-center gap-2 mb-6">
              <span className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-3 py-1.5 rounded-md shadow-sm">
                <Tag size={14} /> {post.category}
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl font-black font-display leading-[1.1] mb-6 tracking-tight text-zinc-50">
              {post.title}
            </h1>

            <p className="text-xl text-zinc-400 leading-relaxed mb-8">
              {post.excerpt}
            </p>

            <div className="flex items-center gap-6 text-sm text-zinc-500 border-t border-b border-zinc-800/60 py-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center">
                  <User size={14} className="text-zinc-300" />
                </div>
                <div>
                  <div className="font-medium text-zinc-200">{post.author}</div>
                  <div className="text-xs">Author</div>
                </div>
              </div>
              <div className="h-8 w-px bg-zinc-800/60"></div>
              <div className="flex items-center gap-2">
                <Calendar size={16} className="text-zinc-400" />
                <span>{post.date}</span>
              </div>
            </div>
          </header>

          <div className="prose prose-invert prose-zinc max-w-none prose-headings:font-display prose-headings:font-bold prose-h2:text-3xl prose-h2:mt-12 prose-h2:mb-6 prose-p:text-zinc-300 prose-p:leading-relaxed prose-p:text-[17px] prose-a:text-emerald-400 prose-li:text-zinc-300">
            {paragraphs.map((para, i) => {
              if (para.startsWith('## ')) {
                return <h2 key={i}>{para.replace('## ', '')}</h2>;
              } else if (para.startsWith('### ')) {
                return <h3 key={i} className="text-2xl font-bold mt-10 mb-4 font-display">{para.replace('### ', '')}</h3>;
              } else if (para.startsWith('> ')) {
                return <blockquote key={i} className="border-l-4 border-emerald-500 pl-4 py-2 italic text-zinc-300 bg-zinc-900/40 rounded-r-lg my-6">{para.replace('> ', '')}</blockquote>;
              } else if (para.startsWith('* ')) {
                const items = para.split('\n').filter(p => p.startsWith('* '));
                return (
                  <ul key={i} className="list-disc pl-5 space-y-2 my-6">
                    {items.map((item, j) => {
                      const html = item.replace('* **', '<strong>').replace('**:', ':</strong>').replace('* ', '');
                      return <li key={j} dangerouslySetInnerHTML={{ __html: html }} />;
                    })}
                  </ul>
                )
              }
              return <p key={i}>{para}</p>;
            })}
          </div>
        </article>
      </main>
    </div>
  );
}
