// テスト実行時は常にPostgreSQLの接続URLを使用（.envの設定を上書き）
// dotenv.config()を呼び出す前に環境変数を設定することで、.envファイルの設定を上書き
process.env.DATABASE_URL = "postgresql://majong_user:majong_password@localhost:5432/majong_db?schema=public";

import dotenv from "dotenv";

dotenv.config({ override: true });

