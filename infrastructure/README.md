# Infrastructure

このディレクトリには、GCPインフラを管理するためのファイルが含まれています。

## ディレクトリ構成

```
infrastructure/
├── terraform/              # Terraform設定ファイル
│   ├── environments/       # 環境ごとの設定
│   │   ├── staging/        # ステージング環境
│   │   └── production/    # 本番環境
│   └── modules/           # Terraformモジュール
│       ├── cloud-run/      # Cloud Runモジュール
│       ├── cloud-sql/      # Cloud SQLモジュール
│       └── vpc/            # VPCモジュール
└── README.md              # このファイル
```

## 使用方法

詳細は各ディレクトリのREADMEを参照してください。

- [Terraform設定](./terraform/README.md)
- [実装手順書](../design/infrastructure/implementation-guide.md)

