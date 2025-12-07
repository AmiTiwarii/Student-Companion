'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { searchFlights } from '@/lib/flights';
import GlassCard from '@/components/ui/GlassCard';
import PrimaryButton from '@/components/ui/PrimaryButton';

const hotels = [
  { id: '1', name: 'Taj Hotel', location: 'Mumbai', price: 8500, rating: 4.8 },
  { id: '2', name: 'Oberoi Grand', location: 'Mumbai', price: 12000, rating: 4.9 },
  { id: '3', name: 'ITC Maratha', location: 'Mumbai', price: 9500, rating: 4.7 },
];

export default function TravelPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [date, setDate] = useState('');
  const [showFlights, setShowFlights] = useState(false);
  const [showHotels, setShowHotels] = useState(false);
  const [flights, setFlights] = useState<import('@/lib/flights').Flight[]>([]);
  const [hotels, setHotels] = useState<any[]>([]); // Using any for simplicity in this iteration
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingHotels, setIsLoadingHotels] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    // Load Razorpay script
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const handleSearch = async () => {
    if (!from || !to) {
      alert('Please enter both From and To cities');
      return;
    }
    setIsSearching(true);
    setShowFlights(true);
    setHotels([]); // Reset hotels on new search
    setShowHotels(false);

    try {
      const results = await searchFlights(from, to, date);
      setFlights(results);
    } catch (error) {
      console.error('Failed to fetch flights', error);
      alert('Failed to fetch flights. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const fetchHotels = async () => {
    const destination = to || 'Mumbai'; // Default to Mumbai (or last searched destination)
    setIsLoadingHotels(true);
    setShowHotels(true);
    try {
      const res = await fetch(`/api/hotels?city=${encodeURIComponent(destination)}`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setHotels(data);
      } else {
        setHotels([]);
        console.error('Invalid hotel data', data);
      }
    } catch (error) {
      console.error('Failed to fetch hotels', error);
      alert('Failed to fetch hotels. Please try again.');
    } finally {
      setIsLoadingHotels(false);
    }
  };

  const handlePayment = async (amount: number, description: string) => {
    try {
      const res = await fetch('/api/payment/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount }),
      });

      if (!res.ok) {
        throw new Error('Failed to create order');
      }

      const order = await res.json();

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID, // Ensure this env var is exposed to client
        amount: order.amount,
        currency: order.currency,
        name: 'Student Companion',
        description: description,
        order_id: order.id,
        handler: function (response: any) {
          alert(`Payment Successful! Payment ID: ${response.razorpay_payment_id}`);
          // Verify payment on backend if needed
        },
        prefill: {
          name: user?.displayName || 'Student',
          email: user?.email || 'student@example.com',
        },
        theme: {
          color: '#3399cc',
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();

    } catch (error) {
      console.error('Payment failed', error);
      alert('Failed to initiate payment. Check console/API keys.');
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-2">Travel Planner ✈️</h1>
      <p className="text-gray-300 mb-8">Search flights and hotels</p>

      <GlassCard className="mb-6">
        <h2 className="text-2xl font-bold mb-4">Search Flights</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <input
            type="text"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            placeholder="From (e.g., Delhi)"
            className="px-4 py-3 rounded-xl bg-white/10 border border-white/20 focus:border-neon-purple focus:outline-none"
          />
          <input
            type="text"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            placeholder="To (e.g., Mumbai)"
            className="px-4 py-3 rounded-xl bg-white/10 border border-white/20 focus:border-neon-purple focus:outline-none"
          />
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="px-4 py-3 rounded-xl bg-white/10 border border-white/20 focus:border-neon-purple focus:outline-none"
          />
        </div>
        <PrimaryButton onClick={handleSearch} disabled={isSearching} className="w-full">
          {isSearching ? 'Searching...' : 'Search Flights'}
        </PrimaryButton>
      </GlassCard>

      {showFlights && (
        <>
          <h2 className="text-2xl font-bold mb-4">Available Flights</h2>
          {isSearching ? (
            <div className="text-center py-8">Searching for best flights...</div>
          ) : flights.length === 0 ? (
            <div className="text-center py-8 text-gray-400">No flights found. Try different cities or dates.</div>
          ) : (
            <div className="space-y-4 mb-6">
              {flights.map((flight) => (
                <GlassCard key={flight.id}>
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-2xl">✈️</span>
                        <div>
                          <h3 className="text-xl font-semibold">{flight.airline}</h3>
                          <p className="text-sm text-gray-400">{flight.flightNumber}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <div>
                          <p className="text-gray-400">From</p>
                          <p className="font-semibold">{flight.from}</p>
                          <p className="text-neon-cyan">{flight.departure}</p>
                        </div>
                        <div className="text-gray-400">→ {flight.duration} →</div>
                        <div>
                          <p className="text-gray-400">To</p>
                          <p className="font-semibold">{flight.to}</p>
                          <p className="text-neon-cyan">{flight.arrival}</p>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-green-400">₹{flight.price}</p>
                      <p className="text-xs text-gray-400 mb-2">{flight.seats} seats left</p>
                      <div className="flex gap-2">
                        <PrimaryButton onClick={() => handlePayment(flight.price, `Flight ${flight.flightNumber}`)}>
                          Book (₹{flight.price})
                        </PrimaryButton>
                        <button
                          onClick={() => window.open('https://www.goindigo.in/', '_blank')}
                          className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 transition-all text-xs"
                        >
                          View on Site
                        </button>
                      </div>
                    </div>
                  </div>
                </GlassCard>
              ))}
            </div>
          )}
        </>
      )}

      <GlassCard className="mb-6">
        <h2 className="text-2xl font-bold mb-4">Search Hotels {to ? `in ${to}` : ''}</h2>
        <PrimaryButton onClick={fetchHotels} disabled={isLoadingHotels} className="w-full">
          {isLoadingHotels ? 'Loading Hotels...' : 'Show Available Hotels'}
        </PrimaryButton>
      </GlassCard>

      {showHotels && (
        <>
          <h2 className="text-2xl font-bold mb-4">Available Hotels</h2>
          {isLoadingHotels ? (
            <div className="text-center py-8">Finding best hotels...</div>
          ) : hotels.length === 0 ? (
            <div className="text-center py-8 text-gray-400">No hotels found. Try a different city.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {hotels.map((hotel) => (
                <GlassCard key={hotel.id}>
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="text-xl font-semibold">{hotel.name}</h3>
                      <p className="text-sm text-gray-400">📍 {hotel.location}</p>
                      <p className="text-sm text-yellow-400">⭐ {hotel.rating ? hotel.rating.toFixed(1) : 'N/A'}</p>
                    </div>
                    <p className="text-xl font-bold text-green-400">₹{hotel.price}/night</p>
                  </div>
                  <div className="flex gap-2">
                    <PrimaryButton onClick={() => handlePayment(hotel.price, `Hotel Stay at ${hotel.name}`)} className="flex-1">
                      Book Now
                    </PrimaryButton>
                    <button
                      onClick={() => window.open('https://www.google.com/travel/hotels', '_blank')}
                      className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 transition-all text-xs"
                    >
                      Compare
                    </button>
                  </div>
                </GlassCard>
              ))}
            </div>
          )}
        </>
      )}

      <GlassCard>
        <h2 className="text-2xl font-bold mb-4">💳 Travel Payment</h2>
        <p className="text-gray-300 mb-4">Secure Payment Gateway Integrated via Razorpay</p>
        <div className="bg-white/5 p-4 rounded-xl mb-4">
          <p className="text-sm">Trusted by millions of students.</p>
        </div>
      </GlassCard>
    </div>
  );
}
