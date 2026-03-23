import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Users, MessageCircle, Shield } from '@phosphor-icons/react';

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#0B0A0F]">
      {/* Navigation */}
      <nav className="glass-effect fixed top-0 left-0 right-0 z-50">
        <div className="max-w-7xl mx-auto px-8 py-6 flex justify-between items-center">
          <h1 className="heading-font text-2xl md:text-3xl font-bold text-[#F7F5F0] tracking-tight">
            Bookup your Hookup
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
              Join Now
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-24 px-8 overflow-hidden">
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: 'url(https://images.pexels.com/photos/5784243/pexels-photo-5784243.jpeg)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0B0A0F]/80 to-[#0B0A0F]" />
        
        <div className="relative max-w-7xl mx-auto text-center">
          <h2 className="heading-font text-5xl sm:text-6xl lg:text-7xl font-bold text-[#F7F5F0] mb-6 tracking-tight">
            North Alabama & South Tennessee
            <br />
            <span className="text-[#D4AF37]">Sexy Swingers</span>
          </h2>
          <p className="text-lg md:text-xl text-[#A8A3B2] max-w-3xl mx-auto mb-12">
            An exclusive, private community for couples and singles in North Alabama and Southern Tennessee.
            Connect, explore, and indulge in a sophisticated lifestyle.
          </p>
          <button
            data-testid="hero-get-started-btn"
            onClick={() => navigate('/register')}
            className="px-12 py-4 rounded-full bg-[#B22234] text-[#F7F5F0] text-lg font-semibold hover:bg-[#D62839] transition-all duration-300 transform hover:-translate-y-1 premium-glow"
          >
            Get Started
          </button>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-8 bg-[#14121A]">
        <div className="max-w-7xl mx-auto">
          <h3 className="heading-font text-4xl md:text-5xl font-bold text-[#F7F5F0] text-center mb-16">
            Premium Features
          </h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <FeatureCard
              icon={<Users size={48} weight="duotone" />}
              title="Member Directory"
              description="Browse verified members in your area"
            />
            <FeatureCard
              icon={<MessageCircle size={48} weight="duotone" />}
              title="Private Messaging"
              description="Connect privately with other members"
            />
            <FeatureCard
              icon={<Heart size={48} weight="duotone" />}
              title="Hot Wife Section"
              description="Dedicated space for the hotwife lifestyle"
            />
            <FeatureCard
              icon={<Shield size={48} weight="duotone" />}
              title="Verified & Safe"
              description="All members verified with residency proof"
            />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h3 className="heading-font text-4xl md:text-5xl font-bold text-[#F7F5F0] mb-6">
            Ready to Join?
          </h3>
          <p className="text-lg text-[#A8A3B2] mb-12">
            Start your journey today. Membership verification required.
          </p>
          <button
            data-testid="cta-view-pricing-btn"
            onClick={() => navigate('/pricing')}
            className="px-12 py-4 rounded-full bg-[#D4AF37] text-[#0B0A0F] text-lg font-semibold hover:bg-[#F0C847] transition-all duration-300 transform hover:-translate-y-1"
          >
            View Pricing
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-8 bg-[#14121A] border-t border-[rgba(247,245,240,0.05)]">
        <div className="max-w-7xl mx-auto text-center text-[#757180]">
          <p className="mb-2">Bookup your Hookup - North Alabama & South Tennessee Sexy Swingers, LLC</p>
          <p className="text-sm">For adults 18+ only. Residency verification required.</p>
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
