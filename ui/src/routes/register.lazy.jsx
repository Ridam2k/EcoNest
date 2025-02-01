import { createLazyFileRoute, useNavigate } from "@tanstack/react-router";
import React, { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, Leaf, Zap, Droplets, Recycle } from "lucide-react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSetAtom, useAtom } from "jotai";
import { userAuthAtom } from "@/lib/atoms";
import "../app.css";

export const Route = createLazyFileRoute("/register")({
  component: RegisterPage,
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

const steps = [
  {
    id: 1,
    title: "Let's get started by creating an account",
    questions: [
      { type: "text", label: "What's your name?", name: "username" },
      { type: "email", label: "What's your email?", name: "email" },
      { type: "password", label: "Enter your password", name: "password" },
      { type: "password", label: "Confirm passowrd", name: "confirmPassword" },
    ],
  },
  {
    id: 2,
    title: "Tell us about your habits",
    questions: [
      {
        type: "text",
        label: "Describe a day in your life",
        name: "daily_habits",
      },
    ],
  },
  {
    id: 3,
    title: "A glimpse at how you're impacting the environment",
    questions: [],
  },
  {
    id: 4,
    title: "Let's work on reducing your carbon footprint",
    questions: [
      {
        type: "text",
        label: "What's your monthy budget for environmental improvements?",
        name: "budget",
      },
      // {
      //   type: "text",
      //   label: "How would you like to start your journey?",
      //   name: "category",
      // },
    ],
  },
  {
    id: 5,
    title: "You're all set! 🎉",
    questions: [],
  },
];

const generateCloudPositions = (totalClouds, steps) => {
  const clouds = [];
  const cloudsPerStep = totalClouds / steps; // Number of clouds per batch

  for (let i = 0; i < totalClouds; i++) {
    const stepNo = Math.floor(i / cloudsPerStep) + 1; // Determine which batch the cloud belongs to
    clouds.push({
      id: i + 1,
      top: `${Math.random() * 105}%`,
      left: `${Math.random() * 105}%`,
      scale: `${3}`,
      className: `cloud-${stepNo}`, // Assign a class based on the batch
    });
  }

  return clouds;
};

const totalClouds = 500;
const cloudPositions = generateCloudPositions(totalClouds, steps.length);

function RegisterPage() {
  const queryClient = useQueryClient();

  const setUserAuth = useSetAtom(userAuthAtom);
  const [userAuth] = useAtom(userAuthAtom);

  const {
    isPending,
    error,
    data: analysisData,
    mutateAsync: analyzeUserBehaviour,
  } = useMutation({
    mutationFn: async ({ user_input, accessToken }) => {
      const response = await fetch("http://127.0.0.1:5000/api/analyze", {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        method: "POST",
        body: JSON.stringify({ user_input }),
      });
      const { data } = await response.json();
      return data;
    },
    enabled: false,
  });

  const {
    isPending: registerIsPending,
    error: registerError,
    data: userData,
    mutateAsync: registerUser,
  } = useMutation({
    mutationFn: async (user_input) => {
      const response = await fetch("http://127.0.0.1:5000/api/register", {
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
        body: JSON.stringify({ ...user_input }),
      });
      const data = await response.json();
      return data;
    },
    enabled: false,
  });

  const {
    isPending: recommendationsIsPending,
    error: recommendationsError,
    data: recommendationsData,
    mutateAsync: generateRecommendations,
  } = useMutation({
    mutationFn: async ({ user_input, accessToken }) => {
      console.log(user_input);
      const response = await fetch(
        "http://127.0.0.1:5000/api/recommendations",
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          method: "POST",
          body: JSON.stringify({ ...user_input }),
        }
      );
      const data = await response.json();
      return data;
    },
    enabled: false,
  });

  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [isRegistering, setIsRegistering] = useState(false);

  const createAccount = () => {
    console.log(answers);
  };

  const handleNext = async () => {
    if (currentStep === 0) {
      setIsRegistering(true);
      try {
        const response = await registerUser({
          username: answers.username,
          email: answers.email,
          password: answers.password,
        });
        if (response.access_token && response.user.id) {
          setUserAuth({ token: response.access_token, userId: response.user.id });
          setCurrentStep(currentStep + 1);
        }
      } catch (error) {
        console.error("Registration failed:", error);
      }
      setIsRegistering(false);
    } else if (currentStep === 1) {
      analyzeUserBehaviour({
        user_input: answers["daily_habits"],
        accessToken: userAuth.token,
      });
      setCurrentStep(currentStep + 1);
    } else if (currentStep === 3) {
      setCurrentStep(currentStep + 1);
      await generateRecommendations({
        user_input: {
          budget: answers.budget,
          categories: selectedCategories,
        },
        accessToken: userAuth.token,
      });
    } else if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const navigate = useNavigate();

  const handleInputChange = (name, value) => {
    setAnswers((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleNext();
    }
  };

  const toggleCategory = (category) => {
    setSelectedCategories((prev) =>
      prev.includes(category.title)
        ? prev.filter((title) => title !== category.title)
        : [...prev, category.title]
    );
  };

  return (
    <div className="flex h-screen">
      {/* Left Side - Image with Clouds */}
      <div className={`w-1/2 relative overflow-hidden step-${currentStep + 1}`}>
        <img
          src="https://images.unsplash.com/photo-1585506942812-e72b29cef752?q=80&w=1928&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" // Replace with your image path
          alt="Onboarding"
          className="w-full h-full object-cover"
        />
        {/* Render Clouds with Pre-generated Positions */}
        {cloudPositions.map((cloud) => (
          <div
            key={cloud.id}
            className={`cloud ${cloud.className} absolute`}
            style={{
              top: cloud.top,
              left: cloud.left,
              transform: `translate(-50%, -50%) scale(${cloud.scale})`,
            }}
          >
            <svg
              fill="#000"
              viewBox="0 0 640 640"
              xmlns="http://www.w3.org/2000/svg"
              className="w-16 h-16 opacity-80"
            >
              <path d="M144 288h156.1c22.5 19.7 51.6 32 83.9 32s61.3-12.3 83.9-32H528c61.9 0 112-50.1 112-112S589.9 64 528 64c-18 0-34.7 4.6-49.7 12.1C454 31 406.8 0 352 0c-41 0-77.8 17.3-104 44.8C221.8 17.3 185 0 144 0 64.5 0 0 64.5 0 144s64.5 144 144 144z" />
            </svg>
          </div>
        ))}
      </div>

      {/* Right Side - Onboarding Steps */}
      <div className="w-1/2 p-8 flex flex-col justify-center">
        <h2 className="text-3xl font-bold">Step {steps[currentStep].id}</h2>
        <h4 className="text-xl mb-4">{steps[currentStep].title || ""}</h4>
        {currentStep == 4 && (
          <>
            {recommendationsIsPending ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Generating your carbon neutral plan</span>
              </div>
            ) : (
              <h6 className="text-lg">
                Let's get started on reducing your carbon footprint.
              </h6>
            )}
          </>
        )}
        {currentStep == 2 && isPending && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Analysing your daily habits</span>
          </div>
        )}
        {currentStep == 2 && analysisData && (
          <>
            <Table>
              <TableCaption>
                Estimated monthly carbon footprint:{" "}
                {analysisData.estimated_monthly_carbon_footprint}
              </TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Emission Range</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {analysisData.items.map(
                  ({ category, emission_range, name, additional_info }) => (
                    <TableRow key={name}>
                      <TableCell className="font-medium">{name}</TableCell>
                      <TableCell>{category}</TableCell>
                      <TableCell>{emission_range}</TableCell>
                    </TableRow>
                  )
                )}
              </TableBody>
            </Table>
          </>
        )}
        {steps[currentStep].questions.map((question, index) => (
          <div key={index} className="mb-4">
            {question.type === "display" ? (
              <div>
                <p>{question.label}</p>
                <Button
                  variant="outline"
                  onClick={() => alert("View details clicked")}
                >
                  {question.details}
                </Button>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium mb-1">
                  {question.label}
                </label>
                <input
                  type={question.type}
                  value={answers[question.name] || ""}
                  name={question.name}
                  onChange={(e) =>
                    handleInputChange(e.target.name, e.target.value)
                  }
                  onKeyPress={handleKeyPress}
                  className="border p-2 rounded w-full"
                />
              </div>
            )}
          </div>
        ))}
        {currentStep === 3 && (
          <div>
            <label className="block text-lg font-medium mb-4">
              Which areas interest you the most? (Select a maximum of 3)
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {categories.map((category) => {
                const Icon = category.icon;
                const isSelected = selectedCategories.includes(category.title);

                return (
                  <div
                    key={category.id}
                    onClick={() => toggleCategory(category)}
                    className={`cursor-pointer rounded-lg border p-4 transition-all ${
                      isSelected
                        ? "border-green-500 bg-green-50"
                        : "border-gray-200 hover:border-green-200"
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <Icon
                        className={`w-6 h-6 ${
                          isSelected ? "text-green-500" : "text-gray-400"
                        }`}
                      />
                      <div>
                        <h3 className="font-medium">{category.title}</h3>
                        <p className="text-sm text-gray-500">
                          {category.description}
                        </p>
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
        )}
        <div className="flex justify-between mt-8">
          {currentStep < steps.length - 1 ? (
            <>
              <Button
                disabled={isPending}
                onClick={handleBack}
                variant="secondary"
                style={{ opacity: currentStep < 2 ? "0" : "1" }}
              >
                Back
              </Button>
              <Button
                onClick={handleNext}
                disabled={
                  isPending ||
                  isRegistering ||
                  steps[currentStep].questions.some((q) => !answers[q.name]) ||
                  (currentStep === 0 &&
                    answers.password !== answers.confirmPassword) ||
                  (currentStep === 3 && 
                    (selectedCategories.length < 1 || selectedCategories.length > 3))
                }
              >
                {isRegistering ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Registering...</span>
                  </div>
                ) : (
                  currentStep === steps.length - 1 ? "Finish" : "Next"
                )}
              </Button>
            </>
          ) : (
            <Button 
              onClick={() => navigate({ to: '/dashboard' })} 
              className="w-full"
              disabled={recommendationsIsPending}
            >
              Start your journey
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
