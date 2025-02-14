import React, { useState } from 'react';
import { format } from 'date-fns';
import { Calendar, MapPin, Plus, X } from 'lucide-react';
import type { Memory } from '../types';

interface Props {
  memories: Memory[];
  onAddMemory: (memory: Omit<Memory, 'id'>) => void;
  onDeleteMemory: (id: string) => void;
}

export const Timeline: React.FC<Props> = ({ memories, onAddMemory, onDeleteMemory }) => {
  const [showForm, setShowForm] = useState(false);
  const [newMemory, setNewMemory] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    title: '',
    description: '',
    location: { lat: 0, lng: 0 },
    image: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddMemory(newMemory);
    setShowForm(false);
    setNewMemory({
      date: format(new Date(), 'yyyy-MM-dd'),
      title: '',
      description: '',
      location: { lat: 0, lng: 0 },
      image: ''
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold">Love Story Timeline</h3>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center px-3 py-2 bg-pink-600 text-white rounded-md hover:bg-pink-700 transition-colors"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Memory
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-lg font-semibold">Add New Memory</h4>
              <button onClick={() => setShowForm(false)} className="text-gray-500 hover:text-gray-700">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Date</label>
                <input
                  type="date"
                  value={newMemory.date}
                  onChange={(e) => setNewMemory({ ...newMemory, date: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Title</label>
                <input
                  type="text"
                  value={newMemory.title}
                  onChange={(e) => setNewMemory({ ...newMemory, title: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  placeholder="First Date, Anniversary, etc."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  value={newMemory.description}
                  onChange={(e) => setNewMemory({ ...newMemory, description: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  rows={3}
                  placeholder="Write about this special moment..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Image URL (optional)</label>
                <input
                  type="url"
                  value={newMemory.image || ''}
                  onChange={(e) => setNewMemory({ ...newMemory, image: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Latitude</label>
                  <input
                    type="number"
                    step="any"
                    value={newMemory.location.lat}
                    onChange={(e) => setNewMemory({
                      ...newMemory,
                      location: { ...newMemory.location, lat: parseFloat(e.target.value) }
                    })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Longitude</label>
                  <input
                    type="number"
                    step="any"
                    value={newMemory.location.lng}
                    onChange={(e) => setNewMemory({
                      ...newMemory,
                      location: { ...newMemory.location, lng: parseFloat(e.target.value) }
                    })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Add Memory
              </button>
            </form>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {memories.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No memories added yet. Start creating your love story!</p>
        ) : (
          memories.map((memory) => (
            <div key={memory.id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
              <div className="flex justify-between items-start">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <Calendar className="h-5 w-5 text-indigo-500" />
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold">{memory.title}</h4>
                    <p className="text-sm text-gray-500">{format(new Date(memory.date), 'MMMM d, yyyy')}</p>
                    <p className="mt-2">{memory.description}</p>
                    {memory.image && (
                      <img
                        src={memory.image}
                        alt={memory.title}
                        className="mt-2 rounded-md max-h-48 object-cover"
                      />
                    )}
                    <div className="flex items-center mt-2 text-sm text-gray-500">
                      <MapPin className="h-4 w-4 mr-1" />
                      <span>{memory.location.lat.toFixed(6)}, {memory.location.lng.toFixed(6)}</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => onDeleteMemory(memory.id)}
                  className="text-gray-400 hover:text-red-500 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};