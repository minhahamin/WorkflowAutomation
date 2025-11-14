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
  // pdfmake를 외부 패키지로 처리 (webpack 번들링 제외)
  webpack: (config, { isServer }) => {
    if (isServer) {
      // 서버 사이드에서 pdfmake 관련 모듈을 externals로 처리
      config.externals = config.externals || [];
      config.externals.push({
        'pdfmake': 'commonjs pdfmake',
        '@foliojs-fork/fontkit': 'commonjs @foliojs-fork/fontkit',
        '@foliojs-fork/pdfkit': 'commonjs @foliojs-fork/pdfkit',
      });
    }
    return config;
  },
}

module.exports = nextConfig

