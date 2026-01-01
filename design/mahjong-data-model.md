# 麻雀記録アプリ データモデル設計書

## 概要

麻雀記録アプリのデータモデル設計書です。参加者、半荘、局、打点記録などのエンティティとその関係を定義します。

## エンティティ一覧

1. Player（参加者）
2. Session（セッション）
3. SessionPlayer（セッション参加者）
4. Hanchan（半荘）
5. Round（局）
6. Score（打点記録）
7. Naki（鳴き）
8. Riichi（リーチ）

## エンティティ詳細

### 1. Player（参加者）

参加者情報を管理するエンティティです。

#### 属性

- `id`: UUID（主キー）
- `name`: 文字列（参加者名、必須、一意）
- `createdAt`: 日時（作成日時）
- `updatedAt`: 日時（更新日時）

#### 関係

- 1対多: Hanchan（参加者は複数の半荘に参加可能）
- 1対多: Score（参加者は複数の打点記録を持つ）
- 多対多: Session（参加者は複数のセッションに参加可能、SessionPlayer経由）

### 2. Session（セッション）

セッション情報を管理するエンティティです。1日の麻雀セッションを表し、そのセッションに参加した参加者と、そのセッション中に行われた半荘を紐づけます。

#### 属性

- `id`: UUID（主キー）
- `date`: 日時（セッションの日付、日付のみ、時刻なし、必須）
- `name`: 文字列（セッション名、オプション）
- `createdAt`: 日時（作成日時）
- `updatedAt`: 日時（更新日時）

#### 関係

- 1対多: SessionPlayer（セッションは複数の参加者を持つ）
- 1対多: Hanchan（セッションは複数の半荘を持つ）

#### 補足

- セッションの日付は日付のみ（時刻なし）で管理する
- 同日に複数セッションを作成できる
- セッション作成時は参加者を4人以上選択する必要がある（バリデーション）

### 3. SessionPlayer（セッション参加者）

セッションと参加者の関係を管理するエンティティです。

#### 属性

- `id`: UUID（主キー）
- `sessionId`: UUID（セッションID、外部キー、必須）
- `playerId`: UUID（参加者ID、外部キー、必須）
- `createdAt`: 日時（作成日時）
- `updatedAt`: 日時（更新日時）

#### 関係

- 多対1: Session（セッションに属する）
- 多対1: Player（参加者に属する）

#### 制約

- `sessionId`と`playerId`の組み合わせは一意

### 4. Hanchan（半荘）

半荘情報を管理するエンティティです。

#### 属性

- `id`: UUID（主キー）
- `name`: 文字列（半荘名、オプション）
- `startedAt`: 日時（開始日時、必須）
- `endedAt`: 日時（終了日時、オプション）
- `status`: 列挙型（`IN_PROGRESS`、`COMPLETED`、必須）
- `sessionId`: UUID（セッションID、外部キー、オプション）
- `createdAt`: 日時（作成日時）
- `updatedAt`: 日時（更新日時）

#### 関係

- 多対1: Player（半荘は4人の参加者を持つ）
- 多対1: Session（半荘はセッションに属する、オプション）
- 1対多: Round（半荘は複数の局を持つ）
- 1対多: HanchanPlayer（半荘と参加者の関係、席順を管理）

#### 補足

- 半荘は4人の参加者で構成される
- 席順は`HanchanPlayer`エンティティで管理する
- `sessionId`はオプション（後方互換性のため）
- セッション詳細画面から作成した半荘は自動的にそのセッションに紐づく
- セッション削除時は、紐づく半荘の`sessionId`を`null`に設定する（Cascade削除はしない）

### 5. HanchanPlayer（半荘参加者）

半荘と参加者の関係、および席順を管理するエンティティです。

#### 属性

- `id`: UUID（主キー）
- `hanchanId`: UUID（半荘ID、外部キー、必須）
- `playerId`: UUID（参加者ID、外部キー、必須）
- `seatPosition`: 整数（席順、0-3、必須）
- `initialScore`: 整数（開始点数、デフォルト: 25000、必須）
- `finalScore`: 整数（ウマオカ考慮前の終了点数、オプション）
- `finalScoreWithUmaOka`: 整数（ウマオカ考慮後の終了点数、オプション）
- `createdAt`: 日時（作成日時）
- `updatedAt`: 日時（更新日時）

#### 関係

- 多対1: Hanchan（半荘に属する）
- 多対1: Player（参加者に属する）

#### 制約

- `hanchanId`と`playerId`の組み合わせは一意
- `hanchanId`と`seatPosition`の組み合わせは一意（同じ半荘内で席順は重複しない）

### 6. Round（局）

局情報を管理するエンティティです。

#### 属性

- `id`: UUID（主キー）
- `hanchanId`: UUID（半荘ID、外部キー、必須）
- `roundNumber`: 整数（局番号、1-16、必須）
- `wind`: 列挙型（`EAST`、`SOUTH`、`WEST`、`NORTH`、必須）
- `dealerPlayerId`: UUID（親の参加者ID、外部キー、必須）
- `honba`: 整数（本場、デフォルト: 0、必須）
- `riichiSticks`: 整数（積み棒、デフォルト: 0、必須）
- `isRenchan`: 真偽値（連荘かどうか、デフォルト: false、必須）
- `resultType`: 列挙型（`TSUMO`、`RON`、`DRAW`、`NAGASHI_MANGAN`、`SPECIAL_DRAW`、オプション）
- `specialDrawType`: 列挙型（`FOUR_KAN`、`FOUR_WIND`、`NINE_TERMINALS`、オプション）
- `startedAt`: 日時（開始日時、オプション）
- `endedAt`: 日時（終了日時、オプション）
- `createdAt`: 日時（作成日時）
- `updatedAt`: 日時（更新日時）

#### 関係

- 多対1: Hanchan（局は半荘に属する）
- 多対1: Player（親の参加者）
- 1対多: Score（局は複数の打点記録を持つ）
- 1対多: Naki（局は複数の鳴き記録を持つ）
- 1対多: Riichi（局は複数のリーチ記録を持つ）

#### 補足

- 局番号は1-16（東1局から北4局まで）
- 風は東、南、西、北の4種類
- 親は`dealerPlayerId`で指定
- 本場は親が上がった場合に増加
- 積み棒はリーチや流局時に増加
- `startedAt`フィールドは記録用として残す（ラウンドの開始という概念は削除）
- `endedAt`フィールドは局終了時の記録用として使用
- ラウンドが作成された時点で、すぐにアクション（鳴き、リーチなど）を追加できる（開始概念は不要）
- 局の状態は`startedAt`と`endedAt`から判定する（参考情報として）
  - `NOT_STARTED`: `startedAt === null && endedAt === null`
  - `IN_PROGRESS`: `startedAt !== null && endedAt === null`
  - `COMPLETED`: `endedAt !== null`

### 7. Score（打点記録）

打点記録を管理するエンティティです。

#### 属性

- `id`: UUID（主キー）
- `roundId`: UUID（局ID、外部キー、必須）
- `playerId`: UUID（参加者ID、外部キー、必須）
- `scoreChange`: 整数（点数変動、必須）
- `isDealer`: 真偽値（親かどうか、必須）
- `isWinner`: 真偽値（和了者かどうか、必須）
- `isRonTarget`: 真偽値（ロンの対象者かどうか、オプション）
- `han`: 整数（飜数、オプション）
- `fu`: 整数（符、オプション）
- `yaku`: 文字列配列（役のリスト、オプション）
- `createdAt`: 日時（作成日時）
- `updatedAt`: 日時（更新日時）

#### 関係

- 多対1: Round（打点記録は局に属する）
- 多対1: Player（打点記録は参加者に属する）

#### 補足

- `scoreChange`は正の値（和了者）または負の値（放銃者・供託者）
- ツモの場合は和了者以外全員が負の値
- ロンの場合は放銃者のみが負の値
- 流局の場合は点数変動なし（0）

### 8. RoundAction（局アクション）

鳴き記録とリーチ記録を統合して管理するエンティティです。

#### 属性

- `id`: UUID（主キー）
- `roundId`: UUID（局ID、外部キー、必須）
- `playerId`: UUID（参加者ID、外部キー、必須）
- `type`: 列挙型（`NAKI`、`RIICHI`、必須）
- `declaredAt`: 日時（宣言日時、必須）※リーチの場合のみ使用
- **鳴き関連フィールド（type=NAKIの場合のみ使用）:**
  - `nakiType`: 列挙型（`PON`、`CHI`、`DAIMINKAN`、`ANKAN`、オプション）
  - `targetPlayerId`: UUID（対象参加者ID、外部キー、オプション）
  - `tiles`: 文字列配列（牌のリスト、オプション）
- `createdAt`: 日時（作成日時）
- `updatedAt`: 日時（更新日時）

#### 関係

- 多対1: Round（局アクションは局に属する）
- 多対1: Player（局アクションは参加者に属する）
- 多対1: Player（対象参加者、オプション、鳴きの場合のみ）

#### 補足

- 麻雀のルール上、鳴きとリーチは互いに排他的であるため、同じ参加者が同じ局で鳴きとリーチを同時に持つことは不可能
- `type=NAKI`の場合:
  - `nakiType`、`tiles`が必須
  - `nakiType`が`ANKAN`（暗槓）の場合は`targetPlayerId`は不要
  - `nakiType`が`PON`、`CHI`、`DAIMINKAN`の場合は`targetPlayerId`が必要
  - `declaredAt`は使用しない（null）
- `type=RIICHI`の場合:
  - `declaredAt`が必須
  - `nakiType`、`targetPlayerId`、`tiles`は使用しない（null）
  - リーチは1局につき1人1回まで
  - リーチ宣言時に積み棒を1つ追加（`Round.riichiSticks`を1増やす）

### 9. Naki（鳴き）【非推奨】

**注意**: このモデルは非推奨です。`RoundAction`モデルを使用してください。

### 10. Riichi（リーチ）【非推奨】

**注意**: このモデルは非推奨です。`RoundAction`モデルを使用してください。

## データベーススキーマ（Prisma）

### Player

```prisma
model Player {
  id        String   @id @default(uuid())
  name      String   @unique
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  hanchanPlayers HanchanPlayer[]
  scores         Score[]
  dealerRounds   Round[]          @relation("DealerPlayer")
  actions        RoundAction[]
  actionTargets  RoundAction[]   @relation("ActionTarget")
  sessionPlayers SessionPlayer[]
  nakis          Naki[]          // 非推奨: RoundActionを使用
  riichis        Riichi[]        // 非推奨: RoundActionを使用
}
```

### Session

```prisma
model Session {
  id        String   @id @default(uuid())
  date      DateTime // セッションの日付（日付のみ、時刻なし）
  name      String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  sessionPlayers SessionPlayer[]
  hanchans       Hanchan[]
}
```

### SessionPlayer

```prisma
model SessionPlayer {
  id        String   @id @default(uuid())
  sessionId String
  playerId  String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  session Session @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  player  Player  @relation(fields: [playerId], references: [id], onDelete: Cascade)

  @@unique([sessionId, playerId])
  @@index([sessionId])
  @@index([playerId])
}
```

### Hanchan

```prisma
model Hanchan {
  id        String   @id @default(uuid())
  name      String?
  startedAt DateTime
  endedAt   DateTime?
  status    HanchanStatus @default(IN_PROGRESS)
  sessionId String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  session        Session?        @relation(fields: [sessionId], references: [id], onDelete: SetNull)
  hanchanPlayers HanchanPlayer[]
  rounds         Round[]
}

enum HanchanStatus {
  IN_PROGRESS
  COMPLETED
}
```

### HanchanPlayer

```prisma
model HanchanPlayer {
  id                 String   @id @default(uuid())
  hanchanId          String
  playerId           String
  seatPosition       Int      // 0-3
  initialScore       Int      @default(25000)
  finalScore         Int?     // ウマオカ考慮前の値（currentScore）
  finalScoreWithUmaOka Int?   // ウマオカ考慮後の値
  createdAt          DateTime @default(now())
  updatedAt          DateTime @updatedAt

  hanchan Hanchan @relation(fields: [hanchanId], references: [id], onDelete: Cascade)
  player  Player  @relation(fields: [playerId], references: [id], onDelete: Cascade)

  @@unique([hanchanId, playerId])
  @@unique([hanchanId, seatPosition])
  @@index([hanchanId])
  @@index([playerId])
}
```

### Round

```prisma
model Round {
  id              String      @id @default(uuid())
  hanchanId       String
  roundNumber     Int         // 1-16
  wind            Wind
  dealerPlayerId  String
  honba           Int         @default(0)
  riichiSticks    Int         @default(0)
  isRenchan       Boolean     @default(false)
  resultType      RoundResultType?
  specialDrawType SpecialDrawType?
  startedAt       DateTime?
  endedAt         DateTime?
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt

  hanchan      Hanchan      @relation(fields: [hanchanId], references: [id], onDelete: Cascade)
  dealerPlayer Player       @relation("DealerPlayer", fields: [dealerPlayerId], references: [id])
  scores       Score[]
  actions      RoundAction[]
  nakis        Naki[]       // 非推奨: RoundActionを使用
  riichis      Riichi[]     // 非推奨: RoundActionを使用

  @@index([hanchanId])
  @@index([dealerPlayerId])
}

enum Wind {
  EAST
  SOUTH
  WEST
  NORTH
}

enum RoundResultType {
  TSUMO
  RON
  DRAW
  NAGASHI_MANGAN
  SPECIAL_DRAW
}

enum SpecialDrawType {
  FOUR_KAN
  FOUR_WIND
  NINE_TERMINALS
}
```

### Score

```prisma
model Score {
  id          String   @id @default(uuid())
  roundId     String
  playerId    String
  scoreChange Int
  isDealer    Boolean
  isWinner    Boolean
  isRonTarget Boolean?
  han         Int?
  fu          Int?
  yaku        String[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  round  Round  @relation(fields: [roundId], references: [id], onDelete: Cascade)
  player Player @relation(fields: [playerId], references: [id], onDelete: Cascade)

  @@index([roundId])
  @@index([playerId])
}
```

### RoundAction

```prisma
model RoundAction {
  id            String        @id @default(uuid())
  roundId       String
  playerId      String
  type          RoundActionType
  declaredAt    DateTime?
  nakiType      NakiType?
  targetPlayerId String?
  tiles         String[]
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt

  round        Round  @relation(fields: [roundId], references: [id], onDelete: Cascade)
  player       Player @relation(fields: [playerId], references: [id], onDelete: Cascade)
  targetPlayer Player? @relation("ActionTarget", fields: [targetPlayerId], references: [id])

  @@index([roundId])
  @@index([playerId])
  @@unique([roundId, playerId, type]) // 同じ参加者が同じ局で鳴きとリーチを同時に持たないことを保証
}

enum RoundActionType {
  NAKI
  RIICHI
}

enum NakiType {
  PON
  CHI
  DAIMINKAN
  ANKAN
}
```

### Naki【非推奨】

```prisma
model Naki {
  id            String   @id @default(uuid())
  roundId       String
  playerId      String
  type          NakiType
  targetPlayerId String?
  tiles         String[]
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  round        Round  @relation(fields: [roundId], references: [id], onDelete: Cascade)
  player       Player @relation(fields: [playerId], references: [id], onDelete: Cascade)
  targetPlayer Player? @relation("NakiTarget", fields: [targetPlayerId], references: [id])

  @@index([roundId])
  @@index([playerId])
}
```

### Riichi【非推奨】

```prisma
model Riichi {
  id            String   @id @default(uuid())
  roundId       String
  playerId      String
  isDoubleRiichi Boolean @default(false)
  isIppatsu     Boolean @default(false)
  declaredAt    DateTime
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  round  Round  @relation(fields: [roundId], references: [id], onDelete: Cascade)
  player Player @relation(fields: [playerId], references: [id], onDelete: Cascade)

  @@index([roundId])
  @@index([playerId])
}
```

## 型定義（TypeScript）

### Player

```typescript
export interface Player {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### Session

```typescript
export interface Session {
  id: string;
  date: Date; // 日付のみ（時刻なし）
  name?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### SessionPlayer

```typescript
export interface SessionPlayer {
  id: string;
  sessionId: string;
  playerId: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### Hanchan

```typescript
export enum HanchanStatus {
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
}

export interface Hanchan {
  id: string;
  name?: string;
  startedAt: Date;
  endedAt?: Date;
  status: HanchanStatus;
  sessionId?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### HanchanPlayer

```typescript
export interface HanchanPlayer {
  id: string;
  hanchanId: string;
  playerId: string;
  seatPosition: number; // 0-3
  initialScore: number;
  finalScore?: number; // ウマオカ考慮前の値（currentScore）
  finalScoreWithUmaOka?: number; // ウマオカ考慮後の値
  createdAt: Date;
  updatedAt: Date;
}
```

### Round

```typescript
export enum Wind {
  EAST = 'EAST',
  SOUTH = 'SOUTH',
  WEST = 'WEST',
  NORTH = 'NORTH',
}

export enum RoundResultType {
  TSUMO = 'TSUMO',
  RON = 'RON',
  DRAW = 'DRAW',
  NAGASHI_MANGAN = 'NAGASHI_MANGAN',
  SPECIAL_DRAW = 'SPECIAL_DRAW',
}

export enum SpecialDrawType {
  FOUR_KAN = 'FOUR_KAN',
  FOUR_WIND = 'FOUR_WIND',
  NINE_TERMINALS = 'NINE_TERMINALS',
}

export interface Round {
  id: string;
  hanchanId: string;
  roundNumber: number; // 1-16
  wind: Wind;
  dealerPlayerId: string;
  honba: number;
  riichiSticks: number;
  isRenchan: boolean;
  resultType?: RoundResultType;
  specialDrawType?: SpecialDrawType;
  startedAt?: Date;
  endedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

### Score

```typescript
export interface Score {
  id: string;
  roundId: string;
  playerId: string;
  scoreChange: number;
  isDealer: boolean;
  isWinner: boolean;
  isRonTarget?: boolean;
  han?: number;
  fu?: number;
  yaku?: string[];
  createdAt: Date;
  updatedAt: Date;
}
```

### Naki

```typescript
export enum NakiType {
  PON = 'PON',
  CHI = 'CHI',
  DAIMINKAN = 'DAIMINKAN',
  ANKAN = 'ANKAN',
}

export interface Naki {
  id: string;
  roundId: string;
  playerId: string;
  type: NakiType;
  targetPlayerId?: string;
  tiles: string[];
  createdAt: Date;
  updatedAt: Date;
}
```

### Riichi

```typescript
export interface Riichi {
  id: string;
  roundId: string;
  playerId: string;
  isDoubleRiichi: boolean;
  isIppatsu: boolean;
  declaredAt: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

## 設計の考慮事項

### 1. 点数管理

- 開始点数は25000点（標準ルール）
- 点数変動は`Score`エンティティで管理
- 半荘終了時の最終点数は`HanchanPlayer.finalScore`で管理

### 2. 親の管理

- 親は`Round.dealerPlayerId`で指定
- 半荘開始時の親は`HanchanPlayer.seatPosition`が0の参加者
- 親が上がった場合、次の局も同じ人が親（連荘）
- 親が上がらなかった場合、次の局は次の席順の人が親

### 3. 本場の管理

- 本場は`Round.honba`で管理
- 親が上がった場合、次の局の本場が1増加
- 親が上がらなかった場合、次の局の本場は0にリセット

### 4. 積み棒の管理

- 積み棒は`Round.riichiSticks`で管理
- リーチ宣言時に1000点供託（積み棒に追加）
- 流局時に積み棒が残る場合、次の局に持ち越し

### 5. 打点計算

- 打点計算は`Score`エンティティで管理
- 親子の判定は`Score.isDealer`で管理
- 本場は`Round.honba`を参照
- 積み棒は`Round.riichiSticks`を参照

### 6. 流局の処理

- 流局は`RoundResultType.DRAW`で管理
- 流し満貫は`RoundResultType.NAGASHI_MANGAN`で管理
- 特殊流局は`RoundResultType.SPECIAL_DRAW`と`specialDrawType`で管理

## マイグレーション

Prismaマイグレーションを使用してデータベーススキーマを適用します。

```bash
npx prisma migrate dev --name init_mahjong_data_model
```

## 今後の拡張

- 統計情報の計算用ビュー
- 履歴表示用のインデックス最適化
- リアルタイム更新のためのイベントログ（オプション）

