'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { searchFlights } from '@/lib/flights';
import GlassCard from '@/components/ui/GlassCard';
import PrimaryButton from '@/components/ui/PrimaryButton';

export default function TravelPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [date, setDate] = useState('');
  const [showFlights, setShowFlights] = useState(false);
  const [showHotels, setShowHotels] = useState(false);
  const [flights, setFlights] = useState<import('@/lib/flights').Flight[]>([]);
  const [hotels, setHotels] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingHotels, setIsLoadingHotels] = useState(false);

  // Booking Flow State
  const [bookingStep, setBookingStep] = useState<'none' | 'review' | 'processing' | 'success'>('none');
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [timer, setTimer] = useState(15);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'upi'>('card');

  // Passenger Details
  const [passengerDetails, setPassengerDetails] = useState({
    name: '',
    age: '',
    gender: 'Male',
    mealPreference: 'None',
    email: '',
    phone: ''
  });

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    } else if (user && bookingStep === 'none') {
      // Pre-fill name/email if available
      setPassengerDetails(prev => ({
        ...prev,
        name: user.displayName || '',
        email: user.email || ''
      }));
    }
  }, [user, loading, router, bookingStep]);

  // Timer Logic
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (bookingStep === 'processing' && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (bookingStep === 'processing' && timer === 0) {
      setBookingStep('success');
    }
    return () => clearInterval(interval);
  }, [bookingStep, timer]);

  const handleSearch = async () => {
    if (!from || !to) {
      alert('Please enter both From and To cities');
      return;
    }
    setIsSearching(true);
    setShowFlights(true);
    setHotels([]);
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
    const destination = to || 'Mumbai';
    setIsLoadingHotels(true);
    setShowHotels(true);
    try {
      const res = await fetch(`/api/hotels?city=${encodeURIComponent(destination)}`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setHotels(data);
      } else {
        setHotels([]);
      }
    } catch (error) {
      console.error('Failed to fetch hotels', error);
      alert('Failed to fetch hotels. Please try again.');
    } finally {
      setIsLoadingHotels(false);
    }
  };

  const openBooking = (item: any, type: 'flight' | 'hotel') => {
    setSelectedBooking({ ...item, type });
    setBookingStep('review');
    setTimer(15);
  };

  const processBooking = () => {
    if (!passengerDetails.name || !passengerDetails.age || !passengerDetails.email || !passengerDetails.phone) {
      alert('Please fill in all passenger details');
      return;
    }
    setBookingStep('processing');
  };

  const closeBooking = () => {
    setBookingStep('none');
    setSelectedBooking(null);
  };

  const generatePNR = () => {
    return Math.random().toString(36).substr(2, 6).toUpperCase();
  };

  const calculateTaxes = (price: number) => {
    return Math.round(price * 0.18); // 18% Tax
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen text-slate-900 dark:text-white">Loading...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 relative">
      <h1 className="text-4xl font-bold mb-2 text-slate-900 dark:text-white">Travel Planner ✈️</h1>
      <p className="text-slate-600 dark:text-gray-300 mb-8">Search flights and hotels</p>

      {/* Full Screen Booking Overlay */}
      {bookingStep !== 'none' && selectedBooking && (
        <div className="fixed inset-0 z-50 bg-slate-50 dark:bg-slate-900 overflow-y-auto animate-in slide-in-from-bottom duration-300">
          <div className="max-w-6xl mx-auto px-6 py-8">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white">
                {bookingStep === 'success' ? 'Booking Confirmed 🎉' : 'Complete Your Booking'}
              </h2>
              <button
                onClick={closeBooking}
                className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-white/10 text-slate-900 dark:text-white hover:bg-red-500 hover:text-white transition-all"
              >
                {bookingStep === 'success' ? 'Close' : 'Cancel'}
              </button>
            </div>

            {/* Steps Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

              {/* Left/Main Column */}
              <div className="lg:col-span-2 space-y-6">

                {/* Flight/Hotel Summary (Always Visible) */}
                <div className="bg-white dark:bg-white/5 p-6 rounded-2xl shadow-lg border border-gray-100 dark:border-white/10">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4 border-b border-gray-200 dark:border-white/10 pb-2">
                    {selectedBooking.type === 'flight' ? 'Flight Summary' : 'Hotel Details'}
                  </h3>

                  {selectedBooking.type === 'flight' ? (
                    <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-slate-100 dark:bg-white/10 rounded-full flex items-center justify-center text-3xl">
                          ✈️
                        </div>
                        <div>
                          <p className="font-bold text-lg text-slate-900 dark:text-white">{selectedBooking.airline}</p>
                          <p className="text-slate-500 dark:text-gray-400">{selectedBooking.flightNumber}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6 text-center">
                        <div>
                          <p className="text-2xl font-bold text-slate-900 dark:text-white">{selectedBooking.departure}</p>
                          <p className="text-sm text-slate-500 dark:text-gray-400">{selectedBooking.from}</p>
                        </div>
                        <div className="flex flex-col items-center">
                          <p className="text-sm text-slate-400">--- {selectedBooking.duration} ---</p>
                          <p className="text-xs text-green-500 font-medium">Non-stop</p>
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-slate-900 dark:text-white">{selectedBooking.arrival}</p>
                          <p className="text-sm text-slate-500 dark:text-gray-400">{selectedBooking.to}</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-4">
                      <div className="text-4xl">🏨</div>
                      <div>
                        <p className="font-bold text-xl text-slate-900 dark:text-white">{selectedBooking.name}</p>
                        <p className="text-slate-500 dark:text-gray-400">📍 {selectedBooking.location}</p>
                        <p className="text-yellow-500 mt-1">⭐⭐⭐⭐⭐ {selectedBooking.rating} / 5.0</p>
                      </div>
                    </div>
                  )}
                </div>

                {bookingStep === 'review' && (
                  <div className="bg-white dark:bg-white/5 p-6 rounded-2xl shadow-lg border border-gray-100 dark:border-white/10">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6 border-b border-gray-200 dark:border-white/10 pb-2">Passenger Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-gray-300">Full Name</label>
                        <input
                          type="text"
                          value={passengerDetails.name}
                          onChange={(e) => setPassengerDetails({ ...passengerDetails, name: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-slate-900 dark:text-white focus:border-neon-purple focus:outline-none"
                          placeholder="John Doe"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-gray-300">Age</label>
                          <input
                            type="number"
                            value={passengerDetails.age}
                            onChange={(e) => setPassengerDetails({ ...passengerDetails, age: e.target.value })}
                            className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-slate-900 dark:text-white focus:border-neon-purple focus:outline-none"
                            placeholder="20"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-gray-300">Gender</label>
                          <select
                            value={passengerDetails.gender}
                            onChange={(e) => setPassengerDetails({ ...passengerDetails, gender: e.target.value })}
                            className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-slate-900 dark:text-white focus:border-neon-purple focus:outline-none"
                          >
                            <option value="Male" className="text-black">Male</option>
                            <option value="Female" className="text-black">Female</option>
                            <option value="Other" className="text-black">Other</option>
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-gray-300">Email Address</label>
                        <input
                          type="email"
                          value={passengerDetails.email}
                          onChange={(e) => setPassengerDetails({ ...passengerDetails, email: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-slate-900 dark:text-white focus:border-neon-purple focus:outline-none"
                          placeholder="john@example.com"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-gray-300">Phone Number</label>
                        <input
                          type="tel"
                          value={passengerDetails.phone}
                          onChange={(e) => setPassengerDetails({ ...passengerDetails, phone: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-slate-900 dark:text-white focus:border-neon-purple focus:outline-none"
                          placeholder="+91 98765 43210"
                        />
                      </div>
                      {selectedBooking.type === 'flight' && (
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-gray-300">Meal Preference</label>
                          <div className="flex gap-4">
                            {['None', 'Veg', 'Non-Veg', 'Jain'].map((meal) => (
                              <button
                                key={meal}
                                onClick={() => setPassengerDetails({ ...passengerDetails, mealPreference: meal })}
                                className={`px-4 py-2 rounded-lg border transition-all ${passengerDetails.mealPreference === meal
                                  ? 'bg-neon-purple text-white border-neon-purple'
                                  : 'bg-transparent border-gray-300 dark:border-white/20 text-slate-500 dark:text-gray-400 hover:border-neon-purple'}`}
                              >
                                {meal}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {bookingStep === 'processing' && (
                  <div className="bg-white dark:bg-white/5 p-12 rounded-2xl shadow-lg border border-gray-100 dark:border-white/10 text-center">
                    <div className="w-24 h-24 border-4 border-neon-purple border-t-transparent rounded-full animate-spin mx-auto mb-8"></div>
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Connecting with Airline...</h3>
                    <p className="text-slate-500 dark:text-gray-400 mb-6">Securing your seat and generating ticket.</p>
                    <div className="text-6xl font-mono font-bold text-neon-purple/80">
                      {timer}s
                    </div>
                  </div>
                )}

                {bookingStep === 'success' && (
                  <div className="bg-white text-slate-900 rounded-3xl overflow-hidden shadow-2xl max-w-2xl mx-auto border border-gray-200 print:shadow-none">
                    {/* Boarding Pass Header */}
                    <div className="bg-gradient-to-r from-neon-purple to-indigo-600 p-6 flex justify-between items-center text-white">
                      <div>
                        <p className="font-bold tracking-widest text-sm opacity-80">BOARDING PASS</p>
                        <p className="text-2xl font-bold">{selectedBooking.type === 'flight' ? selectedBooking.airline : selectedBooking.name}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold tracking-widest text-sm opacity-80">CLASS</p>
                        <p className="text-xl font-bold">ECONOMY</p>
                      </div>
                    </div>

                    {/* Boarding Pass Body */}
                    <div className="p-8 relative">
                      {/* Cutout circles */}
                      <div className="absolute top-1/2 left-0 w-6 h-6 bg-slate-50 dark:bg-slate-900 rounded-full -translate-x-1/2 -translate-y-1/2"></div>
                      <div className="absolute top-1/2 right-0 w-6 h-6 bg-slate-50 dark:bg-slate-900 rounded-full translate-x-1/2 -translate-y-1/2"></div>

                      <div className="flex justify-between mb-8">
                        <div>
                          <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Passenger</p>
                          <p className="font-bold text-xl">{passengerDetails.name}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Date</p>
                          <p className="font-bold text-xl">{date || new Date().toLocaleDateString()}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Time</p>
                          <p className="font-bold text-xl">{selectedBooking.type === 'flight' ? selectedBooking.departure : '14:00'}</p>
                        </div>
                      </div>

                      {selectedBooking.type === 'flight' && (
                        <div className="flex justify-between items-center mb-8 bg-slate-50 p-4 rounded-xl border border-dashed border-slate-300">
                          <div className="text-center">
                            <p className="text-3xl font-bold text-slate-800">{selectedBooking.from.substring(0, 3).toUpperCase()}</p>
                            <p className="text-xs text-slate-500">{selectedBooking.from}</p>
                          </div>
                          <div className="text-slate-400">✈️</div>
                          <div className="text-center">
                            <p className="text-3xl font-bold text-slate-800">{selectedBooking.to.substring(0, 3).toUpperCase()}</p>
                            <p className="text-xs text-slate-500">{selectedBooking.to}</p>
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-4 gap-4 mb-8">
                        <div>
                          <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Flight</p>
                          <p className="font-bold text-lg">{selectedBooking.type === 'flight' ? selectedBooking.flightNumber : 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Gate</p>
                          <p className="font-bold text-lg">A{Math.floor(Math.random() * 20) + 1}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Seat</p>
                          <p className="font-bold text-lg">{Math.floor(Math.random() * 30) + 1}F</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Meal</p>
                          <p className="font-bold text-lg">{passengerDetails.mealPreference}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

              </div>

              {/* Right/Sidebar Column (Price & Payment) */}
              {bookingStep === 'review' && (
                <div className="space-y-6">
                  <div className="bg-white dark:bg-white/5 p-6 rounded-2xl shadow-lg border border-gray-100 dark:border-white/10 sticky top-6">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Price Details</h3>

                    <div className="space-y-3 mb-6">
                      <div className="flex justify-between text-slate-600 dark:text-gray-400">
                        <span>Base Fare (1 Adult)</span>
                        <span>₹{selectedBooking.price}</span>
                      </div>
                      <div className="flex justify-between text-slate-600 dark:text-gray-400">
                        <span>Taxes & Surcharges (18%)</span>
                        <span>₹{calculateTaxes(selectedBooking.price)}</span>
                      </div>
                    </div>

                    <div className="border-t border-gray-200 dark:border-white/10 pt-4 flex justify-between items-center mb-6">
                      <span className="text-lg font-bold text-slate-900 dark:text-white">Total Amount</span>
                      <span className="text-2xl font-bold text-green-600 dark:text-green-400">₹{selectedBooking.price + calculateTaxes(selectedBooking.price)}</span>
                    </div>

                    {/* Payment Method Inputs */}
                    <div className="mb-6 space-y-4 pt-4 border-t border-gray-200 dark:border-white/10">
                      <h4 className="font-bold text-slate-900 dark:text-white mb-2">Payment Method</h4>

                      <div className="flex gap-2">
                        <button
                          onClick={() => setPaymentMethod('card')}
                          className={`flex-1 py-2 text-sm rounded-lg border transition-all ${paymentMethod === 'card' ? 'border-neon-purple bg-neon-purple/10 text-neon-purple' : 'border-gray-300 dark:border-white/20 text-slate-500 dark:text-gray-400'}`}
                        >
                          Card
                        </button>
                        <button
                          onClick={() => setPaymentMethod('upi')}
                          className={`flex-1 py-2 text-sm rounded-lg border transition-all ${paymentMethod === 'upi' ? 'border-neon-purple bg-neon-purple/10 text-neon-purple' : 'border-gray-300 dark:border-white/20 text-slate-500 dark:text-gray-400'}`}
                        >
                          UPI
                        </button>
                      </div>

                      {paymentMethod === 'card' ? (
                        <div className="space-y-2">
                          <input
                            type="text"
                            placeholder="Card Number (XXXX XXXX XXXX XXXX)"
                            className="w-full px-4 py-2 text-sm rounded-lg bg-slate-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-slate-900 dark:text-white focus:border-neon-purple focus:outline-none"
                          />
                          <div className="flex gap-2">
                            <input
                              type="text"
                              placeholder="MM/YY"
                              className="w-1/2 px-4 py-2 text-sm rounded-lg bg-slate-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-slate-900 dark:text-white focus:border-neon-purple focus:outline-none"
                            />
                            <input
                              type="text"
                              placeholder="CVV"
                              className="w-1/2 px-4 py-2 text-sm rounded-lg bg-slate-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-slate-900 dark:text-white focus:border-neon-purple focus:outline-none"
                            />
                          </div>
                        </div>
                      ) : (
                        <div>
                          <input
                            type="text"
                            placeholder="Enter UPI ID (e.g. user@oksbi)"
                            className="w-full px-4 py-2 text-sm rounded-lg bg-slate-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-slate-900 dark:text-white focus:border-neon-purple focus:outline-none"
                          />
                        </div>
                      )}
                    </div>

                    <PrimaryButton onClick={processBooking} className="w-full justify-center py-4 text-lg">
                      Proceed to Payment
                    </PrimaryButton>

                    <div className="text-center mt-4 text-xs text-slate-400">
                      <p>By proceeding, you agree to our Terms & Conditions</p>
                      <p>🔒 Secure Simulation Payment</p>
                    </div>
                  </div>
                </div>
              )}

            </div>

            {/* Celebratory Footer for Success */}
            {bookingStep === 'success' && (
              <div className="text-center mt-12 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300">
                <h3 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Bon Voyage! 🌍</h3>
                <p className="text-slate-600 dark:text-gray-300 text-lg">
                  Get ready for an amazing journey. Check your email for full itinerary details.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      <GlassCard className="mb-6">
        <h2 className="text-2xl font-bold mb-4 text-slate-900 dark:text-white">Search Flights</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <input
            type="text"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            placeholder="From (e.g., Delhi)"
            className="px-4 py-3 rounded-xl bg-white/40 dark:bg-white/10 border border-black/10 dark:border-white/20 text-slate-900 dark:text-white focus:border-neon-purple focus:outline-none placeholder:text-slate-500 dark:placeholder:text-gray-400"
          />
          <input
            type="text"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            placeholder="To (e.g., Mumbai)"
            className="px-4 py-3 rounded-xl bg-white/40 dark:bg-white/10 border border-black/10 dark:border-white/20 text-slate-900 dark:text-white focus:border-neon-purple focus:outline-none placeholder:text-slate-500 dark:placeholder:text-gray-400"
          />
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="px-4 py-3 rounded-xl bg-white/40 dark:bg-white/10 border border-black/10 dark:border-white/20 text-slate-900 dark:text-white focus:border-neon-purple focus:outline-none"
          />
        </div>
        <PrimaryButton onClick={handleSearch} disabled={isSearching} className="w-full">
          {isSearching ? 'Searching...' : 'Search Flights'}
        </PrimaryButton>
      </GlassCard>

      {showFlights && (
        <>
          <h2 className="text-2xl font-bold mb-4 text-slate-900 dark:text-white">Available Flights</h2>
          {isSearching ? (
            <div className="text-center py-8 text-slate-600 dark:text-gray-400">Searching for best flights...</div>
          ) : flights.length === 0 ? (
            <div className="text-center py-8 text-slate-500 dark:text-gray-400">No flights found. Try different cities or dates.</div>
          ) : (
            <div className="space-y-4 mb-6">
              {flights.map((flight) => (
                <GlassCard key={flight.id}>
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-2xl">✈️</span>
                        <div>
                          <h3 className="text-xl font-semibold text-slate-900 dark:text-white">{flight.airline}</h3>
                          <p className="text-sm text-slate-600 dark:text-gray-400">{flight.flightNumber}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <div>
                          <p className="text-slate-500 dark:text-gray-400">From</p>
                          <p className="font-semibold text-slate-900 dark:text-white">{flight.from}</p>
                          <p className="text-indigo-600 dark:text-neon-cyan">{flight.departure}</p>
                        </div>
                        <div className="text-slate-400 dark:text-gray-400">→ {flight.duration} →</div>
                        <div>
                          <p className="text-slate-500 dark:text-gray-400">To</p>
                          <p className="font-semibold text-slate-900 dark:text-white">{flight.to}</p>
                          <p className="text-indigo-600 dark:text-neon-cyan">{flight.arrival}</p>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-green-600 dark:text-green-400">₹{flight.price}</p>
                      <p className="text-xs text-slate-500 dark:text-gray-400 mb-2">{flight.seats} seats left</p>
                      <div className="flex gap-2">
                        <PrimaryButton onClick={() => openBooking(flight, 'flight')}>
                          Book (₹{flight.price})
                        </PrimaryButton>
                        <button
                          onClick={() => window.open('https://www.goindigo.in/', '_blank')}
                          className="px-3 py-2 rounded-xl bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 transition-all text-xs text-slate-900 dark:text-white"
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
        <h2 className="text-2xl font-bold mb-4 text-slate-900 dark:text-white">Search Hotels {to ? `in ${to}` : ''}</h2>
        <PrimaryButton onClick={fetchHotels} disabled={isLoadingHotels} className="w-full">
          {isLoadingHotels ? 'Loading Hotels...' : 'Show Available Hotels'}
        </PrimaryButton>
      </GlassCard>

      {showHotels && (
        <>
          <h2 className="text-2xl font-bold mb-4 text-slate-900 dark:text-white">Available Hotels</h2>
          {isLoadingHotels ? (
            <div className="text-center py-8 text-slate-600 dark:text-gray-400">Finding best hotels...</div>
          ) : hotels.length === 0 ? (
            <div className="text-center py-8 text-slate-500 dark:text-gray-400">No hotels found. Try a different city.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {hotels.map((hotel) => (
                <GlassCard key={hotel.id}>
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="text-xl font-semibold text-slate-900 dark:text-white">{hotel.name}</h3>
                      <p className="text-sm text-slate-600 dark:text-gray-400">📍 {hotel.location}</p>
                      <p className="text-sm text-yellow-600 dark:text-yellow-400">⭐ {hotel.rating ? hotel.rating.toFixed(1) : 'N/A'}</p>
                    </div>
                    <p className="text-xl font-bold text-green-600 dark:text-green-400">₹{hotel.price}/night</p>
                  </div>
                  <div className="flex gap-2">
                    <PrimaryButton onClick={() => openBooking(hotel, 'hotel')} className="flex-1">
                      Book Now
                    </PrimaryButton>
                    <button
                      onClick={() => window.open('https://www.google.com/travel/hotels', '_blank')}
                      className="px-3 py-2 rounded-xl bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 transition-all text-xs text-slate-900 dark:text-white"
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
        <h2 className="text-2xl font-bold mb-4 text-slate-900 dark:text-white">💳 Travel Payment</h2>
        <p className="text-slate-600 dark:text-gray-300 mb-4">Secure Payment Gateway Integrated via Razorpay</p>
        <div className="bg-black/5 dark:bg-white/5 p-4 rounded-xl mb-4 text-slate-700 dark:text-gray-300">
          <p className="text-sm">Trusted by millions of students.</p>
        </div>
      </GlassCard>
    </div>
  );
}
