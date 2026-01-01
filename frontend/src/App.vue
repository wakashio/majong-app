<script setup lang="ts">
import { ref } from 'vue'
import { RouterView, useRoute } from 'vue-router'

const route = useRoute()
const drawer = ref(false)

const navigationItems = [
  { title: 'ホーム', icon: 'mdi-home', to: '/' },
  { title: '参加者一覧', icon: 'mdi-account-group', to: '/players' },
  { title: 'セッション一覧', icon: 'mdi-calendar-multiple', to: '/sessions' },
  { title: '半荘一覧', icon: 'mdi-cards', to: '/hanchans' },
  { title: 'About', icon: 'mdi-information', to: '/about' },
]
</script>

<template>
  <v-app>
    <v-app-bar color="primary" prominent>
      <v-app-bar-nav-icon
        variant="text"
        @click.stop="drawer = !drawer"
      ></v-app-bar-nav-icon>

      <v-toolbar-title>麻雀記録アプリ</v-toolbar-title>

      <v-spacer></v-spacer>
    </v-app-bar>

    <v-navigation-drawer
      v-model="drawer"
      location="left"
      temporary
    >
      <v-list>
        <v-list-item
          v-for="item in navigationItems"
          :key="item.to"
          :to="item.to"
          :prepend-icon="item.icon"
          :title="item.title"
          :active="route.path === item.to"
        ></v-list-item>
      </v-list>
    </v-navigation-drawer>

    <v-main>
      <RouterView />
    </v-main>
  </v-app>
</template>
