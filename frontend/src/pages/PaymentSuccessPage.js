import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { API } from '../App';
import { toast } from 'sonner';
import { CheckCircle, Crown } from '@phosphor-icons/react';

export default function PaymentSuccessPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [status, setStatus] = useState('checking');
  const [plan, setPlan] = useState(null);

  useEffect(() => {
    if (!sessionId) {
      navigate('/pricing');
      return;
    }

    const checkPaymentStatus = async () => {
      try {
        const response = await axios.get(`${API}/payment/status/${sessionId}`, {
          withCredentials: true,
        });

        if (response.data.status === 'paid') {
          setStatus('paid');
          setPlan(response.data.plan);
          toast.success('Payment successful! Welcome to premium.');
        } else {
          setStatus('pending');
          // Poll again after 2 seconds
          setTimeout(checkPaymentStatus, 2000);
        }
      } catch (error) {
        setStatus('error');
        toast.error('Payment verification failed');
      }
    };

    checkPaymentStatus();
  }, [sessionId, navigate]);

  return (
    <div className="min-h-screen bg-[#0B0A0F] flex items-center justify-center px-8">
      <div className="max-w-md w-full text-center">
        {status === 'checking' && (
          <div>
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#D4AF37] border-t-transparent mx-auto mb-6"></div>
            <h2 className="heading-font text-2xl font-bold text-[#F7F5F0] mb-3">
              Verifying Payment...
            </h2>
            <p className="text-[#A8A3B2]">Please wait while we confirm your payment.</p>
          </div>
        )}

        {status === 'pending' && (
          <div>
            <div className="animate-pulse rounded-full h-16 w-16 bg-[#D4AF37] mx-auto mb-6 flex items-center justify-center">
              <Crown size={32} weight="fill" className="text-[#0B0A0F]" />
            </div>
            <h2 className="heading-font text-2xl font-bold text-[#F7F5F0] mb-3">
              Processing Payment...
            </h2>
            <p className="text-[#A8A3B2]">Your payment is being processed. This may take a moment.</p>
          </div>
        )}

        {status === 'paid' && (
          <div data-testid="payment-success-message">
            <div className="rounded-full h-16 w-16 bg-[#4CAF50] mx-auto mb-6 flex items-center justify-center">
              <CheckCircle size={40} weight="fill" className="text-white" />
            </div>
            <h2 className="heading-font text-3xl font-bold text-[#F7F5F0] mb-3">
              Payment Successful!
            </h2>
            <p className="text-[#A8A3B2] mb-2">
              You're now a <span className="text-[#D4AF37] font-bold">{plan?.toUpperCase()}</span> member!
            </p>
            <p className="text-[#A8A3B2] mb-8">
              Welcome to the exclusive club. Enjoy all premium features.
            </p>
            <button
              data-testid="go-to-dashboard-btn"
              onClick={() => navigate('/dashboard')}
              className="px-12 py-4 rounded-full bg-[#D4AF37] text-[#0B0A0F] text-lg font-semibold hover:bg-[#F0C847] transition-all duration-300"
            >
              Go to Dashboard
            </button>
          </div>
        )}

        {status === 'error' && (
          <div>
            <h2 className="heading-font text-2xl font-bold text-[#E53935] mb-3">
              Payment Verification Failed
            </h2>
            <p className="text-[#A8A3B2] mb-8">
              We couldn't verify your payment. Please contact support.
            </p>
            <button
              onClick={() => navigate('/dashboard')}
              className="px-12 py-4 rounded-full bg-[#B22234] text-[#F7F5F0] font-semibold hover:bg-[#D62839] transition-all duration-300"
            >
              Return to Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
