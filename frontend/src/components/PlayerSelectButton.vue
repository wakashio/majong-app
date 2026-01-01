<script setup lang="ts">
interface SelectItem {
  value: string;
  title: string;
}

interface Props {
  items: SelectItem[];
  modelValue: string | string[] | undefined;
  label?: string;
  disabled?: boolean;
  required?: boolean;
  multiple?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  label: "",
  disabled: false,
  required: false,
  multiple: false,
});

const emit = defineEmits<{
  "update:modelValue": [value: string | string[]];
}>();

const handleUpdate = (value: string | string[]): void => {
  emit("update:modelValue", value);
};
</script>

<template>
  <div class="player-select-button">
    <div v-if="props.label" class="text-subtitle-1 mb-2">{{ props.label }}</div>
    <v-chip-group
      :model-value="props.modelValue"
      :multiple="props.multiple"
      selected-class="text-primary"
      class="flex-wrap"
      @update:model-value="handleUpdate"
    >
      <v-chip
        v-for="item in props.items"
        :key="item.value"
        :value="item.value"
        :disabled="props.disabled"
        variant="outlined"
        size="large"
      >
        {{ item.title }}
      </v-chip>
    </v-chip-group>
  </div>
</template>

<style scoped>
.player-select-button {
  margin-bottom: 1rem;
}
</style>

