import { createLazyFileRoute, useNavigate } from "@tanstack/react-router";
import { useAtom } from "jotai";
import { userAuthAtom } from "@/lib/atoms";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Loader2,
  Leaf,
  Zap,
  Droplets,
  Recycle,
  ArrowDown,
  ArrowUp,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";

export const Route = createLazyFileRoute("/_authenticated/dashboard")({
  component: DashboardComponent,
});

const categories = [
  {
    id: "plants",
    title: "Plant-Based Solutions",
    description: "Indoor plants, balcony gardens, air-purifying plants",
    icon: Leaf,
    examples: "Snake plants, herb gardens, seasonal vegetables",
  },
  {
    id: "habits",
    title: "Daily Habit Modifications",
    description: "Small changes in daily routines for big impact",
    icon: Zap,
    examples:
      "Smart power usage, optimal AC settings, efficient appliance scheduling",
  },
  {
    id: "appliances",
    title: "Small Appliance Upgrades",
    description: "Energy-efficient replacements for existing appliances",
    icon: Zap,
    examples: "Smart power strips, LED lamps, energy-star rated devices",
  },
  {
    id: "water",
    title: "Water-Saving Devices",
    description: "Simple installations to reduce water consumption",
    icon: Droplets,
    examples: "Tap aerators, low-flow showerheads, dual-flush converters",
  },
  {
    id: "waste",
    title: "Waste Reduction Initiatives",
    description: "Solutions for reducing household waste",
    icon: Recycle,
    examples: "Composting kits, reusable containers, recycling systems",
  },
];

function ProductCard({ product }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{product.name}</CardTitle>
        <CardDescription>${product.price}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <p>{product.description}</p>
          <p>
            <span className="font-bold">Carbon Reduction:</span>{" "}
            {product.carbonReduction}
          </p>
          <p>
            <span className="font-bold">Vendor:</span> {product.vendor}
          </p>
          {/* <p><span className="font-bold">Location:</span> {product.location}</p> */}
          {/* <p><span className="font-bold">Maintenance:</span> {product.maintenance}</p> */}
        </div>
      </CardContent>
    </Card>
  );
}

function RecommendationCard({ item, index, category, recommendations }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [stepsTaken, setStepsTaken] = useState("");
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [userAuth] = useAtom(userAuthAtom);

  const { mutateAsync: updateProgress } = useMutation({
    mutationFn: async (data) => {
      const response = await fetch("http://127.0.0.1:5000/api/progress", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${userAuth.token}`,
        },
        body: JSON.stringify(data),
      });
      return response.json();
    },
  });

  const { refetch: refetchCurrentStatus } = useQuery({
    queryKey: ["currentStatus"],
    enabled: false,
  });

  const [isUpdating, setIsUpdating] = useState(false);

  const handleUpdateProgress = async () => {
    setIsUpdating(true);
    const payload = {
      recommendation: item.title,
      current_category: category,
      user: { id: userAuth.userId },
      ...(stepsTaken && { specific_steps_taken: stepsTaken }),
      ...(selectedCategories.length > 0 && {
        next_steps: selectedCategories.join(","),
      }),
    };
    await updateProgress(payload);
    await refetchCurrentStatus();
    setIsDialogOpen(false);
    setIsUpdating(false);
  };

  const toggleCategory = (categoryTitle) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryTitle) ? [] : [categoryTitle]
    );
  };

  const otherCategories = categories
    .filter((cat) => !Object.keys(recommendations).includes(cat.title))
    .map((cat) => ({
      ...cat,
      isSelected: selectedCategories.includes(cat.title),
    }));

  return (
    <Card className="transition-all duration-300 ease-in-out">
      <CardHeader>
        <div>
          <CardTitle>{item.title}</CardTitle>
          <CardDescription>
            Carbon Reduction:{" "}
            {item.details["Carbon_Reduction"] ||
              item.details["Carbon Reduction"]}
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
                className="w-full p-2 border min-h-[100px]"
              />
            </div>
            {Object.keys(recommendations).length < 3 && (
              <div>
                <label className="block mb-2">
                  What would you like to focus on next? (Select 1)
                </label>

                <div className="grid grid-cols-1 gap-4">
                  {otherCategories.map((cat) => {
                    const Icon = cat.icon;
                    return (
                      <div
                        key={cat.id}
                        onClick={() => toggleCategory(cat.title)}
                        className={`cursor-pointer border p-4 transition-all ${
                          cat.isSelected
                            ? "border-green-500"
                            : "border-gray-200 hover:border-green-200"
                        }`}
                      >
                        <div className="flex items-start space-x-3">
                          <Icon
                            className={`w-6 h-6 ${
                              cat.isSelected
                                ? "text-green-500"
                                : "text-gray-400"
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
                    );
                  })}
                </div>
              </div>
            )}
            <Button
              onClick={handleUpdateProgress}
              className="w-full"
              disabled={isUpdating}
            >
              {isUpdating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Progress"
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
                ? "max-h-[500px] opacity-100 mb-4"
                : "max-h-0 opacity-0 mb-0"
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
              className="flex items-center gap-2 text-sm text-gray-400"
            >
              {isExpanded ? "Show less" : "Show more"}
              <svg
                className={`w-4 h-4 transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`}
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
              className="text-sm bg-green-700 px-3 py-1 text-zinc-100"
            >
              Mark as done
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function DashboardComponent() {
  const [userAuth] = useAtom(userAuthAtom);
  const [showPastActions, setShowPastActions] = useState(false);
  const navigate = useNavigate();

  const { data: products, isError: isProductsError } = useQuery({
    queryKey: ["products"],
    enabled: Boolean(userAuth.token),
    queryFn: async () => {
      const response = await fetch(
        "http://127.0.0.1:5000/api/internal/products",
        {
          method: "POST",
          headers: {
            Authorization: `Basic ${userAuth.token}`,
          },
        }
      );
      const data = await response.json();
      return data;
    },
  });

  const { data: currentStatus, isLoading, isError: isStatusError } = useQuery({
    queryKey: ["currentStatus"],
    enabled: Boolean(userAuth.token),
    queryFn: async () => {
      const response = await fetch("http://127.0.0.1:5000/api/currentStatus", {
        headers: {
          Authorization: `Basic ${userAuth.token}`,
        },
      });
      const { data } = await response.json();
      return data;
    },
  });

  if (isProductsError || isStatusError) {
    navigate({ to: '/login' });
    return null;
  }

  if (!currentStatus || isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      <div className="space-y-4">
        <h1 className="text-6xl font-bold text-green-500">EcoNest</h1>

        <div className="">
          <h2 className="text-5xl font-semibold mt-2 flex items-center gap-2">
            {(
              ((parseInt(currentStatus.starting_footprint.replace(" kg", "")) -
                parseInt(currentStatus.carbon_footprint.replace(" kg", ""))) /
                parseInt(currentStatus.starting_footprint.replace(" kg", ""))) *
              100
            ).toFixed(1)}
            %
            {parseInt(currentStatus.carbon_footprint.replace(" kg", "")) <
            parseInt(currentStatus.starting_footprint.replace(" kg", "")) ? (
              <span className="text-green-500">
                {" "}
                <ArrowDown size={50} strokeWidth={3} />
              </span>
            ) : (
              <span className="text-red-500">
                <ArrowUp size={40} strokeWidth={3} />
              </span>
            )}
          </h2>
          <span>Change in you carbon footprint</span>
          <div className="space-y-2">
            <div className="text-sm text-gray-400">
              Current Footprint:{" "}
              {currentStatus.carbon_footprint.replace(" kg", " kg per month")}{" "}
              kg / month
            </div>
            {currentStatus?.past_actions?.length > 0 && (
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setShowPastActions(!showPastActions)}
                  className="text-sm text-gray-700 hover:text-gray-300"
                >
                  <span>
                    {showPastActions
                      ? "Hide Past Actions"
                      : "Show Past Actions"}
                  </span>
                </button>
                <div
                  className={`flex gap-4 transition-all duration-300 ${showPastActions ? "max-w-[800px] opacity-100" : "max-w-0 opacity-0"} overflow-hidden whitespace-nowrap`}
                >
                  {currentStatus.past_actions
                    .replace(/[{}]/g, "")
                    .split(",")
                    .map((action, index) => (
                      <span key={index} className="text-sm">
                        {action}
                      </span>
                    ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-3xl font-semibold">Recommendations</h2>
        <div className="grid grid-cols-1 md:grid-cols-[repeat(auto-fit,minmax(0,1fr))] md:auto-cols-fr gap-4">
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
                      recommendations={
                        currentStatus.recommendations.recommendations
                      }
                    />
                  ))}
                </div>
              )
            )}
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-3xl font-semibold">Suggested Products</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {products?.data?.daily_habit_modifications?.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-xl font-medium">Daily Habit Modifications</h3>
              {products.data.daily_habit_modifications.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}

          {products?.data?.small_appliance_upgrades?.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-xl font-medium">Small Appliance Upgrades</h3>
              {products.data.small_appliance_upgrades.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}

          {products?.data?.waste_reduction_initiatives?.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-xl font-medium">
                Waste Reduction Initiatives
              </h3>
              {products.data.waste_reduction_initiatives.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
