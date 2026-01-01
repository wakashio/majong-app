<script setup lang="ts">
import { ref, onMounted } from 'vue'
import Breadcrumbs from '../components/Breadcrumbs.vue'

const version = ref('1.0.0')
const updateDate = ref('2025-12-30')

onMounted(() => {
  // package.jsonからバージョンを取得することも可能
  // 現時点では固定値を使用
})
</script>

<template>
  <v-container>
    <v-row>
      <v-col cols="12" class="mb-2">
        <Breadcrumbs />
      </v-col>
    </v-row>
    <v-row justify="center">
      <v-col cols="12" md="8">
        <v-card class="mb-4">
          <v-card-title>麻雀記録アプリについて</v-card-title>
          <v-card-text>
            <p>
              麻雀記録アプリは、麻雀の半荘や局の記録を管理するためのアプリケーションです。
              参加者の登録、半荘の記録、局の記録、打点計算などの機能を提供します。
            </p>
            <h3 class="mt-4 mb-2">主な機能</h3>
            <v-list>
              <v-list-item prepend-icon="mdi-account-group">
                <v-list-item-title>参加者管理</v-list-item-title>
                <v-list-item-subtitle>参加者の登録、編集、削除が可能です</v-list-item-subtitle>
              </v-list-item>
              <v-list-item prepend-icon="mdi-cards">
                <v-list-item-title>半荘管理</v-list-item-title>
                <v-list-item-subtitle>半荘の作成、編集、削除が可能です</v-list-item-subtitle>
              </v-list-item>
              <v-list-item prepend-icon="mdi-dice-multiple">
                <v-list-item-title>局管理</v-list-item-title>
                <v-list-item-subtitle>局の開始、進行中記録、終了処理が可能です</v-list-item-subtitle>
              </v-list-item>
              <v-list-item prepend-icon="mdi-calculator">
                <v-list-item-title>打点計算</v-list-item-title>
                <v-list-item-subtitle>ツモ、ロン、流局の打点計算が自動で行われます</v-list-item-subtitle>
              </v-list-item>
              <v-list-item prepend-icon="mdi-chart-line">
                <v-list-item-title>統計・履歴</v-list-item-title>
                <v-list-item-subtitle>参加者や半荘の統計情報、履歴を確認できます</v-list-item-subtitle>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>

        <v-card class="mb-4">
          <v-card-title>使い方</v-card-title>
          <v-card-text>
            <h3 class="mb-2">基本的な使い方</h3>
            <v-list>
              <v-list-item>
                <v-list-item-title>1. 参加者の登録</v-list-item-title>
                <v-list-item-subtitle>「参加者一覧」から参加者を登録します</v-list-item-subtitle>
              </v-list-item>
              <v-list-item>
                <v-list-item-title>2. 半荘の開始</v-list-item-title>
                <v-list-item-subtitle>「半荘一覧」から新規半荘を作成し、参加者を選択します</v-list-item-subtitle>
              </v-list-item>
              <v-list-item>
                <v-list-item-title>3. 局の記録</v-list-item-title>
                <v-list-item-subtitle>半荘詳細画面から局を開始し、進行中に記録を行います</v-list-item-subtitle>
              </v-list-item>
              <v-list-item>
                <v-list-item-title>4. 局の終了</v-list-item-title>
                <v-list-item-subtitle>局終了時に打点を入力し、自動で計算されます</v-list-item-subtitle>
              </v-list-item>
              <v-list-item>
                <v-list-item-title>5. 半荘の終了</v-list-item-title>
                <v-list-item-subtitle>すべての局が終了したら、半荘を終了します</v-list-item-subtitle>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>

        <v-card>
          <v-card-title>バージョン情報</v-card-title>
          <v-card-text>
            <v-list>
              <v-list-item>
                <v-list-item-title>バージョン</v-list-item-title>
                <v-list-item-subtitle>{{ version }}</v-list-item-subtitle>
              </v-list-item>
              <v-list-item>
                <v-list-item-title>更新日</v-list-item-title>
                <v-list-item-subtitle>{{ updateDate }}</v-list-item-subtitle>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>
