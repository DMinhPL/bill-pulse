import type { GlobalConfig } from 'payload';

import { isAdmin } from '../access/isAdmin';

export const AiSettings: GlobalConfig = {
  slug: 'ai-settings',
  access: { read: isAdmin, update: isAdmin },
  fields: [
    { name: 'model', type: 'text', defaultValue: 'gemini-3.8-flash' },
    { name: 'scanPrompt', type: 'textarea', defaultValue: 'Analyze this Vietnamese bill and return strict JSON. Categories: {{categories}}. Payment methods: {{paymentMethods}}.' },
    { name: 'inflationPrompt', type: 'textarea', defaultValue: 'Analyze these VND price trends: {{items}}.' },
    { name: 'inflationMaxItems', type: 'number', defaultValue: 20, min: 1 },
  ],
};
