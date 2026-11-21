import path from "path";
import { loadEnvConfig } from "@next/env";
import type { NextConfig } from "next";

// 루트 .env 로딩 (DEV_PLAN 0a, FS 3-1). .env 값은 여기서 읽지 않고 변수 이름으로만 쓴다
// 4번째 인자 forceReload=true: Next.js는 같은 프로세스에서 한 번 읽은 env 결과를 캐시하는데,
// 이 캐시를 무시하고 루트 .env를 다시 읽어 빈 결과가 들어오는 것을 막는다
const envDir = path.resolve(__dirname, "..");
loadEnvConfig(envDir, undefined, undefined, true);

const nextConfig: NextConfig = {};

export default nextConfig;
