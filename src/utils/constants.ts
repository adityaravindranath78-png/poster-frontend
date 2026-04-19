// `color` is the leading-dot color on the category chip — sets the category's
// visual identity without resorting to emoji. Values pulled from poster
// templates' dominant gradients.
export const CATEGORIES = [
  {id: 'good_morning', label: 'Good Morning', hi: 'शुभ प्रभात', color: '#F4A72C'},
  {id: 'good_night', label: 'Good Night', hi: 'शुभ रात्रि', color: '#4C3A7B'},
  {id: 'devotional', label: 'Devotional', hi: 'भक्ति', color: '#9C2223'},
  {id: 'festival', label: 'Festival', hi: 'त्यौहार', color: '#E85D2F'},
  {id: 'shayari', label: 'Shayari', hi: 'शायरी', color: '#8B1E8B'},
  {id: 'motivational', label: 'Motivational', hi: 'प्रेरणा', color: '#2E7D5C'},
  {id: 'birthday', label: 'Birthday', hi: 'जन्मदिन', color: '#EC407A'},
  {id: 'anniversary', label: 'Anniversary', hi: 'सालगिरह', color: '#C2185B'},
  {id: 'business', label: 'Business', hi: 'व्यापार', color: '#143B5E'},
  {id: 'patriotic', label: 'Patriotic', hi: 'देशभक्ति', color: '#0E5739'},
  {id: 'love', label: 'Love', hi: 'प्यार', color: '#D32F2F'},
  {id: 'friendship', label: 'Friendship', hi: 'दोस्ती', color: '#1976D2'},
] as const;

export const LANGUAGES = [
  {id: 'hi', label: 'Hindi'},
  {id: 'en', label: 'English'},
  {id: 'mr', label: 'Marathi'},
  {id: 'gu', label: 'Gujarati'},
  {id: 'ta', label: 'Tamil'},
  {id: 'te', label: 'Telugu'},
  {id: 'kn', label: 'Kannada'},
  {id: 'ml', label: 'Malayalam'},
] as const;

export const SUBSCRIPTION_PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    currency: 'INR',
    interval: 'monthly' as const,
    features: [
      'Browse all templates',
      'Quick Mode with watermark',
      'Basic fonts',
    ],
  },
  {
    id: 'premium_monthly',
    name: 'Premium Monthly',
    price: 99,
    currency: 'INR',
    interval: 'monthly' as const,
    features: [
      'No watermark',
      'All templates',
      'All fonts',
      'Video export',
      'Priority support',
    ],
  },
  {
    id: 'premium_yearly',
    name: 'Premium Yearly',
    price: 599,
    currency: 'INR',
    interval: 'yearly' as const,
    features: [
      'Everything in Premium',
      'Save ₹589/year',
    ],
  },
  {
    id: 'business',
    name: 'Business',
    price: 1999,
    currency: 'INR',
    interval: 'yearly' as const,
    features: [
      'Everything in Premium',
      'Custom branded frames',
      'Priority templates',
      'Business card maker',
    ],
  },
] as const;

export const DEFAULT_CANVAS = {
  width: 1080,
  height: 1080,
};
