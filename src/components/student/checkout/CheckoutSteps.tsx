'use client';

import { Check } from 'lucide-react';

interface CheckoutStepsProps {
  currentStep: number; // 1, 2, or 3
}

const STEPS = [
  { id: 1, label: 'Cart Review' },
  { id: 2, label: 'Address' },
  { id: 3, label: 'Payment' },
];

export default function CheckoutSteps({ currentStep }: CheckoutStepsProps) {
  return (
    <div className="flex items-center mb-8">
      {STEPS.map((step, i) => {
        const isCompleted = currentStep > step.id;
        const isActive = currentStep === step.id;
        const isUpcoming = currentStep < step.id;

        return (
          <div key={step.id} className="flex items-center">
            {/* Step indicator */}
            <div className="flex items-center gap-2">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-bold transition-all duration-300 ${
                  isCompleted
                    ? 'bg-[#28C840] text-white shadow-sm'
                    : isActive
                    ? 'bg-gray-900 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-400 border border-gray-200'
                }`}
              >
                {isCompleted ? <Check className="w-3.5 h-3.5" strokeWidth={3} /> : step.id}
              </div>
              <span
                className={`text-[13px] font-medium transition-colors duration-300 ${
                  isActive || isCompleted ? 'text-gray-900' : 'text-gray-400'
                }`}
              >
                {step.label}
              </span>
            </div>

            {/* Connector */}
            {i < STEPS.length - 1 && (
              <div
                className={`flex-1 h-px mx-4 min-w-[40px] transition-colors duration-500 ${
                  isCompleted ? 'bg-[#28C840]' : 'bg-gray-200'
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
