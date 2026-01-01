# API仕様

## API設計方針（バックエンド実装時）

### RESTful API設計

RESTful APIの原則に従って設計します。

- リソース指向の設計
- HTTPメソッドの適切な使用
- ステートレスな設計
- 統一されたレスポンス形式

### TypeScript型安全性重視

すべてのAPIエンドポイントで型安全性を確保します。

- リクエスト/レスポンスの型定義
- 型ガードの使用
- バリデーションの実装

## エンドポイント規約

### ベースURL

```
/api
```

### エンドポイント命名規則

- `/api/`プレフィックスを使用
- リソース名は複数形
- スネークケースまたはケバブケースを使用

### 例

```
GET    /api/questions/:dataSourceId        # 問題一覧取得
GET    /api/questions/:dataSourceId/:id   # 問題詳細取得
GET    /api/progress/:dataSourceId         # 進捗取得
POST   /api/progress/:dataSourceId         # 進捗保存
POST   /api/answers/:dataSourceId          # 回答記録
GET    /api/statistics/:dataSourceId       # 統計情報取得
GET    /api/data-sources                   # データソース一覧取得
```

## レスポンス形式

### 成功レスポンス

```typescript
// 単一リソース
{
  "data": {
    "id": "1",
    "question": "問題文",
    // ...
  }
}

// 複数リソース
{
  "data": [
    {
      "id": "1",
      "question": "問題文1",
      // ...
    },
    {
      "id": "2",
      "question": "問題文2",
      // ...
    }
  ],
  "meta": {
    "total": 100,
    "page": 1,
    "perPage": 20
  }
}
```

### エラーレスポンス

```typescript
{
  "error": {
    "code": "ERROR_CODE",
    "message": "エラーメッセージ",
    "details": {
      // 詳細情報（オプション）
    }
  }
}
```

## HTTPステータスコード

### 成功

- `200 OK`: リクエスト成功
- `201 Created`: リソース作成成功
- `204 No Content`: リクエスト成功（レスポンスボディなし）

### クライアントエラー

- `400 Bad Request`: リクエストが不正
- `401 Unauthorized`: 認証が必要
- `403 Forbidden`: アクセス権限がない
- `404 Not Found`: リソースが見つからない
- `422 Unprocessable Entity`: バリデーションエラー

### サーバーエラー

- `500 Internal Server Error`: サーバー内部エラー
- `503 Service Unavailable`: サービス利用不可

## エラーハンドリング

### 統一されたエラーレスポンス形式

すべてのエラーは統一された形式で返します。

```typescript
interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}
```

### エラーコード

- `VALIDATION_ERROR`: バリデーションエラー
- `NOT_FOUND`: リソースが見つからない
- `INTERNAL_ERROR`: サーバー内部エラー
- `UNAUTHORIZED`: 認証エラー

### 実装例

```typescript
// backend/src/middleware/errorHandler.ts
import { Request, Response, NextFunction } from "express";

export function errorHandler(
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  console.error("Error:", error);
  
  if (error.name === "ValidationError") {
    res.status(422).json({
      error: {
        code: "VALIDATION_ERROR",
        message: error.message,
      },
    });
    return;
  }
  
  res.status(500).json({
    error: {
      code: "INTERNAL_ERROR",
      message: "Internal server error",
    },
  });
}
```

## 認証・認可

### 現状

- 認証・認可は未実装
- 将来の拡張時に実装を検討

### 将来の実装方針

- JWT（JSON Web Token）の使用を検討
- セッション管理の実装
- ロールベースのアクセス制御（必要に応じて）

## APIエンドポイント詳細（将来実装時）

### GET /api/questions/:dataSourceId

問題一覧を取得します。

**リクエスト:**
```
GET /api/questions/data_cloud
```

**レスポンス:**
```typescript
{
  "data": [
    {
      "number": 1,
      "question": "問題文",
      "choiceA": "選択肢A",
      "choiceB": "選択肢B",
      "choiceC": "選択肢C",
      "choiceD": "選択肢D",
      "correct_answer": "A",
      "explanation": "解説"
    },
    // ...
  ]
}
```

### GET /api/progress/:dataSourceId

学習進捗を取得します。

**リクエスト:**
```
GET /api/progress/data_cloud
```

**レスポンス:**
```typescript
{
  "data": {
    "version": "1.0.0",
    "lastUpdated": "2024-01-01T00:00:00.000Z",
    "currentPosition": 10,
    "lastStudyDate": "2024-01-01T00:00:00.000Z",
    "answers": {
      "1": {
        "userAnswer": "A",
        "isCorrect": true,
        "attemptCount": 1,
        "firstAnsweredAt": "2024-01-01T00:00:00.000Z",
        "lastAnsweredAt": "2024-01-01T00:00:00.000Z"
      }
    },
    "statistics": {
      "totalQuestions": 100,
      "answeredQuestions": 10,
      "correctAnswers": 8,
      "accuracy": 80,
      "totalStudyTimeMinutes": 60,
      "sessionsCount": 5
    }
  }
}
```

### POST /api/progress/:dataSourceId

学習進捗を保存します。

**リクエスト:**
```
POST /api/progress/data_cloud
Content-Type: application/json

{
  "currentPosition": 10,
  "answers": {
    "1": {
      "userAnswer": "A",
      "isCorrect": true,
      // ...
    }
  },
  // ...
}
```

**レスポンス:**
```typescript
{
  "data": {
    "message": "Progress saved successfully"
  }
}
```

### POST /api/answers/:dataSourceId

回答を記録します。

**リクエスト:**
```
POST /api/answers/data_cloud
Content-Type: application/json

{
  "questionNumber": 1,
  "userAnswer": "A",
  "correctAnswer": "A"
}
```

**レスポンス:**
```typescript
{
  "data": {
    "message": "Answer saved successfully",
    "isCorrect": true
  }
}
```

### GET /api/statistics/:dataSourceId

統計情報を取得します。

**リクエスト:**
```
GET /api/statistics/data_cloud
```

**レスポンス:**
```typescript
{
  "data": {
    "totalQuestions": 100,
    "answeredQuestions": 50,
    "correctAnswers": 40,
    "accuracy": 80,
    "totalStudyTimeMinutes": 120,
    "sessionsCount": 10
  }
}
```

### GET /api/data-sources

利用可能なデータソース一覧を取得します。

**リクエスト:**
```
GET /api/data-sources
```

**レスポンス:**
```typescript
{
  "data": [
    {
      "id": "data_cloud",
      "name": "Data Cloud コンサルタント",
      "filePath": "salesforce_data_cloud_questions_complete.csv"
    },
    {
      "id": "agentforce",
      "name": "Agentforce スペシャリスト",
      "filePath": "Salesforce認定Agentforceスペシャリスト100題 問題集全問解答＋全問解説付き(2025年).csv"
    }
  ]
}
```

## バリデーション

### リクエストバリデーション

すべてのリクエストをバリデーションします。

```typescript
// 例: 回答記録のバリデーション
interface AnswerRequest {
  questionNumber: number;
  userAnswer: string;
  correctAnswer: string;
}

function validateAnswerRequest(body: unknown): AnswerRequest {
  if (!body || typeof body !== "object") {
    throw new Error("Invalid request body");
  }
  
  const request = body as Record<string, unknown>;
  
  if (typeof request.questionNumber !== "number") {
    throw new Error("questionNumber must be a number");
  }
  
  if (typeof request.userAnswer !== "string") {
    throw new Error("userAnswer must be a string");
  }
  
  if (typeof request.correctAnswer !== "string") {
    throw new Error("correctAnswer must be a string");
  }
  
  return request as AnswerRequest;
}
```

## レート制限（将来実装時）

- API呼び出しのレート制限を検討
- 過度なリクエストを防ぐ

## CORS設定

フロントエンドとバックエンドが異なるオリジンで動作する場合、CORS設定が必要です。

```typescript
// backend/src/app.ts の例（将来実装時）
import cors from "cors";

app.use(cors({
  origin: "http://localhost:5173",  // フロントエンドのURL
  credentials: true,
}));
```

