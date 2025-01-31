import { createLazyFileRoute, redirect } from '@tanstack/react-router'
import { useAtom } from 'jotai'
import { userAuthAtom } from '@/lib/atoms'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Loader2, Leaf, Zap, Droplets, Recycle } from 'lucide-react'

export const Route = createLazyFileRoute('/_authenticated/dashboard')({
  component: DashboardComponent,
})

const categories = [
  {
    id: 'plants',
    title: 'Plant-Based Solutions',
    description: 'Indoor plants, balcony gardens, air-purifying plants',
    icon: Leaf,
    examples: 'Snake plants, herb gardens, seasonal vegetables',
  },
  {
    id: 'habits',
    title: 'Daily Habit Modifications',
    description: 'Small changes in daily routines for big impact',
    icon: Zap,
    examples:
      'Smart power usage, optimal AC settings, efficient appliance scheduling',
  },
  {
    id: 'appliances',
    title: 'Small Appliance Upgrades',
    description: 'Energy-efficient replacements for existing appliances',
    icon: Zap,
    examples: 'Smart power strips, LED lamps, energy-star rated devices',
  },
  {
    id: 'water',
    title: 'Water-Saving Devices',
    description: 'Simple installations to reduce water consumption',
    icon: Droplets,
    examples: 'Tap aerators, low-flow showerheads, dual-flush converters',
  },
  {
    id: 'waste',
    title: 'Waste Reduction Initiatives',
    description: 'Solutions for reducing household waste',
    icon: Recycle,
    examples: 'Composting kits, reusable containers, recycling systems',
  },
]

function RecommendationCard({ item, index, category }) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isDone, setIsDone] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [stepsTaken, setStepsTaken] = useState('')
  const [selectedCategories, setSelectedCategories] = useState([])
  const [userAuth] = useAtom(userAuthAtom)

  const { mutateAsync: updateProgress } = useMutation({
    mutationFn: async (data) => {
      const response = await fetch('http://127.0.0.1:5000/api/progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${userAuth.token}`,
        },
        body: JSON.stringify(data),
      })
      return response.json()
    },
  })

  const { refetch: refetchCurrentStatus } = useQuery({
    queryKey: ['currentStatus'],
    enabled: false,
  })

  const [isUpdating, setIsUpdating] = useState(false)

  const handleUpdateProgress = async () => {
    setIsUpdating(true)
    const payload = {
      recommendation: item.title,
      current_category: category,
      user: { id: userAuth.userId },
      ...(stepsTaken && { specific_steps_taken: stepsTaken }),
      ...(selectedCategories.length > 0 && {
        next_steps: selectedCategories.join(','),
      }),
    }
    await updateProgress(payload)
    await refetchCurrentStatus()
    setIsDialogOpen(false)
    setIsUpdating(false)
  }

  const toggleCategory = (categoryTitle) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryTitle) ? [] : [categoryTitle],
    )
  }

  const otherCategories = categories
    .filter(
      (cat) =>
        cat.title !== category &&
        !Object.keys(recommendations).includes(cat.title),
    )
    .map((cat) => ({
      ...cat,
      isSelected: selectedCategories.includes(cat.title),
    }))

  return (
    <Card className="transition-all duration-300 ease-in-out">
      <CardHeader>
        <div>
          <CardTitle>{item.title}</CardTitle>
          <CardDescription>
            Carbon Reduction: {item.details['Carbon_Reduction'] || item.details['Carbon Reduction']}
          </CardDescription>
        </div>
      </CardHeader>
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{item.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block mb-2">Describe the steps you took</label>
              <textarea
                value={stepsTaken}
                onChange={(e) => setStepsTaken(e.target.value)}
                className="w-full p-2 border rounded min-h-[100px]"
              />
            </div>
            <div>
              <label className="block mb-2">
                What would you like to focus on next? (Select 1)
              </label>
              <div className="grid grid-cols-1 gap-4">
                {otherCategories.map((cat) => {
                  const Icon = cat.icon
                  return (
                    <div
                      key={cat.id}
                      onClick={() => toggleCategory(cat.title)}
                      className={`cursor-pointer rounded-lg border p-4 transition-all ${
                        cat.isSelected
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-green-200'
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <Icon
                          className={`w-6 h-6 ${
                            cat.isSelected ? 'text-green-500' : 'text-gray-400'
                          }`}
                        />
                        <div>
                          <h3 className="font-medium">{cat.title}</h3>
                          <p className="text-sm text-gray-500">
                            {cat.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
            <Button onClick={handleUpdateProgress} className="w-full" disabled={isUpdating}>
              {isUpdating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Progress'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <CardContent>
        <div className="space-y-2">
          {item.details.Cost && (
            <p>
              <span className="font-bold">Cost:</span> {item.details.Cost}
            </p>
          )}
          {item.details.Benefits && (
            <div>
              <p className="font-bold">Benefits</p>
              <p>{item.details.Benefits}</p>
            </div>
          )}
          <div
            className={`transition-all duration-300 ease-in-out ${
              isExpanded
                ? 'max-h-[500px] opacity-100 mb-4'
                : 'max-h-0 opacity-0 mb-0'
            } overflow-hidden`}
          >
            {item.details.Implementation && (
              <div className="mt-4">
                <p className="font-bold">Implementation</p>
                <p>{item.details.Implementation}</p>
              </div>
            )}
            {item.details.Maintenance && (
              <div className="mt-4">
                <p className="font-bold">Maintenance</p>
                <p>{item.details.Maintenance}</p>
              </div>
            )}
            {item.details.Resources && (
              <div className="mt-4">
                <p className="font-bold">Resources</p>
                <p>{item.details.Resources}</p>
              </div>
            )}
          </div>
          <div className="flex justify-between items-center mt-2">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-2 text-sm text-gray-500"
            >
              {isExpanded ? 'Show less' : 'Show more'}
              <svg
                className={`w-4 h-4 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
            <button
              onClick={() => setIsDialogOpen(true)}
              className="text-sm text-white bg-black px-3 py-1 rounded"
            >
              Mark as done
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

const recommendations = {
  'Plant-Based Solutions': [
    {
      title: 'Adjust Thermostat Settings',
      details: {
        Cost: '$0',
        Benefits: 'Lower energy bills, improved HVAC lifespan.',
        Resources: 'Programmable thermostat.',
        Maintenance: 'Regular HVAC maintenance.',
        Implementation:
          'Adjust the thermostat to 78° F in summers and 68° F in winters. This can significantly reduce energy consumption.',
        'Carbon Reduction': '50-100 kg/month',
      },
    },
    {
      title: 'Increase Indoor Plants',
      details: {
        Cost: '$20-$50 per plant',
        Benefits:
          'Improved air quality, enhanced home decor, mental health benefits.',
        Resources: 'Indoor plants, plant pots, potting soil.',
        Maintenance: 'Regular watering and occasional fertilizing.',
        Implementation:
          'Add more air-purifying indoor plants like Snake Plant, Spider Plant, or Peace Lily. These plants are low-maintenance and can improve indoor air quality.',
        'Carbon Reduction': '1-2 kg/month',
      },
    },
    {
      title: 'Start a Herb Garden',
      details: {
        Cost: '$30-$50 for a starter kit',
        Benefits:
          'Fresh herbs for cooking, reduced grocery costs, gardening benefits.',
        Resources: 'Herb garden starter kit, sunlight, water.',
        Maintenance: 'Regular watering and occasional pruning.',
        Implementation:
          'Start a small herb garden in your kitchen or balcony. This can reduce the carbon footprint associated with transporting herbs from the store.',
        'Carbon Reduction': '2-5 kg/month',
      },
    },
  ],
  'Daily Habit Modifications': [
    {
      title: 'Optimize Commute',
      details: {
        Cost: 'Varies depending on the mode of transportation.',
        Benefits:
          'Reduced fuel costs, improved health (if biking or walking), less traffic congestion.',
        Resources: 'Public transportation pass, bicycle, carpooling apps.',
        Maintenance: 'Regular bike maintenance if biking.',
        Implementation:
          'Consider carpooling or using public transportation for commuting to work. If possible, consider biking or walking.',
        'Carbon Reduction': '50-100 kg/month',
      },
    },
  ],
}

const pastActions = [
  {
    title: 'Installed LED Bulbs',
    date: '2024-01-25',
    reduction: '20 kg/month',
  },
  { title: 'Started Composting', date: '2024-01-20', reduction: '15 kg/month' },
  {
    title: 'Reduced Meat Consumption',
    date: '2024-01-15',
    reduction: '30 kg/month',
  },
]

function DashboardComponent() {
  const [userAuth] = useAtom(userAuthAtom)

  const { data: currentStatus, isLoading } = useQuery({
    queryKey: ['currentStatus'],
    enabled: Boolean(userAuth.token),
    queryFn: async () => {
      const response = await fetch('http://127.0.0.1:5000/api/currentStatus', {
        headers: {
          Authorization: `Basic ${userAuth.token}`,
        },
      })
      const { data } = await response.json()
      return data
    },
  })

  if (!currentStatus || isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      <div className="space-y-4">
        <h1 className="text-5xl font-bold">EcoNest</h1>

        <div className="">
          <h2 className="text-3xl font-semibold">Goal</h2>
          <h2 className="text-2xl font-semibold my-2"> Progress: 30% </h2>
          <div className="w-full bg-gray-200 rounded-full h-4">
            <div
              className="bg-green-600 h-4 rounded-full"
              style={{ width: '30%' }}
            ></div>
          </div>
          <div className="text-sm text-gray-600">
            Current Emissions: 300 kg/m, Goal: 100 kg/m
            <br />{' '}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-3xl font-semibold">Recommendations</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {currentStatus &&
            Object.entries(currentStatus?.recommendations?.recommendations).map(
              ([category, items]) => (
                <div key={category} className="space-y-4">
                  <h3 className="text-xl font-medium">{category}</h3>
                  {items.map((item, index) => (
                    <RecommendationCard
                      key={index}
                      item={item}
                      index={index}
                      category={category}
                    />
                  ))}
                </div>
              ),
            )}
        </div>
      </div>
    </div>
  )
}
