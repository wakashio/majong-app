<!-- eslint-disable vue/multi-word-component-names -->
<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vue-router";
import { getBreadcrumbs } from "../config/breadcrumbs";

const route = useRoute();

const breadcrumbs = computed(() => {
  const routeName = route.name as string;
  return getBreadcrumbs(routeName, route);
});
</script>

<template>
  <v-breadcrumbs :items="breadcrumbs" class="pa-0">
    <template v-slot:divider>
      <v-icon>mdi-chevron-right</v-icon>
    </template>
  </v-breadcrumbs>
</template>

