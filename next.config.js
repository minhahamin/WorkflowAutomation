/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // API 라우트에서 파일 업로드 지원
  serverRuntimeConfig: {
    maxFileSize: '50mb',
  },
  // 이미지 최적화 설정
  images: {
    domains: [],
  },
}

module.exports = nextConfig

