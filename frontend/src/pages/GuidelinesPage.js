import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, HandHeart, ShieldCheck, Warning } from '@phosphor-icons/react';

export default function GuidelinesPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#0B0A0F]">
      {/* Navigation */}
      <nav className="glass-effect">
        <div className="max-w-7xl mx-auto px-8 py-6 flex justify-between items-center">
          <h1
            onClick={() => navigate('/')}
            className="heading-font text-2xl md:text-3xl font-bold text-[#F7F5F0] tracking-tight cursor-pointer"
          >
            Bookup your Hookup
          </h1>
          <div className="flex gap-4">
            <button
              onClick={() => navigate('/login')}
              className="px-6 py-2 rounded-full border border-[rgba(247,245,240,0.2)] text-[#F7F5F0] hover:bg-[rgba(247,245,240,0.1)] transition-all duration-300"
            >
              Login
            </button>
            <button
              onClick={() => navigate('/register')}
              className="px-6 py-2 rounded-full bg-[#B22234] text-[#F7F5F0] hover:bg-[#D62839] transition-all duration-300"
            >
              Join Free
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="py-16 px-8 text-center">
        <div className="max-w-4xl mx-auto">
          <div className="inline-block px-6 py-2 rounded-full bg-[#4CAF50] text-white font-bold mb-6">
            100% FREE FOREVER
          </div>
          <h1 className="heading-font text-4xl sm:text-5xl lg:text-6xl font-bold text-[#F7F5F0] mb-6">
            Community <span className="text-[#D4AF37]">Guidelines</span>
          </h1>
          <p className="text-lg md:text-xl text-[#A8A3B2]">
            Our community thrives on respect, consent, and genuine connections.
            Here's how we keep it safe and enjoyable for everyone.
          </p>
        </div>
      </section>

      {/* Guidelines */}
      <section className="py-12 px-8">
        <div className="max-w-4xl mx-auto space-y-8">
          
          <GuidelineCard
            icon={<Heart size={40} weight="fill" className="text-[#B22234]" />}
            title="Be Respectful"
            description="Treat every member with kindness and respect. We're all here to connect and have a good time. No means no - always."
          />

          <GuidelineCard
            icon={<HandHeart size={40} weight="fill" className="text-[#D4AF37]" />}
            title="Consent is Everything"
            description="Always get explicit consent before sharing contact info, photos, or meeting in person. Respect boundaries and communicate openly."
          />

          <GuidelineCard
            icon={<ShieldCheck size={40} weight="fill" className="text-[#4CAF50]" />}
            title="Keep It Safe"
            description="Protect your privacy and others'. Don't share personal information publicly. Meet in safe, public places first. Trust your instincts."
          />

          <GuidelineCard
            icon={<Warning size={40} weight="fill" className="text-[#FF9800]" />}
            title="Zero Tolerance Policy"
            items={[
              "No harassment, bullying, or hate speech",
              "No unsolicited explicit content",
              "No fake profiles or catfishing",
              "No spam or commercial solicitation",
              "No illegal activities"
            ]}
          />

        </div>
      </section>

      {/* Free Features */}
      <section className="py-16 px-8 bg-[#14121A]">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="heading-font text-3xl md:text-4xl font-bold text-[#F7F5F0] mb-8">
            Everything is <span className="text-[#4CAF50]">FREE</span>
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <FreeFeature title="Free Messaging" description="Unlimited messages, exchange numbers freely" />
            <FreeFeature title="Free Chatrooms" description="Connect with multiple members live" />
            <FreeFeature title="Free Forums" description="Join discussions, share experiences" />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="heading-font text-3xl md:text-4xl font-bold text-[#F7F5F0] mb-4">
            Ready to Join?
          </h2>
          <p className="text-[#A8A3B2] mb-8">
            Be nice. Be respectful. Have fun.
          </p>
          <button
            onClick={() => navigate('/register')}
            className="px-12 py-4 rounded-full bg-[#B22234] text-[#F7F5F0] text-lg font-semibold hover:bg-[#D62839] transition-all duration-300"
          >
            Join Free Now
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-8 bg-[#14121A] border-t border-[rgba(247,245,240,0.05)]">
        <div className="max-w-7xl mx-auto text-center text-[#757180]">
          <p className="mb-2">Bookup your Hookup - North Alabama & South Tennessee Sexy Swingers, LLC</p>
          <p className="text-sm">For adults 18+ only. Be respectful.</p>
        </div>
      </footer>
    </div>
  );
}

function GuidelineCard({ icon, title, description, items }) {
  return (
    <div className="glass-effect p-8 rounded-2xl">
      <div className="flex items-start gap-6">
        <div className="flex-shrink-0">{icon}</div>
        <div>
          <h3 className="heading-font text-2xl font-bold text-[#F7F5F0] mb-3">{title}</h3>
          {description && <p className="text-[#A8A3B2]">{description}</p>}
          {items && (
            <ul className="space-y-2 mt-3">
              {items.map((item, idx) => (
                <li key={idx} className="text-[#A8A3B2] flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#B22234]"></span>
                  {item}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function FreeFeature({ title, description }) {
  return (
    <div className="glass-effect p-6 rounded-2xl">
      <h3 className="heading-font text-xl font-bold text-[#D4AF37] mb-2">{title}</h3>
      <p className="text-[#A8A3B2] text-sm">{description}</p>
    </div>
  );
}
