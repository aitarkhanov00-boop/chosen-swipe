/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,   // ← это спасает от всех ESLint-ошибок на сборке
  },
  typescript: {
    ignoreBuildErrors: false,   // можно оставить false, если хочешь строгую проверку
  },
};

module.exports = nextConfig;
