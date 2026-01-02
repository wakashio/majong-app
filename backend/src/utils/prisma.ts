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
    
    console.log("=== Prisma Client Initialization ===");
    console.log("NODE_ENV:", process.env.NODE_ENV);
    console.log("DATABASE_URL exists:", !!databaseUrl);
    if (databaseUrl) {
      // セキュリティのため、パスワード部分をマスク
      const maskedUrl = databaseUrl.replace(/:[^:@]+@/, ":****@");
      console.log("DATABASE_URL (masked):", maskedUrl);
    } else {
      console.log("Using default DATABASE_URL");
    }
    
    try {
      // PrismaPgに直接connectionStringを渡す（推奨される方法）
      // これにより、pgライブラリが正しくパスワードを処理します
      const adapter = new PrismaPg({ connectionString: finalDatabaseUrl });
      prismaInstance = new PrismaClient({ adapter });
      
      // 接続テスト（非同期だが、エラーをログに記録）
      prismaInstance.$connect().catch((error) => {
        console.error("=== Prisma Connection Error ===");
        console.error("Error connecting to database:", error);
        if (error instanceof Error) {
          console.error("Error message:", error.message);
          console.error("Error stack:", error.stack);
        }
      });
      
      console.log("Prisma Client initialized successfully");
    } catch (error) {
      console.error("=== Prisma Client Initialization Error ===");
      console.error("Error creating Prisma Client:", error);
      if (error instanceof Error) {
        console.error("Error message:", error.message);
        console.error("Error stack:", error.stack);
      }
      throw error;
    }
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

