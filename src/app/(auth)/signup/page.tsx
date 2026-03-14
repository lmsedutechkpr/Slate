'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { GraduationCap, BookOpen, ShoppingBag } from 'lucide-react';

import AuthWindow from '@/components/auth/AuthWindow';
import { SignupRoleCard } from '@/components/auth/SignupRoleCard';
import { StudentForm } from './StudentForm';
import { InstructorForm } from './InstructorForm';
import { SellerForm } from './SellerForm';

type Role = 'student' | 'instructor' | 'seller' | null;

export default function SignupPage() {
  const [role, setRole] = useState<Role>(null);
  const [step, setStep] = useState(1);
  const searchParams = useSearchParams();
  const urlRole = searchParams.get('role') as Role;

  // Auto-skip step 1 if role in URL
  useEffect(() => {
    if (urlRole === 'student' || urlRole === 'instructor' || urlRole === 'seller') {
      setRole(urlRole);
      setStep(2);
    }
  }, [urlRole]);

  // Framer Motion constraints
  const variants: Variants = {
    initial: (direction: number) => ({
      x: direction > 0 ? 50 : -50,
      opacity: 0
    }),
    animate: {
      x: 0,
      opacity: 1,
      transition: { duration: 0.3, ease: 'easeOut' }
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 50 : -50,
      opacity: 0,
      transition: { duration: 0.3, ease: 'easeIn' }
    })
  };

  const [direction, setDirection] = useState(1);

  const goToStep2 = () => {
    setDirection(1);
    setStep(2);
  };

  const goBack = () => {
    setDirection(-1);
    setStep(1);
  };

  return (
    <AnimatePresence mode="wait" initial={false} custom={direction}>
      {step === 1 && (
        <motion.div
          key="step1"
          custom={direction}
          variants={variants}
          initial="initial"
          animate="animate"
          exit="exit"
          className="w-full flex justify-center"
        >
          <AuthWindow title="Join Slate" width="lg">
            <div className="text-center">
              <h1 className="font-sans text-[22px] font-bold text-[var(--text)]">Join Slate</h1>
              <p className="mt-1 text-[13px] text-[var(--text-secondary)]">Choose how you want to get started</p>
            </div>

            <div className="mt-6 flex flex-col gap-3">
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <SignupRoleCard
                  icon={<GraduationCap className="h-5 w-5" />}
                  title="Student"
                  description="Learn from expert instructors at your own pace"
                  points={['Access 100+ courses', 'Earn certificates', 'Join live classes']}
                  selected={role === 'student'}
                  onClick={() => setRole('student')}
                />
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                <SignupRoleCard
                  icon={<BookOpen className="h-5 w-5" />}
                  title="Instructor"
                  description="Share your knowledge and build a teaching business"
                  points={['Create & sell courses', 'Host live classes', '70% revenue share']}
                  selected={role === 'instructor'}
                  requiresApproval
                  requiresApprovalText="Your application will be reviewed by our team. You'll get access within 24–48 hours of approval."
                  onClick={() => setRole('instructor')}
                />
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                <SignupRoleCard
                  icon={<ShoppingBag className="h-5 w-5" />}
                  title="Seller"
                  description="Sell tech accessories to our learning community"
                  points={['List unlimited products', 'Reach active learners', '85% revenue share']}
                  selected={role === 'seller'}
                  requiresApproval
                  requiresApprovalText="Your application will be reviewed by our team. You'll get access within 24–48 hours of approval."
                  onClick={() => setRole('seller')}
                />
              </motion.div>
            </div>

            <button
              onClick={goToStep2}
              disabled={!role}
              className="mt-6 w-full rounded-full bg-[var(--text)] py-3 text-[14px] font-semibold text-[var(--bg)] transition-all duration-150 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Continue →
            </button>

            <div className="mt-4 text-center">
              <p className="text-[13px] text-[var(--text-muted)]">
                Already have an account?{' '}
                <a href="/login" className="font-medium text-[var(--text)] hover:underline hover:text-[var(--text-secondary)]">
                  Sign in
                </a>
              </p>
            </div>
          </AuthWindow>
        </motion.div>
      )}

      {step === 2 && role === 'student' && (
        <motion.div
          key="step2-student"
          custom={direction}
          variants={variants}
          initial="initial"
          animate="animate"
          exit="exit"
          className="w-full flex justify-center"
        >
          <StudentForm onBack={goBack} />
        </motion.div>
      )}

      {step === 2 && role === 'instructor' && (
        <motion.div
          key="step2-instructor"
          custom={direction}
          variants={variants}
          initial="initial"
          animate="animate"
          exit="exit"
          className="w-full flex justify-center"
        >
          <InstructorForm onBack={goBack} />
        </motion.div>
      )}

      {step === 2 && role === 'seller' && (
        <motion.div
          key="step2-seller"
          custom={direction}
          variants={variants}
          initial="initial"
          animate="animate"
          exit="exit"
          className="w-full flex justify-center"
        >
          <SellerForm onBack={goBack} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
