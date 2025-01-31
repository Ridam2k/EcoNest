import { createLazyFileRoute, redirect } from '@tanstack/react-router'
import { useAtom } from 'jotai'
import { userAuthAtom } from '@/lib/atoms'
import { useQuery } from '@tanstack/react-query'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export const Route = createLazyFileRoute('/_authenticated/dashboard')({
  component: DashboardComponent,
})

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

  const { data: currentStatus } = useQuery({
    queryKey: ['currentStatus'],
    queryFn: () =>
      fetch('http://127.0.0.1:5000/api/currentStatus', {
        headers: {
          Authorization: `Basic ${userAuth.token}`,
        },
      }).then((res) => res.json()),
  })

  console.log('Current Status:', currentStatus)

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

        <div className="space-y-2">
          <h2 className="text-xl">
            How would you like to make an effort to save the earth today?
          </h2>
          <input
            type="text"
            className="w-full p-2 border rounded-lg"
            placeholder="Share your eco-friendly action..."
          />
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">Recommendations</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(recommendations).map(([category, items]) => (
            <div key={category} className="space-y-4">
              <h3 className="text-xl font-medium">{category}</h3>
              {items.map((item, index) => (
                <Card key={index}>
                  <CardHeader>
                    <CardTitle>{item.title}</CardTitle>
                    <CardDescription>
                      Carbon Reduction: {item.details['Carbon Reduction']}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <p>
                        <span className="font-medium">Cost:</span>{' '}
                        {item.details.Cost}
                      </p>
                      <p>
                        <span className="font-medium">Benefits:</span>{' '}
                        {item.details.Benefits}
                      </p>
                      <p className="text-sm">{item.details.Implementation}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">Past Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {pastActions.map((action, index) => (
            <Card key={index}>
              <CardHeader>
                <CardTitle className="text-lg">{action.title}</CardTitle>
                <CardDescription>{action.date}</CardDescription>
              </CardHeader>
              <CardContent>
                <p>Carbon Reduction: {action.reduction}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
