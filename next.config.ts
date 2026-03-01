import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: "http",
                hostname: "localhost",
                port: "9000",
                pathname: "/aurralis/**",
            },
            {
                protocol: "http",
                hostname: "31.97.230.171",
                port: "9000",
                pathname: "/aurralis/**",
            },
        ],
    },
};

export default nextConfig;
