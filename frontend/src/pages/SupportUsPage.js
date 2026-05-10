import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API } from '../App';
import { Heart, Coffee, Star, Rocket } from '@phosphor-icons/react';
import { toast } from 'sonner';

const DONATION_AMOUNTS = [
  { amount: 5, label: '$5', icon: Coffee, description: 'Buy us a coffee' },
  { amount: 10, label: '$10', icon: Heart, description: 'Show some love' },
  { amount: 25, label: '$25', icon: Star, description: 'Amazing support' },
  { amount: 50, label: '$50', icon: Rocket, description: 'Keep us running' },
];

export default function SupportUsPage() {
  const navigate = useNavigate();
  const [selectedAmount, setSelectedAmount] = useState(null);
  const [customAmount, setCustomAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const handleDonate = async () => {
    const amount = selectedAmount || parseFloat(customAmount);
    
    if (!amount || amount < 1) {
      toast.error('Please select or enter a donation amount');
      return;
    }

    try {
      setLoading(true);
      const originUrl = window.location.origin;
      const response = await axios.post(`${API}/donation/checkout`, {
        amount: amount,
        origin_url: originUrl
      }, { withCredentials: true });
      
      window.location.href = response.data.url;
    } catch (error) {
      toast.error('Failed to process donation. Please try again.');
    } finally {
      setLoading(false);
    }
  };

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
          <button
            onClick={() => navigate('/dashboard')}
            className="px-6 py-2 rounded-full border border-[rgba(247,245,240,0.2)] text-[#F7F5F0] hover:bg-[rgba(247,245,240,0.1)] transition-all duration-300"
          >
            Back to Site
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="py-16 px-8">
        <div className="max-w-4xl mx-auto text-center">
          <Heart size={64} weight="fill" className="text-[#B22234] mx-auto mb-6" />
          <h1 className="heading-font text-4xl sm:text-5xl lg:text-6xl font-bold text-[#F7F5F0] mb-6">
            Support Our <span className="text-[#D4AF37]">Community</span>
          </h1>
          <p className="text-lg text-[#A8A3B2] mb-4">
            This site is 100% FREE and always will be.
          </p>
          <p className="text-[#A8A3B2]">
            But servers, development, and maintenance cost money. Your donation helps keep us online.
          </p>
        </div>
      </section>

      {/* Mission Statement */}
      <section className="py-12 px-8 bg-[#14121A]">
        <div className="max-w-4xl mx-auto">
          <div className="glass-effect p-8 md:p-12 rounded-2xl border-2 border-[#D4AF37]">
            <h2 className="heading-font text-2xl md:text-3xl font-bold text-[#D4AF37] mb-6 text-center">
              Our Mission
            </h2>
            <div className="text-[#F7F5F0] text-lg leading-relaxed space-y-4">
              <p>
                I myself being in the lifestyle know firsthand about the frustrations with high-priced websites 
                to stay in the loop with swingers near you and worldwide.
              </p>
              <p>
                You pay and then it seems like all your messages are from fake profiles and scammers 
                asking for CashApps for gas to meet up.
              </p>
              <p className="text-[#B22234] font-bold">
                I will ban anyone here trying to run game or steal money.
              </p>
              <p className="text-[#D4AF37] font-bold text-xl">
                I made this FREE FOR EVERYONE AND EVERY PART IS FREE.
              </p>
              <p>
                I need everyone to be respectful and mindful of everyone else. If you have an issue, 
                come to admin with it and I'll resolve it.
              </p>
              <p className="text-2xl font-bold text-center mt-8 text-[#F7F5F0]">
                It's fee-free. Have fun.
              </p>
            </div>
            <p className="text-right text-[#A8A3B2] mt-6 italic">
              — The Admin Team
            </p>
          </div>
        </div>
      </section>

      {/* Donation Section */}
      <section className="py-16 px-8">
        <div className="max-w-2xl mx-auto">
          <h2 className="heading-font text-3xl font-bold text-[#F7F5F0] text-center mb-8">
            Make a Donation
          </h2>
          <p className="text-center text-[#A8A3B2] mb-8">
            Any amount helps keep the lights on. Thank you for your support!
          </p>

          {/* Preset Amounts */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {DONATION_AMOUNTS.map(({ amount, label, icon: Icon, description }) => (
              <button
                key={amount}
                onClick={() => {
                  setSelectedAmount(amount);
                  setCustomAmount('');
                }}
                className={`p-6 rounded-2xl transition-all ${
                  selectedAmount === amount
                    ? 'bg-[#D4AF37] text-[#0B0A0F]'
                    : 'glass-effect text-[#F7F5F0] hover:border-[#D4AF37]'
                }`}
              >
                <Icon size={32} weight="fill" className={`mx-auto mb-2 ${selectedAmount === amount ? 'text-[#0B0A0F]' : 'text-[#D4AF37]'}`} />
                <p className="text-2xl font-bold">{label}</p>
                <p className={`text-sm ${selectedAmount === amount ? 'text-[#0B0A0F]/70' : 'text-[#A8A3B2]'}`}>
                  {description}
                </p>
              </button>
            ))}
          </div>

          {/* Custom Amount */}
          <div className="glass-effect p-6 rounded-2xl mb-8">
            <label className="block text-[#F7F5F0] font-medium mb-3">
              Or enter a custom amount:
            </label>
            <div className="flex items-center gap-4">
              <span className="text-2xl text-[#D4AF37] font-bold">$</span>
              <input
                type="number"
                min="1"
                value={customAmount}
                onChange={(e) => {
                  setCustomAmount(e.target.value);
                  setSelectedAmount(null);
                }}
                placeholder="Enter amount"
                className="flex-1 px-4 py-3 bg-[#1C1A24] border border-[rgba(247,245,240,0.1)] rounded-lg text-[#F7F5F0] text-xl focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
              />
            </div>
          </div>

          {/* Donate Button */}
          <button
            onClick={handleDonate}
            disabled={loading || (!selectedAmount && !customAmount)}
            className="w-full py-4 rounded-full bg-[#B22234] text-[#F7F5F0] text-xl font-bold hover:bg-[#D62839] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
          >
            <Heart size={24} weight="fill" />
            {loading ? 'Processing...' : `Donate ${selectedAmount ? `$${selectedAmount}` : customAmount ? `$${customAmount}` : ''}`}
          </button>

          <p className="text-center text-[#757180] text-sm mt-6">
            Secure payment powered by Stripe. All donations are one-time and non-refundable.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-8 bg-[#14121A] border-t border-[rgba(247,245,240,0.05)]">
        <div className="max-w-7xl mx-auto text-center text-[#757180]">
          <p className="mb-2">Bookup your Hookup - North Alabama & South Tennessee Sexy Swingers, LLC</p>
          <p className="text-sm">100% Free. Forever. Thank you for your support.</p>
        </div>
      </footer>
    </div>
  );
}
