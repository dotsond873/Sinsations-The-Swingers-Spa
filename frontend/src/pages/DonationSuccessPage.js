import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, CheckCircle } from '@phosphor-icons/react';

export default function DonationSuccessPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#0B0A0F] flex items-center justify-center px-8">
      <div className="max-w-md w-full text-center">
        <div className="glass-effect p-12 rounded-2xl">
          <div className="relative inline-block mb-6">
            <Heart size={80} weight="fill" className="text-[#B22234]" />
            <CheckCircle size={32} weight="fill" className="text-[#4CAF50] absolute -bottom-1 -right-1" />
          </div>
          
          <h1 className="heading-font text-4xl font-bold text-[#F7F5F0] mb-4">
            Thank You!
          </h1>
          
          <p className="text-[#A8A3B2] mb-2">
            Your donation means the world to us.
          </p>
          <p className="text-[#A8A3B2] mb-8">
            You're helping keep this community free for everyone.
          </p>
          
          <div className="glass-effect p-4 rounded-xl mb-8 border border-[#D4AF37]">
            <p className="text-[#D4AF37] font-semibold">
              "It's fee-free. Have fun."
            </p>
          </div>
          
          <button
            onClick={() => navigate('/dashboard')}
            className="px-12 py-4 rounded-full bg-[#D4AF37] text-[#0B0A0F] text-lg font-semibold hover:bg-[#F0C847] transition-all duration-300"
          >
            Back to Site
          </button>
        </div>
      </div>
    </div>
  );
}
