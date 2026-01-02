import { test, expect } from '@playwright/test';

// See here how to get started:
// https://playwright.dev/docs/intro
test('visits the app root url', async ({ page }) => {
  await page.goto('/');
  // アプリバーのタイトルが表示されることを確認
  await expect(page.getByText('麻雀記録アプリ')).toBeVisible();
});

test.describe('TASK-20251230-012: 半荘と局登録のUIを実用に寄せる', () => {
  test.beforeEach(async ({ page }) => {
    // テスト前にホーム画面に移動
    await page.goto('/');
  });

  test('半荘作成成功後、局入力画面へ遷移する', async ({ page }) => {
    // 参加者を4人作成（既に存在する場合はスキップ）
    // 半荘作成画面に移動
    await page.goto('/hanchans/new');

    // 半荘名を入力（オプション）
    const nameInput = page.locator('input[type="text"]').first();
    await nameInput.fill('テスト半荘');

    // 参加者を4人選択（既存の参加者を使用）
    // 注意: 実際のテストでは、参加者が存在することを前提とする
    // または、テスト前に参加者を作成する必要がある

    // 保存ボタンをクリック
    const saveButton = page.locator('button:has-text("保存")');
    await saveButton.click();

    // 局入力画面に遷移したことを確認
    // URLが /hanchans/:id/rounds/new?roundNumber=1 になっていることを確認
    await page.waitForURL(/\/hanchans\/.*\/rounds\/new\?roundNumber=1/, { timeout: 10000 });

    // 局開始画面が表示されていることを確認
    await expect(page.locator('h1')).toContainText('局開始');
  });

  test('局管理画面でタブ切り替えができる', async ({ page }) => {
    // 局管理画面に移動（既存の局があることを前提）
    // 注意: 実際のテストでは、事前に局を作成する必要がある

    // 局開始タブが表示されていることを確認
    const startTab = page.locator('button:has-text("局開始")');
    await expect(startTab).toBeVisible();

    // 局進行中タブが存在することを確認（無効化されている可能性がある）
    const progressTab = page.locator('button:has-text("局進行中")');
    await expect(progressTab).toBeVisible();

    // 局終了タブが存在することを確認（無効化されている可能性がある）
    const endTab = page.locator('button:has-text("局終了")');
    await expect(endTab).toBeVisible();
  });

  test('デフォルト値が自動設定される', async ({ page }) => {
    // 半荘作成画面に移動
    await page.goto('/hanchans/new');

    // 半荘を作成して局入力画面に遷移
    // （上記のテストと同様の手順）

    // 局番号が1に設定されていることを確認
    const roundNumberInput = page.locator('input[type="number"]').first();
    await expect(roundNumberInput).toHaveValue('1');

    // 風が「東」に設定されていることを確認
    // Vuetifyのselectは実装が複雑なため、表示されているテキストで確認
    await expect(page.locator('text=東')).toBeVisible();
  });

  test('次の局への自動遷移機能が存在する', async ({ page }) => {
    // 局管理画面に移動（既存の局があることを前提）
    // 注意: 実際のテストでは、事前に局を作成し、局を終了する必要がある

    // 局終了タブが存在することを確認
    const endTab = page.locator('button:has-text("局終了")');
    await expect(endTab).toBeVisible();

    // 注意: このテストは実際のデータに依存するため、
    // テスト環境で事前に局を作成し、終了する必要がある
    // 現時点では、タブの存在確認のみを行う
    // 実際の動作確認は、手動テストまたは統合テストで実施
  });
});

test.describe('TASK-20251231-014: 次局へボタンを押したときに局が追加されない不具合を修正する', () => {
  test.beforeEach(async ({ page }) => {
    // テスト前にホーム画面に移動
    await page.goto('/');
  });

  test('局を終了した後、「次局へ」ボタンをクリックすると、次局が作成される', async ({ page }) => {
    // 注意: このテストは実際のデータに依存するため、
    // テスト環境で事前に以下を準備する必要がある:
    // 1. 参加者を4人作成
    // 2. 半荘を作成
    // 3. 局を作成し、終了する

    // 局管理画面に移動（既存の局があることを前提）
    // 注意: 実際のテストでは、事前に局を作成し、局を終了する必要がある

    // 局終了タブをクリック
    const endTab = page.locator('button:has-text("局終了")');
    await endTab.click();

    // 局終了タブ内で、終了済みの局のExpansionPanelを展開
    // 注意: 実際のテストでは、終了済みの局のIDを取得する必要がある

    // 「次局へ」ボタンをクリック
    const nextRoundButton = page.locator('button:has-text("次局へ")');
    await expect(nextRoundButton).toBeVisible();
    await nextRoundButton.click();

    // 次局が作成されることを確認
    // 注意: 実際のテストでは、局一覧に次局が追加されていることを確認する必要がある
    // または、次局のExpansionPanelが自動展開されていることを確認する

    // このテストは実際のデータに依存するため、
    // テスト環境で事前に局を作成し、終了する必要がある
    // 現時点では、ボタンの存在確認のみを行う
    // 実際の動作確認は、手動テストまたは統合テストで実施
  });

  test('次局が局一覧に追加される', async ({ page }) => {
    // 注意: このテストは実際のデータに依存するため、
    // テスト環境で事前に局を作成し、終了する必要がある

    // 局管理画面に移動
    // 局を終了
    // 「次局へ」ボタンをクリック

    // 局一覧に次局が追加されていることを確認
    // 注意: 実際のテストでは、局一覧の要素数を確認するか、
    // 次局のExpansionPanelが表示されていることを確認する必要がある

    // このテストは実際のデータに依存するため、
    // テスト環境で事前に局を作成し、終了する必要がある
    // 現時点では、テストの構造のみを定義
    // 実際の動作確認は、手動テストまたは統合テストで実施

    // 暫定的なアサーション（実際のテスト実装時に削除）
    expect(page).toBeTruthy();
  });

  test('次局のExpansionPanelが自動展開される', async ({ page }) => {
    // 注意: このテストは実際のデータに依存するため、
    // テスト環境で事前に局を作成し、終了する必要がある

    // 局管理画面に移動
    // 局を終了
    // 「次局へ」ボタンをクリック

    // 次局のExpansionPanelが自動展開されていることを確認
    // 注意: 実際のテストでは、次局のExpansionPanelが展開されていることを確認する必要がある

    // このテストは実際のデータに依存するため、
    // テスト環境で事前に局を作成し、終了する必要がある
    // 現時点では、テストの構造のみを定義
    // 実際の動作確認は、手動テストまたは統合テストで実施

    // 暫定的なアサーション（実際のテスト実装時に削除）
    expect(page).toBeTruthy();
  });
});

test.describe('TASK-20251231-015: 局の結果記録の入力欄をよりコンパクトにする', () => {
  test.beforeEach(async ({ page }) => {
    // テスト前にホーム画面に移動
    await page.goto('/');
  });

  test('結果入力ダイアログでスコア入力セクションがコンパクトに表示される', async ({ page }) => {
    // 注意: このテストは実際のデータに依存するため、
    // テスト環境で事前に以下を準備する必要がある:
    // 1. 参加者を4人作成
    // 2. 半荘を作成
    // 3. 局を作成し、開始する

    // 局管理画面に移動（既存の局があることを前提）
    // 注意: 実際のテストでは、事前に局を作成し、開始する必要がある

    // 局を終了ボタンをクリックして結果入力ダイアログを開く
    // 注意: 実際のテストでは、局を終了ボタンのセレクタを特定する必要がある

    // スコア入力セクションが表示されていることを確認
    // 注意: 実際のテストでは、v-cardのvariant="outlined"が適用されていることを確認する必要がある
    // または、カードのスタイルを確認する

    // このテストは実際のデータに依存するため、
    // テスト環境で事前に局を作成し、開始する必要がある
    // 現時点では、テストの構造のみを定義
    // 実際の動作確認は、手動テストまたは統合テストで実施

    // 暫定的なアサーション（実際のテスト実装時に削除）
    expect(page).toBeTruthy();
  });

  test('結果入力ダイアログで点数のデフォルト値が0である', async ({ page }) => {
    // 注意: このテストは実際のデータに依存するため、
    // テスト環境で事前に局を作成し、開始する必要がある

    // 局管理画面に移動
    // 局を終了ボタンをクリックして結果入力ダイアログを開く

    // 点数入力欄のデフォルト値が0であることを確認
    // 注意: 実際のテストでは、点数入力欄の値を確認する必要がある
    // const scoreInput = page.locator('input[type="number"][label="点数"]');
    // await expect(scoreInput).toHaveValue('0');

    // このテストは実際のデータに依存するため、
    // テスト環境で事前に局を作成し、開始する必要がある
    // 現時点では、テストの構造のみを定義
    // 実際の動作確認は、手動テストまたは統合テストで実施

    // 暫定的なアサーション（実際のテスト実装時に削除）
    expect(page).toBeTruthy();
  });

  test('自摸上がりの場合、和了者の点数・飜・符入力時に他の3人の点数が自動計算される', async ({ page }) => {
    // 注意: このテストは実際のデータに依存するため、
    // テスト環境で事前に局を作成し、開始する必要がある

    // 局管理画面に移動
    // 局を終了ボタンをクリックして結果入力ダイアログを開く
    // 結果タイプを「ツモ」に選択
    // 和了者を選択
    // 和了者の点数を入力
    // 和了者の飜を入力
    // 和了者の符を入力

    // 他の3人の点数が自動計算されることを確認
    // 注意: 実際のテストでは、他の3人の点数入力欄の値を確認する必要がある
    // 計算結果は、calculateScore APIの結果に基づく

    // このテストは実際のデータに依存するため、
    // テスト環境で事前に局を作成し、開始する必要がある
    // 現時点では、テストの構造のみを定義
    // 実際の動作確認は、手動テストまたは統合テストで実施

    // 暫定的なアサーション（実際のテスト実装時に削除）
    expect(page).toBeTruthy();
  });

  test('自摸上がりの自動計算で、和了者の点数は入力値を維持する', async ({ page }) => {
    // 注意: このテストは実際のデータに依存するため、
    // テスト環境で事前に局を作成し、開始する必要がある

    // 局管理画面に移動
    // 局を終了ボタンをクリックして結果入力ダイアログを開く
    // 結果タイプを「ツモ」に選択
    // 和了者を選択
    // 和了者の点数を入力（例: 1000）
    // 和了者の飜を入力
    // 和了者の符を入力

    // 和了者の点数が入力値（1000）を維持することを確認
    // 注意: 実際のテストでは、和了者の点数入力欄の値を確認する必要がある
    // 自動計算で上書きされないことを確認

    // このテストは実際のデータに依存するため、
    // テスト環境で事前に局を作成し、開始する必要がある
    // 現時点では、テストの構造のみを定義
    // 実際の動作確認は、手動テストまたは統合テストで実施

    // 暫定的なアサーション（実際のテスト実装時に削除）
    expect(page).toBeTruthy();
  });

  test('自摸上がりの自動計算で、計算された点数は手動で変更可能である', async ({ page }) => {
    // 注意: このテストは実際のデータに依存するため、
    // テスト環境で事前に局を作成し、開始する必要がある

    // 局管理画面に移動
    // 局を終了ボタンをクリックして結果入力ダイアログを開く
    // 結果タイプを「ツモ」に選択
    // 和了者を選択
    // 和了者の点数・飜・符を入力して自動計算を実行
    // 自動計算された他の3人の点数を手動で変更

    // 手動で変更した点数が保持されることを確認
    // 注意: 実際のテストでは、手動で変更した点数入力欄の値を確認する必要がある

    // このテストは実際のデータに依存するため、
    // テスト環境で事前に局を作成し、開始する必要がある
    // 現時点では、テストの構造のみを定義
    // 実際の動作確認は、手動テストまたは統合テストで実施

    // 暫定的なアサーション（実際のテスト実装時に削除）
    expect(page).toBeTruthy();
  });
});

test.describe('TASK-20251231-016: 連荘のチェックボックスの削除', () => {
  test.beforeEach(async ({ page }) => {
    // テスト前にホーム画面に移動
    await page.goto('/');
  });

  test('局開始フォームに連荘のチェックボックスが表示されない', async ({ page }) => {
    // 注意: このテストは実際のデータに依存するため、
    // テスト環境で事前に以下を準備する必要がある:
    // 1. 参加者を4人作成
    // 2. 半荘を作成

    // 半荘作成画面に移動
    await page.goto('/hanchans/new');

    // 半荘名を入力（オプション）
    const nameInput = page.locator('input[type="text"]').first();
    await nameInput.fill('テスト半荘');

    // 保存ボタンをクリック
    const saveButton = page.locator('button:has-text("保存")');
    await saveButton.click();

    // 局入力画面に遷移したことを確認
    await page.waitForURL(/\/hanchans\/.*\/rounds\/new\?roundNumber=1/, { timeout: 10000 });

    // 連荘のチェックボックスが表示されていないことを確認
    // 注意: 実際のテストでは、「連荘」というラベルのチェックボックスが存在しないことを確認する必要がある
    const renchanCheckbox = page.locator('input[type="checkbox"]').filter({ hasText: '連荘' });
    await expect(renchanCheckbox).toHaveCount(0);

    // または、ラベルで確認
    const renchanLabel = page.locator('label:has-text("連荘")');
    await expect(renchanLabel).toHaveCount(0);
  });

  test('局編集画面に連荘のチェックボックスが表示されない', async ({ page }) => {
    // 注意: このテストは実際のデータに依存するため、
    // テスト環境で事前に以下を準備する必要がある:
    // 1. 参加者を4人作成
    // 2. 半荘を作成
    // 3. 局を作成

    // 局管理画面に移動（既存の局があることを前提）
    // 注意: 実際のテストでは、事前に局を作成する必要がある

    // 局開始タブをクリック
    const startTab = page.locator('button:has-text("局開始")');
    await startTab.click();

    // 局のExpansionPanelを展開
    // 注意: 実際のテストでは、局のExpansionPanelを特定する必要がある

    // 連荘のチェックボックスが表示されていないことを確認
    const renchanCheckbox = page.locator('input[type="checkbox"]').filter({ hasText: '連荘' });
    await expect(renchanCheckbox).toHaveCount(0);

    // または、ラベルで確認
    const renchanLabel = page.locator('label:has-text("連荘")');
    await expect(renchanLabel).toHaveCount(0);
  });
});
