# Terraform Infrastructure as Code

このディレクトリには、GCPインフラをTerraformで管理するための設定ファイルが含まれています。

## ディレクトリ構成

```
terraform/
├── environments/
│   ├── staging/          # ステージング環境
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   ├── outputs.tf
│   │   └── terraform.tfvars.example
│   └── production/       # 本番環境
│       ├── main.tf
│       ├── variables.tf
│       ├── outputs.tf
│       └── terraform.tfvars.example
└── modules/
    ├── cloud-run/        # Cloud Runモジュール
    ├── cloud-sql/        # Cloud SQLモジュール
    └── vpc/              # VPCモジュール
```

## 使用方法

### 1. 変数ファイルの作成

各環境のディレクトリで、`terraform.tfvars.example`をコピーして`terraform.tfvars`を作成し、実際の値を設定してください。

```bash
cd environments/staging
cp terraform.tfvars.example terraform.tfvars
# terraform.tfvarsを編集して実際の値を設定
```

### 2. Terraformの初期化

```bash
cd environments/staging
terraform init
```

### 3. 実行計画の確認

```bash
terraform plan
```

### 4. インフラの作成

```bash
terraform apply
```

### 5. インフラの削除（注意: 本番環境では慎重に）

```bash
terraform destroy
```

## 注意事項

- `terraform.tfvars`ファイルには機密情報が含まれるため、Gitにコミットしないでください
- `.gitignore`に`terraform.tfvars`を追加してください
- 本番環境では`deletion_protection`が有効になっているため、誤って削除されることを防ぎます

