import type { Config } from 'tailwindcss';
export default { content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'], theme: { extend: { colors: { brand: { 50:'#F1F7FF',100:'#E4F0FF',200:'#C8E0FF',500:'#2580E8',600:'#1769D2',700:'#104A9B',900:'#12345B' } }, boxShadow: { soft:'0 12px 35px rgba(16,74,155,.08)' } } }, plugins: [] } satisfies Config;
