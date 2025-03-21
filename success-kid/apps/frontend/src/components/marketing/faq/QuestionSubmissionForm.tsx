import { useState } from 'react';
import { motion } from 'framer-motion';

// Validate email format
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

interface FormFieldProps {
  label: string;
  name: string;
  type?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  error?: string | null;
}

// Form field component
const FormField = ({ label, name, type = 'text', value, onChange, error }: FormFieldProps) => {
  return (
    <div className="mb-4">
      <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      
      {type === 'textarea' ? (
        <textarea
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          rows={4}
          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary ${
            error ? 'border-red-300' : 'border-gray-300'
          }`}
        />
      ) : (
        <input
          id={name}
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary ${
            error ? 'border-red-300' : 'border-gray-300'
          }`}
        />
      )}
      
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
};

interface CategorySelectorProps {
  value: string;
  onChange: (value: string) => void;
  error?: string | null;
}

// Category selector component
const CategorySelector = ({ value, onChange, error }: CategorySelectorProps) => {
  const categories = [
    { id: 'general', name: 'General Question' },
    { id: 'account', name: 'Account & Profile' },
    { id: 'points', name: 'Success Points' },
    { id: 'tokens', name: 'SKC Tokens' },
    { id: 'wallet', name: 'Wallet & Transactions' },
    { id: 'technical', name: 'Technical Issue' }
  ];
  
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Question Category
      </label>
      
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        {categories.map(category => (
          <button
            key={category.id}
            type="button"
            onClick={() => onChange(category.id)}
            className={`px-3 py-2 border rounded-lg text-sm text-center transition ${
              value === category.id
                ? 'bg-primary text-white border-primary'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            {category.name}
          </button>
        ))}
      </div>
      
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
};

interface SuccessStateProps {
  onReset: () => void;
}

// Success message component
const SuccessState = ({ onReset }: SuccessStateProps) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="text-center py-6"
    >
      <div className="text-6xl mb-4">✅</div>
      <h3 className="text-2xl font-semibold text-green-600 mb-2">Question Submitted!</h3>
      <p className="text-gray-600 mb-6">
        Thank you for your question. Our team will review it and may add it to our FAQ section.
        We'll contact you if we need any additional information.
      </p>
      <button
        onClick={onReset}
        className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-600"
      >
        Ask Another Question
      </button>
    </motion.div>
  );
};

interface ErrorStateProps {
  onReset: () => void;
}

// Error message component
const ErrorState = ({ onReset }: ErrorStateProps) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="text-center py-6"
    >
      <div className="text-6xl mb-4">❌</div>
      <h3 className="text-2xl font-semibold text-red-600 mb-2">Submission Failed</h3>
      <p className="text-gray-600 mb-6">
        There was a problem submitting your question. Please try again or contact our support team directly.
      </p>
      <button
        onClick={onReset}
        className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-600"
      >
        Try Again
      </button>
    </motion.div>
  );
};

// Simulate form submission to an API
const submitQuestion = async (formData: any): Promise<void> => {
  return new Promise((resolve, reject) => {
    // Simulate API call with 80% success rate
    setTimeout(() => {
      if (Math.random() > 0.2) {
        resolve();
      } else {
        reject(new Error('Failed to submit question'));
      }
    }, 1000);
  });
};

interface QuestionSubmissionFormProps {
  trackFormSubmission: (category: string) => void;
}

export const QuestionSubmissionForm = ({ trackFormSubmission }: QuestionSubmissionFormProps) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    category: '',
    question: ''
  });
  
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  
  const validateForm = (): boolean => {
    const newErrors: Record<string, string | null> = {};
    
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    if (!isValidEmail(formData.email)) newErrors.email = 'Please enter a valid email';
    if (!formData.category) newErrors.category = 'Please select a category';
    if (!formData.question.trim()) newErrors.question = 'Please enter your question';
    if (formData.question.trim().length < 10) newErrors.question = 'Question is too short';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setStatus('submitting');
    
    try {
      // Submit the form data to your API
      await submitQuestion(formData);
      
      // Track successful submission
      trackFormSubmission(formData.category);
      
      // Show success state
      setStatus('success');
      setFormData({ name: '', email: '', category: '', question: '' });
    } catch (error) {
      console.error('Error submitting question:', error);
      setStatus('error');
    }
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when field is edited
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };
  
  // Return to form entry after success/error
  const resetForm = () => setStatus('idle');
  
  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
      <div className="bg-primary text-white p-4">
        <h3 className="text-xl font-semibold">Can't Find Your Answer?</h3>
      </div>
      
      <div className="p-6">
        {status === 'success' ? (
          <SuccessState onReset={resetForm} />
        ) : status === 'error' ? (
          <ErrorState onReset={resetForm} />
        ) : (
          <form onSubmit={handleSubmit}>
            <p className="text-gray-600 mb-6">
              Submit your question and our team will get back to you with an answer. We may also add it to our FAQ section.
            </p>
            
            {/* Form Fields */}
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <FormField
                label="Your Name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                error={errors.name}
              />
              
              <FormField
                label="Email Address"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                error={errors.email}
              />
            </div>
            
            <CategorySelector
              value={formData.category}
              onChange={(value) => {
                handleChange({ target: { name: 'category', value } } as React.ChangeEvent<HTMLInputElement>);
              }}
              error={errors.category}
            />
            
            <FormField
              label="Your Question"
              name="question"
              type="textarea"
              value={formData.question}
              onChange={handleChange}
              error={errors.question}
            />
            
            <button
              type="submit"
              disabled={status === 'submitting'}
              className={`w-full py-3 px-4 bg-primary text-white rounded-lg font-medium mt-4 ${
                status === 'submitting' ? 'opacity-70 cursor-not-allowed' : 'hover:bg-primary-600'
              }`}
            >
              {status === 'submitting' ? 'Submitting...' : 'Submit Your Question'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
