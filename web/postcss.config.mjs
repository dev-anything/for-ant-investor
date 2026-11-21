// Tailwind v4 표준 방식: PostCSS 플러그인으로 연결 (globals.css의 @import "tailwindcss" 처리)
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};

export default config;
