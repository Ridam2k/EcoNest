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
import { Loader2 } from "lucide-react";

import { useQuery, useQueryClient } from "@tanstack/react-query";

import "./app.css";
const steps = [
  {
    id: 1,
    title: "Tell us about yourself",
    questions: [
      { type: "text", label: "What's your name?", name: "name" },
      { type: "email", label: "What's your email?", name: "email" },
      { type: "text", label: "Where do you live?", name: "location" },
    ],
  },
  {
    id: 2,
    title: "Tell us about your habits",
    questions: [
      {
        type: "text",
        label: "Describe a day in your life",
        name: "habits",
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
        type: "number",
        label: "What's your monthy budget for environmental improvements?",
        name: "budget",
      },
      {
        type: "text",
        label: "How would you like to start your journey?",
        name: "category",
      },
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

const OnboardingPage = () => {
  const queryClient = useQueryClient();

  const {
    isFetching,
    error,
    data: userData,
    refetch: getUserData,
  } = useQuery({
    queryKey: ["userData"],
    queryFn: async () => {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            items: [
              {
                category: "Transportation",
                emission_range: "150-200 kg",
                name: "Daily commute with a 2013 Honda Accord",
                additional_info:
                  "The user drives 15 miles to and from work daily.",
              },
              {
                category: "Food",
                emission_range: "400-600 kg",
                name: "Non-vegetarian diet for a family of 4",
                additional_info:
                  "The user, their spouse, and their 2 kids all consume a non-vegetarian diet.",
              },
              {
                category: "Home Energy",
                emission_range: "200-300 kg",
                name: "Energy consumption from home appliances",
                additional_info:
                  "The user uses a double door refrigerator, dishwasher, toaster, HVAC, 4 laptops, phones, and other small gadgets. They also use LED bulbs for lighting.",
              },
              {
                category: "Home Energy",
                emission_range: "100-150 kg",
                name: "Thermostat settings",
                additional_info:
                  "The user keeps their thermostat at 68° fahrenheit in summers and 76 degrees fahrenheit in winters.",
              },
              {
                category: "Gardening",
                emission_range: "-1 - -0.5 kg",
                name: "Potted plants",
                additional_info:
                  "The user has 3-4 potted plants in their balcony.",
              },
            ],
            estimated_monthly_carbon_footprint: "850 kg",
          });
        }, 2000);
      });
    },
    enabled: false,
  });

  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState({});
  // const [userData, setUserData] = useState({
  //   items: [
  //     {
  //       category: "Transportation",
  //       emission_range: "150-200 kg",
  //       name: "Daily commute with a 2013 Honda Accord",
  //       additional_info: "The user drives 15 miles to and from work daily.",
  //     },
  //     {
  //       category: "Food",
  //       emission_range: "400-600 kg",
  //       name: "Non-vegetarian diet for a family of 4",
  //       additional_info:
  //         "The user, their spouse, and their 2 kids all consume a non-vegetarian diet.",
  //     },
  //     {
  //       category: "Home Energy",
  //       emission_range: "200-300 kg",
  //       name: "Energy consumption from home appliances",
  //       additional_info:
  //         "The user uses a double door refrigerator, dishwasher, toaster, HVAC, 4 laptops, phones, and other small gadgets. They also use LED bulbs for lighting.",
  //     },
  //     {
  //       category: "Home Energy",
  //       emission_range: "100-150 kg",
  //       name: "Thermostat settings",
  //       additional_info:
  //         "The user keeps their thermostat at 68° fahrenheit in summers and 76 degrees fahrenheit in winters.",
  //     },
  //     {
  //       category: "Gardening",
  //       emission_range: "-1 - -0.5 kg",
  //       name: "Potted plants",
  //       additional_info: "The user has 3-4 potted plants in their balcony.",
  //     },
  //   ],
  //   estimated_monthly_carbon_footprint: "850 kg",
  // }); // Store user answers

  useEffect(() => {
    if (currentStep === 2) {
      getUserData();
    }
  }, [currentStep]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleInputChange = (name, value) => {
    setAnswers((prev) => ({
      ...prev,
      [name]: value,
    }));
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
        {currentStep == 5 && (
          <h6 className="text-lg">
            Let's get started on reducing your carbon footprint.
          </h6>
        )}
        {currentStep == 2 && isFetching && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Analysing your daily habits</span>
          </div>
        )}
        {currentStep == 2 && userData && (
          <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Emission Range</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {userData.items.map(
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
          <p>Monthy carbon footprint: {userData.estimated_monthly_carbon_footprint}</p>
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
                  className="border p-2 rounded w-full"
                />
              </div>
            )}
          </div>
        ))}
        <div className="flex justify-between mt-8">
          {currentStep < steps.length - 1 ? (
            <>
              <Button
                disabled={isFetching}
                onClick={handleBack}
                variant="secondary"
                style={{ opacity: currentStep === 0 ? "0" : "1" }}
              >
                Back
              </Button>
              <Button onClick={handleNext} disabled={isFetching}>
                {currentStep === steps.length - 1 ? "Finish" : "Next"}
              </Button>
            </>
          ) : (
            <Button onClick={handleNext} className="w-full">
              Start your journey
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default OnboardingPage;
