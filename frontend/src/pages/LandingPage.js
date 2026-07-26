import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Users, Shield, Chat, Sparkle } from '@phosphor-icons/react';

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#0B0A0F]">
      {/* Navigation */}
      <nav className="glass-effect fixed top-0 left-0 right-0 z-50">
        <div className="max-w-7xl mx-auto px-8 py-6 flex justify-between items-center">
          <h1 className="heading-font text-2xl md:text-3xl font-bold text-[#F7F5F0] tracking-tight">
            Swingers Sensation
          </h1>
          <div className="flex gap-4">
            <button
              data-testid="nav-login-btn"
              onClick={() => navigate('/login')}
              className="px-6 py-2 rounded-full border border-[rgba(247,245,240,0.2)] text-[#F7F5F0] hover:bg-[rgba(247,245,240,0.1)] transition-all duration-300"
            >
              Login
            </button>
            <button
              data-testid="nav-register-btn"
              onClick={() => navigate('/register')}
              className="px-6 py-2 rounded-full bg-[#B22234] text-[#F7F5F0] hover:bg-[#D62839] transition-all duration-300"
            >
              Join Free
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section — Steamy banner */}
      <section className="relative pt-32 pb-28 px-8 overflow-hidden min-h-[90vh] flex items-center">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: 'url(https://images.pexels.com/photos/1024960/pexels-photo-1024960.jpeg?auto=compress&cs=tinysrgb&w=2400)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        {/* Layered gradient overlays for "steamy" mood */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-[#0B0A0F]/60 to-[#0B0A0F]" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#B22234]/25 via-transparent to-[#D4AF37]/15 mix-blend-overlay" />
        {/* Soft red haze in corner */}
        <div className="absolute -top-32 -right-32 w-[600px] h-[600px] rounded-full bg-[#B22234]/30 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-[500px] h-[500px] rounded-full bg-[#D4AF37]/20 blur-3xl" />

        <div className="relative max-w-5xl mx-auto text-center w-full">
          {/* FREE Badge */}
          <div className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-[#4CAF50] text-white font-bold mb-8 shadow-lg shadow-[#4CAF50]/20">
            <Sparkle size={18} weight="fill" />
            100% FREE TO JOIN & USE
          </div>

          <h2 className="heading-font text-5xl sm:text-6xl lg:text-8xl font-bold text-[#F7F5F0] mb-6 tracking-tight leading-[1.05]">
            Sinsations
<br />
<span className="text-[#D4AF37] italic">
  Swinger Lifestyle
</span>
          </h2>
          <p className="text-xl md:text-2xl text-[#F7F5F0]/80 max-w-3xl mx-auto mb-10 font-light">
            Where open-minded singles and couples meet, connect, and explore.
<br className="hidden sm:block" />
Private. Secure. Discreet.{" "}
<span className="text-[#D4AF37] font-semibold">
  Live unapologetically.
</span>
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              data-testid="hero-get-started-btn"
              onClick={() => navigate('/register')}
              className="px-12 py-4 rounded-full bg-[#B22234] text-[#F7F5F0] text-lg font-semibold hover:bg-[#D62839] transition-all duration-300 transform hover:-translate-y-1 shadow-xl shadow-[#B22234]/40"
            >
              Join Free Now
            </button>
            <button
              onClick={() => navigate('/guidelines')}
              className="px-12 py-4 rounded-full border-2 border-[#D4AF37] text-[#D4AF37] text-lg font-semibold hover:bg-[#D4AF37] hover:text-[#0B0A0F] transition-all duration-300 backdrop-blur-sm"
            >
              Community Guidelines
            </button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-8 bg-[#14121A]">
        <div className="max-w-7xl mx-auto">
          <h3 className="heading-font text-4xl md:text-5xl font-bold text-[#F7F5F0] text-center mb-4">
            Everything is <span className="text-[#4CAF50]">FREE</span>
          </h3>
          <p className="text-center text-[#A8A3B2] mb-16 max-w-2xl mx-auto">
            No hidden fees, no premium tiers. Just connect with real people.
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <FeatureCard
              icon={<Chat size={48} weight="duotone" />}
              title="Free Messaging"
              description="Unlimited messages, exchange numbers freely"
            />
            <FeatureCard
              icon={<Users size={48} weight="duotone" />}
              title="Member Directory"
              description="Search by city, state or area code"
            />
            <FeatureCard
              icon={<Heart size={48} weight="duotone" />}
              title="Hot Wife Section"
              description="Dedicated space for the hotwife lifestyle"
            />
            <FeatureCard
              icon={<Shield size={48} weight="duotone" />}
              title="Safe & Respectful"
              description="Community focused on respect & consent"
            />
          </div>
        </div>
      </section>

      {/* Community Values */}
      <section className="py-24 px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h3 className="heading-font text-4xl md:text-5xl font-bold text-[#F7F5F0] mb-6">
            Our Simple Rules
          </h3>
          <div className="glass-effect p-8 rounded-2xl mb-8">
            <p className="text-2xl text-[#F7F5F0] mb-4 heading-font italic">
              &ldquo;Be nice. Be respectful. Have fun.&rdquo;
            </p>
            <p className="text-[#A8A3B2]">
              That&apos;s it. We don&apos;t care what you do as long as everyone&apos;s consenting and having a good time.
            </p>
          </div>
          <button
            data-testid="cta-join-btn"
            onClick={() => navigate('/register')}
            className="px-12 py-4 rounded-full bg-[#D4AF37] text-[#0B0A0F] text-lg font-semibold hover:bg-[#F0C847] transition-all duration-300 transform hover:-translate-y-1"
          >
            Join the Community
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-8 bg-[#14121A] border-t border-[rgba(247,245,240,0.05)]">
        <div className="max-w-7xl mx-auto text-center text-[#757180]">
          <p className="mb-2">Swingers Sensation LLC</p>
          <p className="text-sm mb-4">For adults 18+ only. Be respectful.</p>
          <button
            onClick={() => navigate('/support-us')}
            className="text-[#D4AF37] hover:text-[#F0C847] transition-colors text-sm"
          >
            Support This Free Site
          </button>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }) {
  return (
    <div className="glass-effect p-8 rounded-2xl transition-all duration-300 hover:-translate-y-1">
      <div className="text-[#D4AF37] mb-4">{icon}</div>
      <h4 className="heading-font text-xl font-bold text-[#F7F5F0] mb-3">{title}</h4>
      <p className="text-[#A8A3B2]">{description}</p>
    </div>
  );
}
