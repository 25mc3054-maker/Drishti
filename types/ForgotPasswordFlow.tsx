'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { SECURITY_QUESTIONS, SecurityQuestion } from '@/types/auth';
import { Loader2, ArrowRight } from 'lucide-react';

type Step = 'email' | 'question' | 'reset';

export default function ForgotPasswordFlow() {
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [securityQuestion, setSecurityQuestion] = useState<SecurityQuestion | null>(null);
  const [securityAnswer, setSecurityAnswer] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      // API call to get the user's security question
      const response = await fetch(`/api/auth/security-question?email=${email}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to find user.');
      }

      const question = SECURITY_QUESTIONS.find(q => q.id === data.questionId);
      if (question) {
        setSecurityQuestion(question);
        setStep('question');
        toast.success("User found. Please answer your security question.");
      } else {
        throw new Error('Security question not found for this user.');
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnswerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      // API call to verify the answer
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, securityAnswer }),
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Incorrect answer.');
      }

      setStep('reset');
      toast.success("Correct! You can now reset your password.");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters long.");
      return;
    }
    setIsLoading(true);
    try {
      // API call to update the password
      const response = await fetch('/api/auth/reset-password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, newPassword }),
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to reset password.');
      }

      toast.success("Password has been reset successfully! You can now log in.");
      // Optionally redirect to login page
      setStep('email');
      setEmail('');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="glass-effect neon-panel interactive-glow rounded-2xl p-8">
        {step === 'email' && (
          <form onSubmit={handleEmailSubmit} className="space-y-4">
            <h2 className="text-2xl font-bold text-white text-center mb-6">Forgot Password</h2>
            <p className="text-center text-gemini-blue-200 text-sm mb-4">Enter your email to begin the recovery process.</p>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Your Email Address"
              className="premium-input"
              required
            />
            <button type="submit" className="premium-button-primary w-full" disabled={isLoading}>
              {isLoading ? <Loader2 className="animate-spin mx-auto" /> : 'Continue'}
            </button>
          </form>
        )}

        {step === 'question' && securityQuestion && (
          <form onSubmit={handleAnswerSubmit} className="space-y-4">
            <h2 className="text-2xl font-bold text-white text-center mb-2">Security Question</h2>
            <p className="text-gemini-blue-100 text-center bg-black/20 p-3 rounded-lg border border-gemini-blue-500/20">{securityQuestion.question}</p>
            <input
              type="text"
              value={securityAnswer}
              onChange={(e) => setSecurityAnswer(e.target.value)}
              placeholder="Your Answer"
              className="premium-input"
              required
            />
            <button type="submit" className="premium-button-primary w-full" disabled={isLoading}>
              {isLoading ? <Loader2 className="animate-spin mx-auto" /> : 'Verify Answer'}
            </button>
          </form>
        )}

        {step === 'reset' && (
          <form onSubmit={handlePasswordReset} className="space-y-4">
            <h2 className="text-2xl font-bold text-white text-center mb-6">Reset Your Password</h2>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="New Password"
              className="premium-input"
              required
            />
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm New Password"
              className="premium-input"
              required
            />
            <button type="submit" className="premium-button-primary w-full" disabled={isLoading}>
              {isLoading ? <Loader2 className="animate-spin mx-auto" /> : 'Reset Password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}