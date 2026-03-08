import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  async redirects() {
    return [
      { source: "/student/register",    destination: "/auth/register/student",    permanent: true },
      { source: "/consultant/register", destination: "/auth/register/consultant", permanent: true },
      { source: "/register",            destination: "/auth/register/student",    permanent: true },
      { source: "/login",               destination: "/auth/login",               permanent: true },
    ];
  },
};

export default nextConfig;
