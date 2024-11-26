/** @type {import('next').NextConfig} */
const nextConfig = {
    experimental: {
        serverActions: true,
    },
    // Désactiver le middleware
    skipMiddlewareUrlNormalize: true,
    skipTrailingSlashRedirect: true,
}

export default nextConfig 