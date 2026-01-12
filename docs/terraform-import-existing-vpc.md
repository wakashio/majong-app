# Terraformで既存のVPCネットワークをインポートする方法

## 問題

Terraformを実行すると、以下のエラーが発生します：

```
Error: Error creating Network: googleapi: Error 409: The resource 'projects/***/global/networks/majong-app-vpc-staging' already exists, alreadyExists
```

これは、VPCネットワークが既にGCPに存在しているが、Terraformの状態ファイルに記録されていないことを示しています。

## 解決方法

既存のリソースをTerraformの状態にインポートする必要があります。

### ステップ1: Terraformのディレクトリに移動

```powershell
cd infrastructure/terraform/environments/staging
```

### ステップ2: プロジェクトIDを確認

`terraform.tfvars`ファイルを確認して、プロジェクトIDを確認してください：

```powershell
cat terraform.tfvars
```

または、`terraform.tfvars.example`を参照してください。

### ステップ3: 既存のVPCネットワークをインポート

```powershell
# プロジェクトIDを環境変数に設定（terraform.tfvarsから取得）
$PROJECT_ID = "majong-app-staging"  # 実際のプロジェクトIDに置き換えてください

# VPCネットワークをインポート
terraform import module.vpc.google_compute_network.vpc projects/$PROJECT_ID/global/networks/majong-app-vpc-staging
```

### ステップ4: 既存のサブネットをインポート（存在する場合）

```powershell
# リージョンを確認（通常はus-west1）
$REGION = "us-west1"  # 実際のリージョンに置き換えてください

# サブネットをインポート
terraform import module.vpc.google_compute_subnetwork.subnet projects/$PROJECT_ID/regions/$REGION/subnetworks/majong-app-subnet-staging
```

### ステップ5: 既存のプライベートIPアドレスをインポート（存在する場合）

```powershell
# プライベートIPアドレスをインポート
terraform import module.vpc.google_compute_global_address.private_ip projects/$PROJECT_ID/global/addresses/majong-app-private-ip-staging
```

### ステップ6: サービスネットワーキング接続の確認

サービスネットワーキング接続は、通常インポートする必要はありません。Terraformが自動的に既存の接続を検出するか、新規作成します。

ただし、既に存在する場合は、以下のコマンドでインポートできます：

```powershell
# サービスネットワーキング接続をインポート
# 注意: 接続名は通常、プロジェクト番号とネットワーク名から構成されます
# まず、プロジェクト番号を取得
$PROJECT_NUMBER = gcloud projects describe $PROJECT_ID --format='value(projectNumber)'

# サービスネットワーキング接続をインポート
terraform import module.vpc.google_service_networking_connection.private_vpc_connection projects/$PROJECT_NUMBER/global/networks/majong-app-vpc-staging/peeredNetworks
```

**注意:** サービスネットワーキング接続のインポートは複雑な場合があります。エラーが発生した場合は、このステップをスキップして、Terraformに新規作成させても問題ありません（既存の接続がある場合は、エラーになりますが、その場合は手動で削除するか、Terraformの設定を調整する必要があります）。

### ステップ7: Terraformの状態を確認

```powershell
# インポートされたリソースを確認
terraform state list
```

**期待結果:**
- `module.vpc.google_compute_network.vpc`が表示されること
- `module.vpc.google_compute_subnetwork.subnet`が表示されること（存在する場合）
- `module.vpc.google_compute_global_address.private_ip`が表示されること（存在する場合）

### ステップ8: Terraformプランを実行

```powershell
# プランを実行して、変更内容を確認
terraform plan
```

**期待結果:**
- インポートしたリソースに対して「No changes」と表示されること
- 新規作成が必要なリソースのみが表示されること

### ステップ9: Terraformを適用（必要に応じて）

```powershell
# プランに問題がなければ、適用を実行
terraform apply
```

## トラブルシューティング

### 問題1: インポートコマンドが失敗する

**症状:**
- `Error: resource not found`が表示される

**原因:**
- リソース名が間違っている
- プロジェクトIDが間違っている
- リソースが実際には存在しない

**解決方法:**
- GCPコンソールでリソースが存在するか確認
- リソース名を正確に確認：
```powershell
# VPCネットワーク一覧を確認
gcloud compute networks list --project=$PROJECT_ID

# サブネット一覧を確認
gcloud compute networks subnets list --project=$PROJECT_ID --filter="network:majong-app-vpc-staging"
```

### 問題2: サブネットが存在しない

**症状:**
- サブネットのインポートが失敗する

**解決方法:**
- サブネットが存在しない場合は、ステップ4をスキップしてください
- Terraformが新規作成します

### 問題3: サービスネットワーキング接続のインポートが失敗する

**症状:**
- サービスネットワーキング接続のインポートが失敗する

**解決方法:**
- このステップをスキップしてください
- Terraformが既存の接続を検出するか、新規作成します
- エラーが発生した場合は、GCPコンソールで手動で確認してください

## 参考資料

- [Terraform Import ドキュメント](https://www.terraform.io/docs/cli/import/index.html)
- [Google Provider - Import](https://registry.terraform.io/providers/hashicorp/google/latest/docs/resources/compute_network#import)


