'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { SECURITY_QUESTIONS } from '@/types/auth';
import { Loader2 } from 'lucide-react';

export default function RegisterForm() {
  const [formData, setFormData] = useState({
    email: 'lavanyass429@gmail.com',
    phone: '9164838525',
    password: '',
    securityQuestionId: '',
    securityAnswer: '',
    shopName: 'Lavanya Sapthagiri Store',
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.securityAnswer.length < 5) {
      toast.error('Security answer must be at least 5 characters.');
      return;
    }
    if (!formData.securityQuestionId) {
      toast.error('Please select a security question.');
      return;
    }

    setIsLoading(true);
    toast.info('Attempting to create shop workspace...');

    // Mock API call
    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log('Submitting registration data:', {
      ...formData,
      securityQuestion: SECURITY_QUESTIONS.find(q => q.id === formData.securityQuestionId)?.question,
    });

    toast.success('Shop workspace created successfully!');
    setIsLoading(false);
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="glass-effect neon-panel interactive-glow rounded-2xl p-8">
        <h2 className="text-2xl font-bold text-white text-center mb-6">Create Shop Workspace</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            name="shopName"
            value={formData.shopName}
            onChange={handleInputChange}
            placeholder="Shop Name"
            className="premium-input"
            required
          />
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            placeholder="Email Address"
            className="premium-input"
            required
          />
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleInputChange}
            placeholder="Phone Number"
            className="premium-input"
          />
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleInputChange}
            placeholder="Password"
            className="premium-input"
            required
          />
          <select
            name="securityQuestionId"
            value={formData.securityQuestionId}
            onChange={handleInputChange}
            className="premium-input"
            required
          >
            <option value="" disabled>Select a security question...</option>
            {SECURITY_QUESTIONS.map((q) => (
              <option key={q.id} value={q.id}>{q.question}</option>
            ))}
          </select>
          <input
            type="text"
            name="securityAnswer"
            value={formData.securityAnswer}
            onChange={handleInputChange}
            placeholder="Your Answer (min. 5 characters)"
            className="premium-input"
            required
          />
          <button type="submit" className="premium-button-primary w-full" disabled={isLoading}>
            {isLoading ? <Loader2 className="animate-spin" /> : 'Create Shop Workspace'}
          </button>
        </form>
      </div>
    </div>
  );
}