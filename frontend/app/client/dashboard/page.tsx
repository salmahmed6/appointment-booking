'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { servicesAPI, bookingsAPI } from '@/lib/api';

export default function ClientDashboard() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [service, setService] = useState<any>(null);
  const [appointmentTime, setAppointmentTime] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (!user || user.role !== 'client') {
      router.push('/');
      return;
    }
    loadBookings();
  }, [user]);

  const loadBookings = async () => {
    try {
      const response = await bookingsAPI.getMine();
      setBookings(response.data);
    } catch (error) {
      console.error('Error loading bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchService = async () => {
    try {
      const response = await servicesAPI.getByInviteCode(inviteCode);
      setService(response.data);
    } catch (error: any) {
      alert(error.response?.data?.message || 'Service not found');
      setService(null);
    }
  };

  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await bookingsAPI.create({
        inviteCode,
        appointmentTime,
        notes,
      });
      setShowBookingForm(false);
      setInviteCode('');
      setService(null);
      setAppointmentTime('');
      setNotes('');
      loadBookings();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to create booking');
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    if (!confirm('Are you sure you want to cancel this booking?')) return;

    try {
      await bookingsAPI.cancel(bookingId);
      loadBookings();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to cancel booking');
    }
  };

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Client Dashboard</h1>
          <button
            onClick={logout}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
          >
            Logout
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 space-y-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Book an Appointment</h2>
            <button
              onClick={() => setShowBookingForm(!showBookingForm)}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              {showBookingForm ? 'Cancel' : 'New Booking'}
            </button>
          </div>

          {showBookingForm && (
            <div className="space-y-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter invite code"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  className="flex-1 px-3 py-2 border rounded"
                />
                <button
                  onClick={handleSearchService}
                  className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
                >
                  Search
                </button>
              </div>

              {service && (
                <div className="bg-gray-50 p-4 rounded">
                  <h3 className="font-bold text-lg">{service.name}</h3>
                  <p className="text-gray-600">{service.description}</p>
                  <p className="text-sm text-gray-500">Duration: {service.duration} minutes</p>
                  <p className="text-sm text-gray-500">Provider: {service.provider.name}</p>

                  <form onSubmit={handleCreateBooking} className="mt-4 space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Appointment Date & Time</label>
                      <input
                        type="datetime-local"
                        value={appointmentTime}
                        onChange={(e) => setAppointmentTime(e.target.value)}
                        className="w-full px-3 py-2 border rounded"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Notes (optional)</label>
                      <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="w-full px-3 py-2 border rounded"
                        rows={3}
                      />
                    </div>
                    <button type="submit" className="w-full bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
                      Book Appointment
                    </button>
                  </form>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">My Bookings</h2>
          <div className="space-y-4">
            {bookings.length === 0 ? (
              <p className="text-gray-500">No bookings yet. Book your first appointment!</p>
            ) : (
              bookings.map((booking) => (
                <div key={booking.id} className="border rounded p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold">{booking.service.name}</h3>
                      <p className="text-sm text-gray-600">Provider: {booking.service.provider.name}</p>
                      <p className="text-sm text-gray-600">Time: {new Date(booking.appointmentTime).toLocaleString()}</p>
                      {booking.notes && (
                        <p className="text-sm text-gray-600">Notes: {booking.notes}</p>
                      )}
                    </div>
                    <div className="flex flex-col gap-2">
                      <span
                        className={`px-3 py-1 rounded text-sm ${
                          booking.status === 'confirmed'
                            ? 'bg-green-100 text-green-800'
                            : booking.status === 'cancelled'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {booking.status}
                      </span>
                      {booking.status !== 'cancelled' && new Date(booking.appointmentTime) > new Date() && (
                        <button
                          onClick={() => handleCancelBooking(booking.id)}
                          className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}