import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import dotenv from "dotenv";
import path from "path";

// 環境変数を読み込む（backendディレクトリの.envファイルを明示的に指定）
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

let prismaInstance: PrismaClient | null = null;

/**
 * Prisma Clientのシングルトンインスタンスを取得
 * 環境変数が設定されていない場合、デフォルト値を設定
 */
export function getPrismaClient(): PrismaClient {
  if (!prismaInstance) {
    // 環境変数が設定されていない、または空文字列の場合、デフォルト値を設定
    const databaseUrl = process.env.DATABASE_URL;
    const finalDatabaseUrl = databaseUrl && databaseUrl.trim() !== ""
      ? databaseUrl.trim()
      : "postgresql://majong_user:majong_password@localhost:5432/majong_db?schema=public";
    
    // PrismaPgに直接connectionStringを渡す（推奨される方法）
    // これにより、pgライブラリが正しくパスワードを処理します
    const adapter = new PrismaPg({ connectionString: finalDatabaseUrl });
    prismaInstance = new PrismaClient({ adapter });
  }
  return prismaInstance;
}

/**
 * Prisma Clientの接続を切断
 * 主にテストやアプリケーション終了時に使用
 */
export async function disconnectPrisma(): Promise<void> {
  if (prismaInstance) {
    await prismaInstance.$disconnect();
    prismaInstance = null;
  }
}

