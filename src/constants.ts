import { Formula } from './types';

export const FORMULAS: Formula[] = [
  { id: '1', title: 'Diện tích hình vuông', content: 'S = a × a', category: 'grade1-5' },
  { id: '2', title: 'Chu vi hình tròn', content: 'C = d × π', category: 'grade1-5' },
  { id: '3', title: 'Định lý Pitago', content: 'a² + b² = c²', category: 'grade6-9' },
  { id: '4', title: 'Hằng đẳng thức (1)', content: '(a + b)² = a² + 2ab + b²', category: 'grade6-9' },
  { id: '5', title: 'Đạo hàm xⁿ', content: '(xⁿ)\' = n·xⁿ⁻¹', category: 'grade10-12' },
  { id: '6', title: 'Công thức Euler', content: 'eⁱπ + 1 = 0', category: 'grade10-12' },
];

export const CONVERSIONS = {
  length: [
    { label: 'm to km', factor: 0.001 },
    { label: 'km to m', factor: 1000 },
    { label: 'cm to m', factor: 0.01 },
  ],
  weight: [
    { label: 'kg to g', factor: 1000 },
    { label: 'g to kg', factor: 0.001 },
  ],
  chemistry: [
    { label: 'mol to molecules', factor: 6.022e23 },
  ]
};
