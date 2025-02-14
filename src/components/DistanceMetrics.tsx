import React from 'react';
import { Ruler, Plane, Train, Car, PersonStanding } from 'lucide-react';

interface Props {
  distance: number; // in meters
}

export const DistanceMetrics: React.FC<Props> = ({ distance }) => {
  const kilometers = Math.round(distance / 1000);
  const earthCircumference = 40075; // in kilometers
  const timesAroundEarth = (kilometers / earthCircumference).toFixed(2);
  const steps = Math.round(distance / 0.762); // average step length in meters
  
  const getTravelTime = (speed: number) => {
    const hours = distance / (speed * 1000);
    if (hours < 1) {
      return `${Math.round(hours * 60)} minutes`;
    }
    return `${Math.round(hours)} hours`;
  };

  return (
    <div className="space-y-4 text-gray-700">
      <h3 className="text-xl font-semibold mb-4">Distance Facts</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
          <div className="flex items-center space-x-3">
            <Ruler className="h-5 w-5 text-indigo-500" />
            <div>
              <p className="text-sm">Earth Circumference</p>
              <p className="font-semibold">{timesAroundEarth}x around Earth</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
          <div className="flex items-center space-x-3">
            <PersonStanding className="h-5 w-5 text-indigo-500" />
            <div>
              <p className="text-sm">Walking Steps</p>
              <p className="font-semibold">{steps.toLocaleString()} steps</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
          <div className="flex items-center space-x-3">
            <Plane className="h-5 w-5 text-indigo-500" />
            <div>
              <p className="text-sm">By Plane</p>
              <p className="font-semibold">{getTravelTime(800)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
          <div className="flex items-center space-x-3">
            <Train className="h-5 w-5 text-indigo-500" />
            <div>
              <p className="text-sm">By Train</p>
              <p className="font-semibold">{getTravelTime(250)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
          <div className="flex items-center space-x-3">
            <Car className="h-5 w-5 text-indigo-500" />
            <div>
              <p className="text-sm">By Car</p>
              <p className="font-semibold">{getTravelTime(100)}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};