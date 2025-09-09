/** @type {import('next').NextConfig} */
const nextConfig = {
	async rewrites() {
		return [
			{
				source: "/api/:path*",
				destination: process.env.API_PROXY_DEST || "http://localhost:3001/api/:path*",
			},
				{
					source: "/uploads/:path*",
					destination: process.env.UPLOADS_PROXY_DEST || "http://localhost:3001/uploads/:path*",
				},
		];
	},
};

export default nextConfig;
