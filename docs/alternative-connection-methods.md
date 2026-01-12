# Cloud SQL接続の代替方法

## 現在の問題

Cloud SQL Proxy設定が`null`のまま反映されない問題が続いています。

## 代替方法の比較

### 方法1: Cloud SQL Proxy（推奨・現在試行中）

**メリット:**
- セキュアな接続
- VPCコネクタ不要
- 接続管理が自動
- GCPの推奨方法

**デメリット:**
- 設定が反映されない問題が発生している

**現在の状況:**
- 設定が`null`のまま
- エラーログに`10.103.0.3:3307`への接続を試みている

### 方法2: VPCコネクタを使用

**メリット:**
- プライベートIPで直接接続
- 設定が確実に反映される

**デメリット:**
- VPCコネクタの作成が必要（追加リソース）
- 設定が複雑
- コストが発生する可能性
- 以前の議論で「複雑」と判断

**実装内容:**
1. VPCコネクタを作成
2. Cloud RunサービスにVPCコネクタを設定
3. DATABASE_URLをプライベートIP形式に変更（`postgresql://user:password@10.103.0.3:5432/majong_db`）

### 方法3: Cloud SQLのパブリックIPを有効化

**メリット:**
- 設定が簡単
- VPCコネクタ不要
- Cloud SQL Proxy不要

**デメリット:**
- セキュリティ上の懸念（パブリックIPが有効）
- ファイアウォールルールでアクセス制御が必要
- GCPのベストプラクティスに反する

**実装内容:**
1. Cloud SQLインスタンスのパブリックIPを有効化
2. ファイアウォールルールでCloud RunのIP範囲からのアクセスのみ許可
3. DATABASE_URLをパブリックIP形式に変更

### 方法4: Cloud SQL Proxy設定を再試行（推奨）

**理由:**
- Cloud SQL Proxyは最もセキュアで推奨される方法
- 設定が反映されない問題は、コマンドの実行方法やタイミングの問題の可能性が高い

**再試行方法:**
1. GUIで確実に設定を追加
2. 最新のデプロイワークフローで再デプロイ
3. サービスを完全に再作成

## 推奨される対応

### 短期的な解決（即座に動作させる）

**VPCコネクタを使用する方法:**
- 確実に動作する
- 設定が複雑だが、一度設定すれば安定

### 長期的な解決（ベストプラクティス）

**Cloud SQL Proxyを使用する方法:**
- セキュアで推奨される方法
- 設定が反映されない問題を解決する必要がある

## 各方法の実装手順

### 方法2: VPCコネクタを使用する場合

#### ステップ1: VPCコネクタを作成

```powershell
# VPCコネクタを作成
gcloud compute networks vpc-access connectors create staging-connector `
  --region=us-west1 `
  --network=default `
  --range=10.8.0.0/28 `
  --project=majong-app-staging
```

#### ステップ2: Cloud RunサービスにVPCコネクタを設定

```powershell
# VPCコネクタ名を取得
$VPC_CONNECTOR = "staging-connector"

# Cloud Runサービスを更新
gcloud run services update majong-app-backend-staging `
  --region us-west1 `
  --project=majong-app-staging `
  --vpc-connector $VPC_CONNECTOR
```

#### ステップ3: DATABASE_URLを更新

```powershell
# プライベートIPを取得
$PRIVATE_IP = gcloud sql instances describe majong-app-db-staging --project=majong-app-staging --format='value(ipAddresses[0].ipAddress)'

# DATABASE_URLを更新
gcloud run services update majong-app-backend-staging `
  --region us-west1 `
  --project=majong-app-staging `
  --update-env-vars "DATABASE_URL=postgresql://majong_user:パスワード@$PRIVATE_IP:5432/majong_db"
```

### 方法3: パブリックIPを有効化する場合

#### ステップ1: Cloud SQLインスタンスのパブリックIPを有効化

```powershell
# パブリックIPを有効化
gcloud sql instances patch majong-app-db-staging `
  --project=majong-app-staging `
  --assign-ip
```

#### ステップ2: ファイアウォールルールを設定

```powershell
# Cloud RunのIP範囲からのアクセスのみ許可（推奨）
# または、特定のIPアドレスからのアクセスのみ許可
```

#### ステップ3: DATABASE_URLを更新

```powershell
# パブリックIPを取得
$PUBLIC_IP = gcloud sql instances describe majong-app-db-staging --project=majong-app-staging --format='value(ipAddresses[?type==EXTERNAL].ipAddress)'

# DATABASE_URLを更新
gcloud run services update majong-app-backend-staging `
  --region us-west1 `
  --project=majong-app-staging `
  --update-env-vars "DATABASE_URL=postgresql://majong_user:パスワード@$PUBLIC_IP:5432/majong_db"
```

## 推奨事項

1. **まず、Cloud SQL Proxy設定を再試行することを推奨**
   - GUIで確実に設定を追加
   - 最新のデプロイワークフローで再デプロイ

2. **それでも解決しない場合、VPCコネクタを使用**
   - 確実に動作する
   - セキュリティも確保できる

3. **パブリックIPは最後の手段**
   - セキュリティ上の懸念がある
   - ファイアウォールルールで適切に制御する必要がある


