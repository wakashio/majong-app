# 初回デプロイ手順書

## 概要

このドキュメントは、GCPインフラへの初回デプロイを実施するための詳細な手順書です。ステージング環境と本番環境で手順を分けて記載しています。

**操作方法:**
- **GUI（Google Cloud Console）**: ブラウザから操作する方法（推奨）
- **CLI（コマンドライン）**: ターミナルから操作する方法

各手順で、GUIとCLIの両方の操作方法を記載しています。初心者の方はGUIでの操作を推奨します。

## 前提条件

### 必要なツールのインストール

#### gcloud CLIのインストール

**Windowsの場合:**

1. [Google Cloud SDK インストーラー](https://cloud.google.com/sdk/docs/install)からインストーラーをダウンロード
2. インストーラーを実行してインストール
3. または、PowerShellで以下のコマンドを実行:

```powershell
# Chocolateyを使用する場合
choco install gcloudsdk

# または、手動でインストールスクリプトを実行
(New-Object Net.WebClient).DownloadFile("https://dl.google.com/dl/cloudsdk/channels/rapid/GoogleCloudSDKInstaller.exe", "$env:Temp\GoogleCloudSDKInstaller.exe")
& $env:Temp\GoogleCloudSDKInstaller.exe
```

**macOS/Linuxの場合:**

```bash
# macOS (Homebrew)
brew install --cask google-cloud-sdk

# Linux
curl https://sdk.cloud.google.com | bash
exec -l $SHELL
```

**インストール確認:**

```bash
gcloud --version
```

**初期設定:**

**Windows (PowerShell) の場合:**

PowerShellで`gcloud`コマンドを実行する際、実行ポリシーのエラーが発生する場合があります。以下のコマンドで実行ポリシーを変更してください:

```powershell
# 現在の実行ポリシーを確認
Get-ExecutionPolicy

# 実行ポリシーを変更（管理者権限のPowerShellで実行）
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# または、より制限の緩い設定（開発環境のみ推奨）
Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process
```

**初期化コマンド:**

```bash
# gcloud CLIの初期化
gcloud init

# または、認証のみ行う場合
gcloud auth login
```

**注意**: Git Bashを使用する場合は、PowerShellの実行ポリシーの影響を受けません。

#### Terraformのインストール

**Windowsの場合:**

**方法1: 公式インストーラーを使用（推奨）**

1. [Terraform公式サイト](https://www.terraform.io/downloads)にアクセス
2. Windows 64-bit用のバイナリをダウンロード
3. ダウンロードしたzipファイルを解凍
4. `terraform.exe`を適切なディレクトリ（例: `C:\Program Files\Terraform`）に配置
5. システムのPATH環境変数にTerraformのディレクトリを追加

**方法2: Chocolateyを使用（PowerShellで実行）**

```powershell
# Chocolateyがインストールされている場合
choco install terraform
```

**方法3: Scoopを使用（PowerShellで実行）**

```powershell
# Scoopがインストールされている場合
scoop install terraform
```

**macOS/Linuxの場合:**

```bash
# macOS (Homebrew)
brew install terraform

# Linux
# 公式サイトからバイナリをダウンロードしてPATHに追加
```

**インストール確認:**

```bash
terraform version
```

#### その他のツールのインストール確認

```bash
# Dockerのインストール確認
docker --version

# Gitのインストール確認
git --version
```

### 必要な情報

以下の情報を事前に準備してください:

- GCPアカウント（新規ユーザー向け$300の無料クレジットが利用可能）
- 課金アカウントID（GCP Consoleから確認可能）
- GitHubリポジトリへのアクセス権限
- データベースパスワード（強力なパスワードを生成）

---

## ステージング環境の初回デプロイ

**重要**: このドキュメントでは、以下の2つの方法で操作を実行できます:

1. **GUI（Google Cloud Console）**: ブラウザから操作する方法（推奨）
   - 初心者にも分かりやすい
   - 視覚的に操作を確認できる
   - 各手順でGUIでの操作方法を記載しています

2. **CLI（コマンドライン）**: ターミナルから操作する方法
   - 自動化やスクリプト化に適している
   - 高速に操作できる
   - Bash/Git BashとPowerShellの両方のコマンドを提供しています

**CLIを使用する場合の注意事項:**
- **Bash/Git Bash**: 変数は `${VAR}` 形式、行継続は `\` を使用
- **PowerShell**: 変数は `$VAR` 形式、行継続は `` ` `` を使用

### ステップ1: GCPプロジェクトのセットアップ

#### 1.1 GCPプロジェクトの作成

プロジェクトの作成方法は2つあります:
- **GUI（Google Cloud Console）**: ブラウザから操作する方法（推奨）
- **CLI（コマンドライン）**: ターミナルから操作する方法

##### 方法1: GUI（Google Cloud Console）でプロジェクトを作成

1. **Google Cloud Consoleにアクセス**
   - ブラウザで [Google Cloud Console](https://console.cloud.google.com/) にアクセス
   - Googleアカウントでログイン

2. **プロジェクト選択メニューを開く**
   - 画面上部のプロジェクト選択ドロップダウンをクリック
   - 「新しいプロジェクト」をクリック

3. **プロジェクト情報を入力**
   - **プロジェクト名**: `Majong App Staging`（任意の名前）
   - **プロジェクトID**: 自動生成されるか、手動で入力
     - 例: `majong-app-staging`
     - **重要**: プロジェクトIDは一意である必要があります。既に使用されている場合は別のIDを入力してください
   - **組織**: 組織を使用する場合は選択（オプション）
   - **場所**: 組織の場所を選択（オプション）

4. **プロジェクトを作成**
   - 「作成」ボタンをクリック
   - プロジェクトの作成には数秒かかります

5. **プロジェクトを選択**
   - 作成後、画面上部のプロジェクト選択ドロップダウンから作成したプロジェクトを選択
   - または、プロジェクト一覧から選択

6. **プロジェクトIDを確認**
   - プロジェクト選択ドロップダウンに表示されているプロジェクトIDを確認
   - このプロジェクトIDをメモしておきます（後で使用します）

**スクリーンショットの参考箇所:**
- プロジェクト選択ドロップダウン: 画面上部中央
- 新しいプロジェクトボタン: プロジェクト選択メニュー内
- プロジェクト情報入力フォーム: モーダルウィンドウ

##### 方法2: CLI（コマンドライン）でプロジェクトを作成

**既にプロジェクトが作成されている場合:**

既にプロジェクトID（例: `majong-app-staging`）が作成されている場合は、以下のコマンドで変数に設定してください:

**Bash/Git Bash:**
```bash
PROJECT_ID="majong-app-staging"
gcloud config set project ${PROJECT_ID}
```

**PowerShell:**
```powershell
$PROJECT_ID = "majong-app-staging"
gcloud config set project $PROJECT_ID
```

**新規にプロジェクトを作成する場合:**

**Bash/Git Bashの場合:**

```bash
# プロジェクトIDを決定（一意である必要があります）
PROJECT_ID="majong-app-staging-$(date +%s)"

# GCPプロジェクトを作成
gcloud projects create ${PROJECT_ID} --name="Majong App Staging"

# プロジェクトを設定
gcloud config set project ${PROJECT_ID}

# プロジェクトIDを確認（後で使用します）
echo "プロジェクトID: ${PROJECT_ID}"
gcloud config get-value project
```

**PowerShellの場合:**

```powershell
# プロジェクトIDを決定（一意である必要があります）
$PROJECT_ID = "majong-app-staging-$(Get-Date -Format 'yyyyMMddHHmmss')"

# GCPプロジェクトを作成
gcloud projects create $PROJECT_ID --name="Majong App Staging"

# プロジェクトを設定
gcloud config set project $PROJECT_ID

# プロジェクトIDを確認（後で使用します）
Write-Host "プロジェクトID: $PROJECT_ID"
gcloud config get-value project
```

**注意**: 
- プロジェクトIDは一意である必要があります。上記のコマンドではタイムスタンプを使用していますが、任意の一意な文字列に変更できます。
- PowerShellとBashでは変数の構文が異なります（`$VAR` vs `${VAR}`）。
- 既に作成されたプロジェクトID（例: `majong-app-staging`）を使用する場合は、変数に設定して使用してください。

#### 1.2 課金アカウントのリンク

課金アカウントのリンク方法は2つあります:
- **GUI（Google Cloud Console）**: ブラウザから操作する方法（推奨）
- **CLI（コマンドライン）**: ターミナルから操作する方法

##### 方法1: GUI（Google Cloud Console）で課金アカウントをリンク

1. **課金ページにアクセス**
   - Google Cloud Consoleで、作成したプロジェクトを選択
   - 左側のメニューから「課金」を選択
   - または、[課金ページ](https://console.cloud.google.com/billing) に直接アクセス

2. **課金アカウントをリンク**
   - 「課金アカウントをリンク」ボタンをクリック
   - 既存の課金アカウントを選択
   - または、「新しい課金アカウントを作成」をクリックして新規作成
     - **注意**: 新規作成する場合は、クレジットカード情報の入力が必要です

3. **リンクを確認**
   - 課金ページで、プロジェクトに課金アカウントがリンクされていることを確認
   - 課金アカウント名とステータスが表示されます

**スクリーンショットの参考箇所:**
- 左側メニューの「課金」: ナビゲーションメニュー内
- 「課金アカウントをリンク」ボタン: 課金ページの上部
- 課金アカウント選択画面: モーダルウィンドウ

##### 方法2: CLI（コマンドライン）で課金アカウントをリンク

**Bash/Git Bashの場合:**

```bash
# 課金アカウントを確認
gcloud billing accounts list

# 課金アカウントをプロジェクトにリンク（BILLING_ACCOUNT_IDを実際のIDに置き換え）
gcloud billing projects link ${PROJECT_ID} --billing-account=BILLING_ACCOUNT_ID

# リンクを確認
gcloud billing projects describe ${PROJECT_ID}
```

**PowerShellの場合:**

```powershell
# 課金アカウントを確認
gcloud billing accounts list

# 課金アカウントをプロジェクトにリンク（BILLING_ACCOUNT_IDを実際のIDに置き換え）
gcloud billing projects link $PROJECT_ID --billing-account=BILLING_ACCOUNT_ID

# リンクを確認
gcloud billing projects describe $PROJECT_ID
```

**重要**: 課金アカウントのリンクは必須です。リンクしないとリソースを作成できません。

#### 1.3 必要なAPIの有効化

APIの有効化方法は2つあります:
- **GUI（Google Cloud Console）**: ブラウザから操作する方法（推奨）
- **CLI（コマンドライン）**: ターミナルから操作する方法

##### 方法1: GUI（Google Cloud Console）でAPIを有効化

1. **APIとサービスページにアクセス**
   - Google Cloud Consoleで、作成したプロジェクトを選択
   - 左側のメニューから「APIとサービス」>「ライブラリ」を選択
   - または、[APIライブラリ](https://console.cloud.google.com/apis/library) に直接アクセス

2. **必要なAPIを有効化**
   以下のAPIを1つずつ検索して有効化します:

   - **Cloud Build API**
     - 検索バーで「Cloud Build API」を検索
     - 「Cloud Build API」を選択
     - 「有効にする」ボタンをクリック

   - **Cloud Run API**
     - 検索バーで「Cloud Run API」を検索
     - 「Cloud Run Admin API」を選択
     - 「有効にする」ボタンをクリック

   - **Cloud SQL Admin API**
     - 検索バーで「Cloud SQL Admin API」を検索
     - 「Cloud SQL Admin API」を選択
     - 「有効にする」ボタンをクリック

   - **Compute Engine API**
     - 検索バーで「Compute Engine API」を検索
     - 「Compute Engine API」を選択
     - 「有効にする」ボタンをクリック

   - **Secret Manager API**
     - 検索バーで「Secret Manager API」を検索
     - 「Secret Manager API」を選択
     - 「有効にする」ボタンをクリック

   - **Cloud Resource Manager API**
     - 検索バーで「Cloud Resource Manager API」を検索
     - 「Cloud Resource Manager API」を選択
     - 「有効にする」ボタンをクリック

   - **Service Networking API**
     - 検索バーで「Service Networking API」を検索
     - 「Service Networking API」を選択
     - 「有効にする」ボタンをクリック

3. **有効化されたAPIを確認**
   - 左側のメニューから「APIとサービス」>「有効なAPI」を選択
   - 有効化したAPIが一覧に表示されていることを確認

**スクリーンショットの参考箇所:**
- 左側メニューの「APIとサービス」>「ライブラリ」: ナビゲーションメニュー内
- 検索バー: ページ上部
- 「有効にする」ボタン: API詳細ページ内

##### 方法2: CLI（コマンドライン）でAPIを有効化

**Bash/Git Bashの場合:**

```bash
# Cloud Build API
gcloud services enable cloudbuild.googleapis.com

# Cloud Run API
gcloud services enable run.googleapis.com

# Cloud SQL Admin API
gcloud services enable sqladmin.googleapis.com

# Compute Engine API
gcloud services enable compute.googleapis.com

# Secret Manager API
gcloud services enable secretmanager.googleapis.com

# Cloud Resource Manager API
gcloud services enable cloudresourcemanager.googleapis.com

# Service Networking API（VPC接続用）
gcloud services enable servicenetworking.googleapis.com

# 有効化されたAPIを確認
gcloud services list --enabled
```

**PowerShellの場合:**

```powershell
# Cloud Build API
gcloud services enable cloudbuild.googleapis.com

# Cloud Run API
gcloud services enable run.googleapis.com

# Cloud SQL Admin API
gcloud services enable sqladmin.googleapis.com

# Compute Engine API
gcloud services enable compute.googleapis.com

# Secret Manager API
gcloud services enable secretmanager.googleapis.com

# Cloud Resource Manager API
gcloud services enable cloudresourcemanager.googleapis.com

# Service Networking API（VPC接続用）
gcloud services enable servicenetworking.googleapis.com

# 有効化されたAPIを確認
gcloud services list --enabled
```

**所要時間**: 各APIの有効化には数秒から数分かかることがあります。

---

### ステップ2: サービスアカウントの作成と権限設定

サービスアカウントの作成と権限設定方法は2つあります:
- **GUI（Google Cloud Console）**: ブラウザから操作する方法（推奨）
- **CLI（コマンドライン）**: ターミナルから操作する方法

#### 2.1 GitHub Actions用サービスアカウントの作成

##### 方法1: GUI（Google Cloud Console）でサービスアカウントを作成

1. **サービスアカウントページにアクセス**
   - Google Cloud Consoleで、作成したプロジェクトを選択
   - 左側のメニューから「IAM & Admin」>「サービスアカウント」を選択
   - または、[サービスアカウントページ](https://console.cloud.google.com/iam-admin/serviceaccounts) に直接アクセス

2. **サービスアカウントを作成**
   - ページ上部の「サービスアカウントを作成」ボタンをクリック
   - 以下の情報を入力:
     - **サービスアカウント名**: `github-actions`
     - **サービスアカウントID**: 自動生成されます（通常はサービスアカウント名と同じ）
     - **説明**: `GitHub Actions Service Account`（任意）
   - 「作成して続行」ボタンをクリック

3. **サービスアカウントのメールアドレスを確認**
   - 作成後、サービスアカウント一覧に表示されます
   - サービスアカウントのメールアドレスをメモしておきます
     - 形式: `github-actions@majong-app-staging.iam.gserviceaccount.com`
   - このメールアドレスは後で権限設定で使用します

**スクリーンショットの参考箇所:**
- 左側メニューの「IAM & Admin」>「サービスアカウント」: ナビゲーションメニュー内
- 「サービスアカウントを作成」ボタン: ページ上部
- サービスアカウント作成フォーム: モーダルウィンドウ

##### 方法2: CLI（コマンドライン）でサービスアカウントを作成

**Bash/Git Bashの場合:**

```bash
# サービスアカウントを作成
gcloud iam service-accounts create github-actions \
  --display-name="GitHub Actions Service Account" \
  --project=${PROJECT_ID}

# サービスアカウントのメールアドレスを確認
SA_EMAIL="github-actions@${PROJECT_ID}.iam.gserviceaccount.com"
echo "サービスアカウント: ${SA_EMAIL}"
```

**PowerShellの場合:**

```powershell
# サービスアカウントを作成
gcloud iam service-accounts create github-actions `
  --display-name="GitHub Actions Service Account" `
  --project=$PROJECT_ID

# サービスアカウントのメールアドレスを確認
$SA_EMAIL = "github-actions@$PROJECT_ID.iam.gserviceaccount.com"
Write-Host "サービスアカウント: $SA_EMAIL"
```

**注意**: PowerShellでは、行継続にバッククォート（`` ` ``）を使用します。

#### 2.2 必要な権限の付与

##### 方法1: GUI（Google Cloud Console）で権限を付与

1. **サービスアカウントの詳細ページを開く**
   - サービスアカウント一覧から、作成した`github-actions`サービスアカウントをクリック
   - または、サービスアカウント名の右側の「⋮」（3つの点）メニューから「権限を管理」を選択

2. **権限を追加**
   - サービスアカウントの詳細ページで、「権限」タブを選択
   - 「ロールを付与」ボタンをクリック
   - 以下のロールを1つずつ追加します:

   **必要なロール一覧:**
   - `Cloud Run 管理者` (roles/run.admin)
   - `Cloud SQL 管理者` (roles/cloudsql.admin)
   - `Storage 管理者` (roles/storage.admin)
   - `サービス アカウント ユーザー` (roles/iam.serviceAccountUser)
   - `Compute Engine 管理者` (roles/compute.admin)
   - `Service Networking 管理者` (roles/servicenetworking.networksAdmin)
   - `プロジェクト IAM 管理者` (roles/resourcemanager.projectIamAdmin)

3. **各ロールの追加手順**
   - 「ロールを付与」ボタンをクリック
   - 「ロールを選択」ドロップダウンから上記のロールを1つ選択
   - 「保存」ボタンをクリック
   - これを7つのロールすべてに対して繰り返します

4. **権限の確認**
   - サービスアカウントの詳細ページの「権限」タブで、追加したロールが一覧に表示されていることを確認

**スクリーンショットの参考箇所:**
- サービスアカウント一覧: IAM & Admin > サービスアカウントページ
- 「権限を管理」メニュー: サービスアカウント名の右側
- 「権限」タブ: サービスアカウント詳細ページ
- 「ロールを付与」ボタン: 権限タブ内
- ロール選択ドロップダウン: 権限付与モーダルウィンドウ

**注意**: ロール名は日本語と英語で表示が異なる場合があります。ロールID（例: `roles/run.admin`）で検索すると見つけやすくなります。

##### 方法2: CLI（コマンドライン）で権限を付与

**Bash/Git Bashの場合:**

```bash
# Cloud Run管理権限
gcloud projects add-iam-policy-binding ${PROJECT_ID} \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/run.admin"

# Cloud SQL管理権限
gcloud projects add-iam-policy-binding ${PROJECT_ID} \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/cloudsql.admin"

# Storage管理権限（Dockerイメージのプッシュ用）
gcloud projects add-iam-policy-binding ${PROJECT_ID} \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/storage.admin"

# Service Account User権限（Cloud Runサービスアカウントの使用）
gcloud projects add-iam-policy-binding ${PROJECT_ID} \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/iam.serviceAccountUser"

# Compute Engine管理権限（VPC作成用）
gcloud projects add-iam-policy-binding ${PROJECT_ID} \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/compute.admin"

# Service Networking権限（VPC接続用）
gcloud projects add-iam-policy-binding ${PROJECT_ID} \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/servicenetworking.networksAdmin"

# Terraform用の追加権限
gcloud projects add-iam-policy-binding ${PROJECT_ID} \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/resourcemanager.projectIamAdmin"
```

**PowerShellの場合:**

```powershell
# Cloud Run管理権限
gcloud projects add-iam-policy-binding $PROJECT_ID `
  --member="serviceAccount:$SA_EMAIL" `
  --role="roles/run.admin"

# Cloud SQL管理権限
gcloud projects add-iam-policy-binding $PROJECT_ID `
  --member="serviceAccount:$SA_EMAIL" `
  --role="roles/cloudsql.admin"

# Storage管理権限（Dockerイメージのプッシュ用）
gcloud projects add-iam-policy-binding $PROJECT_ID `
  --member="serviceAccount:$SA_EMAIL" `
  --role="roles/storage.admin"

# Service Account User権限（Cloud Runサービスアカウントの使用）
gcloud projects add-iam-policy-binding $PROJECT_ID `
  --member="serviceAccount:$SA_EMAIL" `
  --role="roles/iam.serviceAccountUser"

# Compute Engine管理権限（VPC作成用）
gcloud projects add-iam-policy-binding $PROJECT_ID `
  --member="serviceAccount:$SA_EMAIL" `
  --role="roles/compute.admin"

# Service Networking権限（VPC接続用）
gcloud projects add-iam-policy-binding $PROJECT_ID `
  --member="serviceAccount:$SA_EMAIL" `
  --role="roles/servicenetworking.networksAdmin"

# Terraform用の追加権限
gcloud projects add-iam-policy-binding $PROJECT_ID `
  --member="serviceAccount:$SA_EMAIL" `
  --role="roles/resourcemanager.projectIamAdmin"
```

#### 2.3 サービスアカウントキーの生成

サービスアカウントキーの生成方法は2つあります:
- **GUI（Google Cloud Console）**: ブラウザから操作する方法（推奨）
- **CLI（コマンドライン）**: ターミナルから操作する方法

##### 方法1: GUI（Google Cloud Console）でサービスアカウントキーを生成

1. **サービスアカウントの詳細ページを開く**
   - サービスアカウント一覧から、作成した`github-actions`サービスアカウントをクリック
   - サービスアカウントの詳細ページが開きます

2. **キーを作成**
   - 「キー」タブを選択
   - 「キーを追加」>「新しいキーを作成」をクリック
   - キーの種類を選択:
     - **JSON**を選択（推奨）
     - 「作成」ボタンをクリック

3. **キーファイルをダウンロード**
   - キーが作成されると、JSONファイルが自動的にダウンロードされます
   - ファイル名は通常、プロジェクトIDとサービスアカウントIDを含む長い名前になります
   - このファイルを`github-actions-key.json`にリネームすることを推奨します

4. **キーの内容を確認**
   - ダウンロードしたJSONファイルを開いて内容を確認
   - このファイルの内容全体をコピーして、後でGitHub Secretsの`GCP_SA_KEY`に設定します

**スクリーンショットの参考箇所:**
- サービスアカウント詳細ページ: サービスアカウント名をクリック
- 「キー」タブ: サービスアカウント詳細ページ内
- 「キーを追加」ボタン: キータブ内
- 「新しいキーを作成」メニュー: キーを追加ボタンのドロップダウン
- キー種類選択: モーダルウィンドウ

##### 方法2: CLI（コマンドライン）でサービスアカウントキーを生成

**Bash/Git Bashの場合:**

```bash
# サービスアカウントキーを生成
gcloud iam service-accounts keys create github-actions-key.json \
  --iam-account=${SA_EMAIL}

# キーファイルの内容を確認（後でGitHub Secretsに設定します）
echo "サービスアカウントキーが生成されました: github-actions-key.json"
echo "このファイルの内容をGitHub SecretsのGCP_SA_KEYに設定してください"
```

**PowerShellの場合:**

```powershell
# サービスアカウントキーを生成
gcloud iam service-accounts keys create github-actions-key.json `
  --iam-account=$SA_EMAIL

# キーファイルの内容を確認（後でGitHub Secretsに設定します）
Write-Host "サービスアカウントキーが生成されました: github-actions-key.json"
Write-Host "このファイルの内容をGitHub SecretsのGCP_SA_KEYに設定してください"
```

**重要**: 
- `github-actions-key.json`ファイルは機密情報です。Gitにコミットしないでください。
- GitHub Secretsに設定した後は、ローカルファイルを削除することを推奨します。
- キーは一度しか表示されません。ダウンロードしたファイルは安全に保管してください。

---

### ステップ3: Secret Managerの設定（オプション）

データベースパスワードをSecret Managerに保存する場合:

```bash
# データベースパスワードを生成（強力なパスワード）
DB_PASSWORD=$(openssl rand -base64 32)
echo "生成されたパスワード: ${DB_PASSWORD}"

# Secret Managerに保存
echo -n "${DB_PASSWORD}" | gcloud secrets create db-password \
  --data-file=- \
  --project=${PROJECT_ID}

# 確認
gcloud secrets versions access latest --secret=db-password --project=${PROJECT_ID}
```

**注意**: Secret Managerを使用しない場合は、後でTerraformの変数として直接設定します。

---

### ステップ4: Terraformの設定

#### 4.1 Terraformの認証設定

```bash
# アプリケーションのデフォルト認証情報を設定
gcloud auth application-default login

# 認証を確認
gcloud auth list
```

#### 4.2 Terraform変数ファイルの作成

```bash
# ステージング環境のディレクトリに移動
cd infrastructure/terraform/environments/staging

# terraform.tfvars.exampleをコピー
cp terraform.tfvars.example terraform.tfvars

# terraform.tfvarsを編集（以下の内容を設定）
cat > terraform.tfvars <<EOF
project_id = "${PROJECT_ID}"
region     = "us-west1"

db_user     = "majong_user"
db_password = "${DB_PASSWORD}"

frontend_image = "gcr.io/${PROJECT_ID}/majong-app-frontend:latest"
backend_image  = "gcr.io/${PROJECT_ID}/majong-app-backend:latest"
EOF

# ファイルの内容を確認（パスワードが表示されるので注意）
cat terraform.tfvars
```

**重要**: `terraform.tfvars`ファイルは機密情報を含むため、Gitにコミットしないでください（`.gitignore`に含まれています）。

#### 4.3 Terraformの初期化

```bash
# 現在のディレクトリを確認
pwd
# 出力: infrastructure/terraform/environments/staging

# Terraformを初期化
terraform init

# 初期化が成功したことを確認
terraform version
```

**所要時間**: 初期化には1-2分かかることがあります。

#### 4.4 Terraformの実行計画の確認

```bash
# 実行計画を確認（実際のリソースは作成されません）
terraform plan

# 出力を確認し、作成されるリソースを確認
# - VPCネットワーク
# - Cloud SQLインスタンス
# - Cloud Runサービス（フロントエンド、バックエンド）
```

**注意**: 初回実行時は、多くのリソースが作成されるため、出力が長くなります。エラーがないことを確認してください。

---

### ステップ5: Terraformでインフラを作成

#### 5.1 インフラの作成

```bash
# インフラを作成（確認プロンプトが表示されます）
terraform apply

# 確認プロンプトで "yes" と入力
# または、自動承認する場合:
terraform apply -auto-approve
```

**所要時間**: インフラの作成には10-20分かかることがあります。特にCloud SQLインスタンスの作成には時間がかかります。

#### 5.2 作成されたリソースの確認

```bash
# Terraformの出力を確認
terraform output

# Cloud SQLインスタンスの確認
gcloud sql instances list --project=${PROJECT_ID}

# Cloud Runサービスの確認
gcloud run services list --region=us-west1 --project=${PROJECT_ID}

# VPCネットワークの確認
gcloud compute networks list --project=${PROJECT_ID}
```

#### 5.3 データベース接続情報の取得

```bash
# Cloud SQLインスタンスの接続名を取得
DB_CONNECTION_NAME=$(terraform output -raw database_connection_name)
echo "データベース接続名: ${DB_CONNECTION_NAME}"

# プライベートIPアドレスを取得
DB_PRIVATE_IP=$(terraform output -raw database_private_ip)
echo "データベースプライベートIP: ${DB_PRIVATE_IP}"

# DATABASE_URLを構築
DATABASE_URL="postgresql://majong_user:${DB_PASSWORD}@${DB_PRIVATE_IP}:5432/majong_db"
echo "DATABASE_URL: ${DATABASE_URL}"
```

**重要**: このDATABASE_URLは後で使用します。安全な場所に保存してください。

---

### ステップ6: データベースの初期化

#### 6.1 Prismaマイグレーションの実行

```bash
# プロジェクトルートに戻る
cd ../../../../

# データベース接続文字列を環境変数に設定
export DATABASE_URL="${DATABASE_URL}"

# Prismaクライアントを生成
cd backend
npx prisma generate

# データベースマイグレーションを実行
npx prisma migrate deploy

# マイグレーションの確認
npx prisma migrate status
```

**注意**: Cloud SQLに接続するには、Cloud SQL Proxyを使用するか、VPCコネクタ経由で接続する必要があります。ローカルから接続する場合は、Cloud SQL Proxyを使用してください。

#### 6.2 Cloud SQL Proxyの使用（ローカルから接続する場合）

```bash
# Cloud SQL Proxyをダウンロード（初回のみ）
# macOSの場合
curl -o cloud-sql-proxy https://storage.googleapis.com/cloud-sql-connectors/cloud-sql-proxy/v2.8.0/cloud-sql-proxy.darwin.arm64
chmod +x cloud-sql-proxy

# Windowsの場合
# https://storage.googleapis.com/cloud-sql-connectors/cloud-sql-proxy/v2.8.0/cloud-sql-proxy.windows.amd64.exe
# をダウンロードして cloud-sql-proxy.exe として保存

# Cloud SQL Proxyを起動（別のターミナルで実行）
./cloud-sql-proxy ${DB_CONNECTION_NAME}

# 別のターミナルで、ローカルのDATABASE_URLを使用
export DATABASE_URL="postgresql://majong_user:${DB_PASSWORD}@127.0.0.1:5432/majong_db"
cd backend
npx prisma migrate deploy
```

---

### ステップ7: Dockerイメージのビルドとプッシュ

#### 7.1 Docker認証の設定

```bash
# GCR（Google Container Registry）への認証を設定
gcloud auth configure-docker

# 認証を確認
gcloud auth list
```

#### 7.2 フロントエンドイメージのビルドとプッシュ

```bash
# プロジェクトルートに移動
cd ../

# フロントエンドのビルド
cd frontend
docker build -t gcr.io/${PROJECT_ID}/majong-app-frontend:latest .

# イメージのビルドを確認
docker images | grep majong-app-frontend

# GCRにプッシュ
docker push gcr.io/${PROJECT_ID}/majong-app-frontend:latest

# プッシュの確認
gcloud container images list --project=${PROJECT_ID}
```

**所要時間**: ビルドとプッシュには5-10分かかることがあります。

#### 7.3 バックエンドイメージのビルドとプッシュ

```bash
# バックエンドのビルド
cd ../backend
docker build -t gcr.io/${PROJECT_ID}/majong-app-backend:latest .

# イメージのビルドを確認
docker images | grep majong-app-backend

# GCRにプッシュ
docker push gcr.io/${PROJECT_ID}/majong-app-backend:latest

# プッシュの確認
gcloud container images list --project=${PROJECT_ID}
```

---

### ステップ8: Cloud Runサービスの更新

#### 8.1 Terraformでイメージを更新

```bash
# Terraformの変数ファイルを更新
cd infrastructure/terraform/environments/staging

# terraform.tfvarsを編集して、最新のイメージを指定
# （既にlatestタグを使用している場合は、再適用するだけで更新されます）
terraform apply -auto-approve
```

#### 8.2 手動でCloud Runサービスを更新する場合

```bash
# フロントエンドサービスの更新
gcloud run services update majong-app-frontend-staging \
  --image gcr.io/${PROJECT_ID}/majong-app-frontend:latest \
  --region us-west1 \
  --project=${PROJECT_ID}

# バックエンドサービスの更新（DATABASE_URLを設定）
gcloud run services update majong-app-backend-staging \
  --image gcr.io/${PROJECT_ID}/majong-app-backend:latest \
  --region us-west1 \
  --update-env-vars DATABASE_URL="${DATABASE_URL}" \
  --project=${PROJECT_ID}
```

---

### ステップ9: GitHub Secretsの設定

#### 9.1 GitHubリポジトリの設定

1. GitHubリポジトリにアクセス
2. Settings > Secrets and variables > Actions に移動
3. 以下のSecretsを追加:

```
GCP_PROJECT_ID: ${PROJECT_ID}
GCP_SA_KEY: github-actions-key.jsonの内容（JSON全体）
DB_PASSWORD: ${DB_PASSWORD}
```

#### 9.2 サービスアカウントキーの内容を取得

```bash
# サービスアカウントキーの内容を表示（GitHub Secretsにコピー）
cat github-actions-key.json

# または、base64エンコードして表示
cat github-actions-key.json | base64
```

**重要**: 
- `GCP_SA_KEY`には、JSONファイルの内容全体をコピーしてください
- 改行やスペースも含めて正確にコピーしてください
- Secretsを設定した後は、ローカルの`github-actions-key.json`ファイルを削除することを推奨します

---

### ステップ10: 動作確認

#### 10.1 Cloud RunサービスのURLを取得

```bash
# フロントエンドのURLを取得
FRONTEND_URL=$(gcloud run services describe majong-app-frontend-staging \
  --region us-west1 \
  --project=${PROJECT_ID} \
  --format="value(status.url)")

echo "フロントエンドURL: ${FRONTEND_URL}"

# バックエンドのURLを取得
BACKEND_URL=$(gcloud run services describe majong-app-backend-staging \
  --region us-west1 \
  --project=${PROJECT_ID} \
  --format="value(status.url)")

echo "バックエンドURL: ${BACKEND_URL}"
```

#### 10.2 ヘルスチェック

```bash
# バックエンドのヘルスチェック
curl ${BACKEND_URL}/health

# 期待される出力: {"status":"ok","message":"麻雀記録アプリ API"}
```

#### 10.3 ブラウザで確認

1. フロントエンドURLをブラウザで開く
2. アプリケーションが正常に表示されることを確認
3. 基本的な操作（参加者登録など）をテスト

---

## 本番環境の初回デプロイ

本番環境のデプロイは、ステージング環境のデプロイが正常に動作することを確認してから実施してください。

### ステップ1: GCPプロジェクトのセットアップ（本番環境）

本番環境のプロジェクトセットアップは、ステージング環境と同様の手順です。プロジェクト名とプロジェクトIDのみが異なります。

#### 1.1 本番環境用プロジェクトの作成

**GUI（Google Cloud Console）でプロジェクトを作成する場合:**

ステージング環境の「1.1 GCPプロジェクトの作成」の手順を参照し、以下の点を変更してください:
- **プロジェクト名**: `Majong App Production`
- **プロジェクトID**: 例: `majong-app-prod-483102`（一意である必要があります）

**CLI（コマンドライン）でプロジェクトを作成する場合:**

**Bash/Git Bashの場合:**

```bash
# プロジェクトIDを決定（一意である必要があります）
PROJECT_ID_PROD="majong-app-prod-$(date +%s)"

# GCPプロジェクトを作成
gcloud projects create ${PROJECT_ID_PROD} --name="Majong App Production"

# プロジェクトを設定
gcloud config set project ${PROJECT_ID_PROD}

# プロジェクトIDを確認
echo "本番環境プロジェクトID: ${PROJECT_ID_PROD}"
```

**PowerShellの場合:**

```powershell
# プロジェクトIDを決定（一意である必要があります）
$PROJECT_ID_PROD = "majong-app-prod-$(Get-Date -Format 'yyyyMMddHHmmss')"

# GCPプロジェクトを作成
gcloud projects create $PROJECT_ID_PROD --name="Majong App Production"

# プロジェクトを設定
gcloud config set project $PROJECT_ID_PROD

# プロジェクトIDを確認
Write-Host "本番環境プロジェクトID: $PROJECT_ID_PROD"
```

#### 1.2 課金アカウントのリンク

**GUI（Google Cloud Console）で課金アカウントをリンクする場合:**

ステージング環境の「1.2 課金アカウントのリンク」の手順を参照してください。本番環境のプロジェクトを選択して同様の手順を実行します。

**CLI（コマンドライン）で課金アカウントをリンクする場合:**

**Bash/Git Bashの場合:**

```bash
# 課金アカウントをプロジェクトにリンク
gcloud billing projects link ${PROJECT_ID_PROD} --billing-account=BILLING_ACCOUNT_ID

# リンクを確認
gcloud billing projects describe ${PROJECT_ID_PROD}
```

**PowerShellの場合:**

```powershell
# 課金アカウントをプロジェクトにリンク
gcloud billing projects link $PROJECT_ID_PROD --billing-account=BILLING_ACCOUNT_ID

# リンクを確認
gcloud billing projects describe $PROJECT_ID_PROD
```

#### 1.3 必要なAPIの有効化

**GUI（Google Cloud Console）でAPIを有効化する場合:**

ステージング環境の「1.3 必要なAPIの有効化」の手順を参照してください。本番環境のプロジェクトを選択して同様の手順を実行します。

**CLI（コマンドライン）でAPIを有効化する場合:**

**Bash/Git Bashの場合:**

```bash
# ステージング環境と同様に、すべてのAPIを有効化
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable sqladmin.googleapis.com
gcloud services enable compute.googleapis.com
gcloud services enable secretmanager.googleapis.com
gcloud services enable cloudresourcemanager.googleapis.com
gcloud services enable servicenetworking.googleapis.com

# 有効化されたAPIを確認
gcloud services list --enabled
```

**PowerShellの場合:**

```powershell
# ステージング環境と同様に、すべてのAPIを有効化
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable sqladmin.googleapis.com
gcloud services enable compute.googleapis.com
gcloud services enable secretmanager.googleapis.com
gcloud services enable cloudresourcemanager.googleapis.com
gcloud services enable servicenetworking.googleapis.com

# 有効化されたAPIを確認
gcloud services list --enabled
```

---

### ステップ2: サービスアカウントの作成と権限設定（本番環境）

#### 2.1 GitHub Actions用サービスアカウントの作成

```bash
# サービスアカウントを作成
gcloud iam service-accounts create github-actions \
  --display-name="GitHub Actions Service Account" \
  --project=${PROJECT_ID_PROD}

# サービスアカウントのメールアドレスを確認
SA_EMAIL_PROD="github-actions@${PROJECT_ID_PROD}.iam.gserviceaccount.com"
echo "本番環境サービスアカウント: ${SA_EMAIL_PROD}"
```

#### 2.2 必要な権限の付与

```bash
# ステージング環境と同様に、すべての権限を付与
gcloud projects add-iam-policy-binding ${PROJECT_ID_PROD} \
  --member="serviceAccount:${SA_EMAIL_PROD}" \
  --role="roles/run.admin"

gcloud projects add-iam-policy-binding ${PROJECT_ID_PROD} \
  --member="serviceAccount:${SA_EMAIL_PROD}" \
  --role="roles/cloudsql.admin"

gcloud projects add-iam-policy-binding ${PROJECT_ID_PROD} \
  --member="serviceAccount:${SA_EMAIL_PROD}" \
  --role="roles/storage.admin"

gcloud projects add-iam-policy-binding ${PROJECT_ID_PROD} \
  --member="serviceAccount:${SA_EMAIL_PROD}" \
  --role="roles/iam.serviceAccountUser"

gcloud projects add-iam-policy-binding ${PROJECT_ID_PROD} \
  --member="serviceAccount:${SA_EMAIL_PROD}" \
  --role="roles/compute.admin"

gcloud projects add-iam-policy-binding ${PROJECT_ID_PROD} \
  --member="serviceAccount:${SA_EMAIL_PROD}" \
  --role="roles/servicenetworking.networksAdmin"

gcloud projects add-iam-policy-binding ${PROJECT_ID_PROD} \
  --member="serviceAccount:${SA_EMAIL_PROD}" \
  --role="roles/resourcemanager.projectIamAdmin"
```

#### 2.3 サービスアカウントキーの生成

```bash
# サービスアカウントキーを生成（本番環境用）
gcloud iam service-accounts keys create github-actions-key-prod.json \
  --iam-account=${SA_EMAIL_PROD}

echo "本番環境用サービスアカウントキーが生成されました: github-actions-key-prod.json"
```

---

### ステップ3: Secret Managerの設定（本番環境）

```bash
# 本番環境用のデータベースパスワードを生成
DB_PASSWORD_PROD=$(openssl rand -base64 32)
echo "本番環境用パスワード: ${DB_PASSWORD_PROD}"

# Secret Managerに保存
echo -n "${DB_PASSWORD_PROD}" | gcloud secrets create db-password \
  --data-file=- \
  --project=${PROJECT_ID_PROD}
```

---

### ステップ4: Terraformの設定（本番環境）

#### 4.1 Terraform変数ファイルの作成

```bash
# 本番環境のディレクトリに移動
cd infrastructure/terraform/environments/production

# terraform.tfvars.exampleをコピー
cp terraform.tfvars.example terraform.tfvars

# terraform.tfvarsを編集
cat > terraform.tfvars <<EOF
project_id = "${PROJECT_ID_PROD}"
region     = "us-west1"

db_user     = "majong_user"
db_password = "${DB_PASSWORD_PROD}"

frontend_image = "gcr.io/${PROJECT_ID_PROD}/majong-app-frontend:latest"
backend_image  = "gcr.io/${PROJECT_ID_PROD}/majong-app-backend:latest"
EOF
```

#### 4.2 Terraformの初期化

```bash
# Terraformを初期化
terraform init

# 初期化が成功したことを確認
terraform version
```

#### 4.3 Terraformの実行計画の確認

```bash
# 実行計画を確認
terraform plan

# 本番環境では、deletion_protectionが有効になっていることを確認
```

---

### ステップ5: Terraformでインフラを作成（本番環境）

#### 5.1 インフラの作成

```bash
# インフラを作成（本番環境では慎重に）
terraform apply

# 確認プロンプトで内容を確認してから "yes" と入力
```

**重要**: 本番環境では、`deletion_protection`が有効になっているため、誤って削除されることを防ぎます。

#### 5.2 作成されたリソースの確認

```bash
# Terraformの出力を確認
terraform output

# すべてのリソースが正常に作成されていることを確認
gcloud sql instances list --project=${PROJECT_ID_PROD}
gcloud run services list --region=us-west1 --project=${PROJECT_ID_PROD}
gcloud compute networks list --project=${PROJECT_ID_PROD}
```

---

### ステップ6: データベースの初期化（本番環境）

```bash
# データベース接続情報を取得
cd ../../../../

# 本番環境のデータベース接続情報を取得
cd infrastructure/terraform/environments/production
DB_CONNECTION_NAME_PROD=$(terraform output -raw database_connection_name)
DB_PRIVATE_IP_PROD=$(terraform output -raw database_private_ip)

# DATABASE_URLを構築
DATABASE_URL_PROD="postgresql://majong_user:${DB_PASSWORD_PROD}@${DB_PRIVATE_IP_PROD}:5432/majong_db"
echo "本番環境DATABASE_URL: ${DATABASE_URL_PROD}"

# Prismaマイグレーションを実行
cd ../../../../backend
export DATABASE_URL="${DATABASE_URL_PROD}"
npx prisma generate
npx prisma migrate deploy
```

---

### ステップ7: Dockerイメージのビルドとプッシュ（本番環境）

```bash
# 本番環境プロジェクトに切り替え
gcloud config set project ${PROJECT_ID_PROD}

# Docker認証の設定
gcloud auth configure-docker

# フロントエンドイメージのビルドとプッシュ
cd ../frontend
docker build -t gcr.io/${PROJECT_ID_PROD}/majong-app-frontend:latest .
docker push gcr.io/${PROJECT_ID_PROD}/majong-app-frontend:latest

# バックエンドイメージのビルドとプッシュ
cd ../backend
docker build -t gcr.io/${PROJECT_ID_PROD}/majong-app-backend:latest .
docker push gcr.io/${PROJECT_ID_PROD}/majong-app-backend:latest
```

---

### ステップ8: Cloud Runサービスの更新（本番環境）

```bash
# Terraformでイメージを更新
cd infrastructure/terraform/environments/production
terraform apply -auto-approve
```

---

### ステップ9: GitHub Secretsの設定（本番環境）

本番環境用のSecretsを追加する場合:

1. GitHubリポジトリのSettings > Secrets and variables > Actions に移動
2. 本番環境用のSecretsを追加（環境ごとに分ける場合）:

```
GCP_PROJECT_ID_PROD: ${PROJECT_ID_PROD}
GCP_SA_KEY_PROD: github-actions-key-prod.jsonの内容
DB_PASSWORD_PROD: ${DB_PASSWORD_PROD}
```

**注意**: 現在のGitHub Actionsワークフローは、同一のSecretsを使用しています。環境ごとに分ける場合は、ワークフローを修正する必要があります。

---

### ステップ10: 動作確認（本番環境）

```bash
# フロントエンドのURLを取得
FRONTEND_URL_PROD=$(gcloud run services describe majong-app-frontend-prod \
  --region us-west1 \
  --project=${PROJECT_ID_PROD} \
  --format="value(status.url)")

echo "本番環境フロントエンドURL: ${FRONTEND_URL_PROD}"

# バックエンドのURLを取得
BACKEND_URL_PROD=$(gcloud run services describe majong-app-backend-prod \
  --region us-west1 \
  --project=${PROJECT_ID_PROD} \
  --format="value(status.url)")

echo "本番環境バックエンドURL: ${BACKEND_URL_PROD}"

# ヘルスチェック
curl ${BACKEND_URL_PROD}/health
```

---

## デプロイ後の確認事項

### ステージング環境

- [ ] フロントエンドが正常に表示される
- [ ] バックエンドAPIが正常に動作する
- [ ] データベース接続が正常に動作する
- [ ] 基本的な機能（参加者登録、半荘作成など）が動作する
- [ ] Cloud Monitoringでリソース使用状況を確認
- [ ] Cloud Billingでコストを確認

### 本番環境

- [ ] ステージング環境と同様の確認項目
- [ ] セキュリティ設定（認証、アクセス制御）が適切に設定されている
- [ ] バックアップ設定が有効になっている
- [ ] 監視・アラートが適切に設定されている

---

## トラブルシューティング

### よくある問題と解決方法

#### 0. PowerShellでgcloudコマンドが実行できない

**問題**: `このシステムではスクリプトの実行が無効になっているため、ファイル ...\gcloud.ps1 を読み込むことができません`

**解決方法**:

```powershell
# 方法1: 現在のユーザーの実行ポリシーを変更（推奨）
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# 方法2: 現在のセッションのみ変更（一時的）
Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process

# 方法3: Git Bashを使用する（PowerShellの実行ポリシーの影響を受けない）
# Git Bashで gcloud init を実行
```

**確認**:

```powershell
# 実行ポリシーを確認
Get-ExecutionPolicy -List
```

**代替方法**: Git Bashを使用する場合は、PowerShellの実行ポリシーの影響を受けません。

#### 1. Terraformの適用が失敗する

**問題**: `Error: Error creating instance: googleapi: Error 403: Insufficient Permission`

**解決方法**:
```bash
# サービスアカウントに必要な権限が付与されているか確認
gcloud projects get-iam-policy ${PROJECT_ID}

# アプリケーションのデフォルト認証情報を再設定
gcloud auth application-default login
```

#### 2. Cloud RunからCloud SQLに接続できない

**問題**: `Error: connect ECONNREFUSED`

**解決方法**:
```bash
# VPCコネクタが正しく設定されているか確認
gcloud compute networks vpc-access connectors list --region=us-west1

# Cloud SQLのプライベートIPが有効になっているか確認
gcloud sql instances describe INSTANCE_NAME --project=${PROJECT_ID}

# Cloud RunサービスにVPCコネクタが設定されているか確認
gcloud run services describe SERVICE_NAME --region=us-west1 --project=${PROJECT_ID}
```

#### 3. Dockerイメージのビルドが失敗する

**問題**: `Error: failed to solve: process "/bin/sh -c npm install" did not complete successfully`

**解決方法**:
```bash
# Dockerfileの依存関係インストール手順を確認
# package.jsonとpackage-lock.jsonが正しくコピーされているか確認
# .dockerignoreで不要なファイルが除外されているか確認
```

#### 4. Prismaマイグレーションが失敗する

**問題**: `Error: Can't reach database server`

**解決方法**:
```bash
# Cloud SQL Proxyを使用して接続
# または、VPCコネクタ経由で接続するように設定
# DATABASE_URLが正しく設定されているか確認
```

---

## 次のステップ

初回デプロイが完了したら:

1. **CI/CDパイプラインのテスト**: GitHubにプッシュして、自動デプロイが動作することを確認
2. **監視設定**: Cloud Monitoringでアラートを設定
3. **バックアップ設定**: Cloud SQLのバックアップ設定を確認
4. **セキュリティ強化**: 必要に応じて認証・認可を追加
5. **パフォーマンステスト**: 負荷テストを実施

---

## 参考資料

- [GCP公式ドキュメント](https://cloud.google.com/docs)
- [Terraform GCP Provider](https://registry.terraform.io/providers/hashicorp/google/latest/docs)
- [Cloud Run公式ドキュメント](https://cloud.google.com/run/docs)
- [Cloud SQL公式ドキュメント](https://cloud.google.com/sql/docs)
- [Cloud SQL Proxy](https://cloud.google.com/sql/docs/postgres/connect-instance-cloud-sql-proxy)

