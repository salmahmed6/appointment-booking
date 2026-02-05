'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { servicesAPI, bookingsAPI } from '@/lib/api';

export default function ProviderDashboard() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [services, setServices] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newService, setNewService] = useState({
    name: '',
    description: '',
    duration: 60,
  });

  useEffect(() => {
    if (!user || user.role !== 'provider') {
      router.push('/');
      return;
    }
    loadData();
  }, [user]);

  const loadData = async () => {
    try {
      const [servicesRes, bookingsRes] = await Promise.all([
        servicesAPI.getMine(),
        bookingsAPI.getProviderBookings(),
      ]);
      setServices(servicesRes.data);
      setBookings(bookingsRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateService = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await servicesAPI.create(newService);
      setNewService({ name: '', description: '', duration: 60 });
      setShowCreateForm(false);
      loadData();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to create service');
    }
  };

  const handleUpdateStatus = async (bookingId: string, status: string) => {
    try {
      await bookingsAPI.updateStatus(bookingId, status);
      loadData();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to update status');
    }
  };

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Provider Dashboard</h1>
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
            <h2 className="text-xl font-bold">My Services</h2>
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              {showCreateForm ? 'Cancel' : 'Create Service'}
            </button>
          </div>

          {showCreateForm && (
            <form onSubmit={handleCreateService} className="mb-6 p-4 bg-gray-50 rounded">
              <div className="grid grid-cols-1 gap-4">
                <input
                  type="text"
                  placeholder="Service Name"
                  value={newService.name}
                  onChange={(e) => setNewService({ ...newService, name: e.target.value })}
                  className="px-3 py-2 border rounded"
                  required
                />
                <input
                  type="text"
                  placeholder="Description"
                  value={newService.description}
                  onChange={(e) => setNewService({ ...newService, description: e.target.value })}
                  className="px-3 py-2 border rounded"
                />
                <input
                  type="number"
                  placeholder="Duration (minutes)"
                  value={newService.duration}
                  onChange={(e) => setNewService({ ...newService, duration: parseInt(e.target.value) })}
                  className="px-3 py-2 border rounded"
                  required
                  min="15"
                />
                <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
                  Create
                </button>
              </div>
            </form>
          )}

          <div className="space-y-4">
            {services.length === 0 ? (
              <p className="text-gray-500">No services yet. Create one to get started!</p>
            ) : (
              services.map((service) => (
                <div key={service.id} className="border rounded p-4">
                  <h3 className="font-bold text-lg">{service.name}</h3>
                  <p className="text-gray-600">{service.description}</p>
                  <p className="text-sm text-gray-500">Duration: {service.duration} minutes</p>
                  <p className="text-sm font-mono bg-gray-100 p-2 rounded mt-2">
                    Invite Code: <span className="font-bold">{service.inviteCode}</span>
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">Bookings</h2>
          <div className="space-y-4">
            {bookings.length === 0 ? (
              <p className="text-gray-500">No bookings yet.</p>
            ) : (
              bookings.map((booking) => (
                <div key={booking.id} className="border rounded p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold">{booking.service.name}</h3>
                      <p className="text-sm text-gray-600">
                        Client: {booking.client.name} ({booking.client.email})
                      </p>
                      <p className="text-sm text-gray-600">
                        Time: {new Date(booking.appointmentTime).toLocaleString()}
                      </p>
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
                      {booking.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleUpdateStatus(booking.id, 'confirmed')}
                            className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                          >
                            Confirm
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(booking.id, 'cancelled')}
                            className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
                          >
                            Cancel
                          </button>
                        </>
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