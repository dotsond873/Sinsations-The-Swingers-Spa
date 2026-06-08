import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Check } from '@phosphor-icons/react';

const plans = [
  {
    id: 'weekly',
    name: 'Weekly',
    price: '$10',
    period: 'per week',
    features: ['Full Member Access', 'Private Messaging', 'Chatrooms & Forums', 'Media Galleries', 'Contest Voting'],
  },
  {
    id: 'monthly',
    name: 'Monthly',
    price: '$29.99',
    period: 'per month',
    features: ['Full Member Access', 'Private Messaging', 'Chatrooms & Forums', 'Media Galleries', 'Contest Voting', 'Priority Support'],
    popular: true,
  },
  {
    id: 'yearly',
    name: 'Yearly',
    price: '$99.99',
    period: 'per year',
    features: ['Full Member Access', 'Private Messaging', 'Chatrooms & Forums', 'Media Galleries', 'Contest Voting', 'Priority Support', 'Save $260/year'],
  },
  {
    id: 'lifetime',
    name: 'Lifetime',
    price: '$199.99',
    period: 'one time',
    features: ['Full Member Access', 'Private Messaging', 'Chatrooms & Forums', 'Media Galleries', 'Contest Voting', 'Priority Support', 'Lifetime Access', 'VIP Badge'],
    premium: true,
  },
];

export default function PricingPage() {
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
            Swingers Sensation
          </h1>
          <div className="flex gap-4">
            <button
              onClick={() => navigate('/login')}
              className="px-6 py-2 rounded-full border border-[rgba(247,245,240,0.2)] text-[#F7F5F0] hover:bg-[rgba(247,245,240,0.1)] transition-all duration-300"
            >
              Login
            </button>
          </div>
        </div>
      </nav>

      {/* Pricing Section */}
      <section className="py-24 px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="heading-font text-4xl sm:text-5xl lg:text-6xl font-bold text-[#F7F5F0] mb-6 tracking-tight">
              Choose Your <span className="text-[#D4AF37]">Membership</span>
            </h2>
            <p className="text-lg md:text-xl text-[#A8A3B2] max-w-3xl mx-auto">
              Select the plan that works best for you. All plans include full access to our exclusive community.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {plans.map((plan) => (
              <PricingCard key={plan.id} plan={plan} navigate={navigate} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function PricingCard({ plan, navigate }) {
  return (
    <div
      className={`glass-effect p-8 rounded-2xl transition-all duration-300 hover:-translate-y-1 relative ${
        plan.popular || plan.premium ? 'border-2 border-[#D4AF37]' : ''
      }`}
    >
      {plan.popular && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-[#D4AF37] text-[#0B0A0F] text-sm font-bold rounded-full">
          MOST POPULAR
        </div>
      )}
      {plan.premium && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-[#B22234] text-[#F7F5F0] text-sm font-bold rounded-full">
          BEST VALUE
        </div>
      )}

      <div className="text-center mb-8">
        <h3 className="heading-font text-2xl font-bold text-[#F7F5F0] mb-2">{plan.name}</h3>
        <div className="mb-2">
          <span className="heading-font text-4xl font-bold text-[#D4AF37]">{plan.price}</span>
        </div>
        <p className="text-[#A8A3B2] text-sm">{plan.period}</p>
      </div>

      <ul className="space-y-3 mb-8">
        {plan.features.map((feature, idx) => (
          <li key={idx} className="flex items-start gap-3">
            <Check size={20} weight="bold" className="text-[#D4AF37] flex-shrink-0 mt-1" />
            <span className="text-[#F7F5F0] text-sm">{feature}</span>
          </li>
        ))}
      </ul>

      <button
        data-testid={`select-plan-${plan.id}-btn`}
        onClick={() => navigate('/register', { state: { planId: plan.id } })}
        className={`w-full py-3 rounded-full font-semibold transition-all duration-300 ${
          plan.popular || plan.premium
            ? 'bg-[#D4AF37] text-[#0B0A0F] hover:bg-[#F0C847]'
            : 'bg-[#B22234] text-[#F7F5F0] hover:bg-[#D62839]'
        }`}
      >
        Select Plan
      </button>
    </div>
  );
}
