import React, { useState } from 'react';
import { DollarSign, Leaf, Zap, Droplets, Recycle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';


// For getting text for what to display for this section//

const BudgetPreferences = () => {
  const [budget, setBudget] = useState('');
  const [selectedCategories, setSelectedCategories] = useState([]);

  const categories = [
    {
      id: 'plants',
      title: 'Plant-Based Solutions',
      description: 'Indoor plants, balcony gardens, air-purifying plants',
      icon: Leaf,
      examples: 'Snake plants, herb gardens, seasonal vegetables'
    },
    {
      id: 'habits',
      title: 'Daily Habit Modifications',
      description: 'Small changes in daily routines for big impact',
      icon: Zap,
      examples: 'Smart power usage, optimal AC settings, efficient appliance scheduling'
    },
    {
      id: 'appliances',
      title: 'Small Appliance Upgrades',
      description: 'Energy-efficient replacements for existing appliances',
      icon: Zap,
      examples: 'Smart power strips, LED lamps, energy-star rated devices'
    },
    {
      id: 'water',
      title: 'Water-Saving Devices',
      description: 'Simple installations to reduce water consumption',
      icon: Droplets,
      examples: 'Tap aerators, low-flow showerheads, dual-flush converters'
    },
    {
      id: 'waste',
      title: 'Waste Reduction Initiatives',
      description: 'Solutions for reducing household waste',
      icon: Recycle,
      examples: 'Composting kits, reusable containers, recycling systems'
    }
  ];

  const toggleCategory = (categoryId) => {
    setSelectedCategories(prev => 
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Let's Customize Your Eco Journey</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-8">
            {/* Budget Input */}
            <div>
              <label className="block text-lg font-medium mb-4">
                What's your monthly budget for environmental improvements?
              </label>
              <div className="relative mt-2 rounded-md shadow-sm max-w-xs">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <DollarSign className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="number"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  className="block w-full rounded-md border-0 py-3 pl-10 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-green-600"
                  placeholder="Enter amount"
                />
              </div>
              <p className="mt-2 text-sm text-gray-500">
                This helps us suggest improvements within your comfort zone
              </p>
            </div>

            {/* Categories Selection */}
            <div>
              <label className="block text-lg font-medium mb-4">
                Which areas interest you the most? (Select all that apply)
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {categories.map((category) => {
                  const Icon = category.icon;
                  const isSelected = selectedCategories.includes(category.id);
                  
                  return (
                    <div
                      key={category.id}
                      onClick={() => toggleCategory(category.id)}
                      className={`cursor-pointer rounded-lg border p-4 transition-all ${
                        isSelected 
                          ? 'border-green-500 bg-green-50' 
                          : 'border-gray-200 hover:border-green-200'
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <Icon className={`w-6 h-6 ${
                          isSelected ? 'text-green-500' : 'text-gray-400'
                        }`} />
                        <div>
                          <h3 className="font-medium">{category.title}</h3>
                          <p className="text-sm text-gray-500">{category.description}</p>
                          <p className="text-xs text-gray-400 mt-1">
                            Examples: {category.examples}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BudgetPreferences;