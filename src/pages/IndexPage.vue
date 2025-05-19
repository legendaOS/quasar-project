<script setup lang="ts">
import { useTreeStore } from 'src/stores/TreeStore';
import { onMounted, ref, computed, watch } from 'vue';
import { QTable, QBtn, QInput } from 'quasar';

interface Item {
  id: string;
  parent: string | null;
  label: string;
}

const treeStore = useTreeStore();

const items: Item[] = [
  { id: "1", parent: null, label: "Айтем 1" },
  { id: "2", parent: "1", label: "Айтем 2" },
  { id: "3", parent: "1", label: "Айтем 3" },
  { id: "4", parent: "2", label: "Айтем 4" },
  { id: "5", parent: "2", label: "Айтем 5" },
  { id: "6", parent: "2", label: "Айтем 6" },
  { id: "7", parent: "4", label: "Айтем 7" },
  { id: "8", parent: "4", label: "Айтем 8" }
];

onMounted(() => {
  treeStore.initialize(items);
  pushHistory();
});

interface TreeTableRow {
  id: string;
  parent: string | null;
  label: string;
  index: number;
  category: string;
  children: TreeTableRow[];
  level: number;
}

// --- История изменений ---
const history = ref<Item[][]>([]);
const historyIndex = ref(0);

function pushHistory() {
  // Обрезаем "будущее" если делаем новое действие
  if (historyIndex.value < history.value.length - 1) {
    history.value = history.value.slice(0, historyIndex.value + 1);
  }
  history.value.push(treeStore.items.map(item => ({ ...item })));
  historyIndex.value = history.value.length - 1;
}

// --- Режим редактирования ---
const editMode = ref(false);

// --- Построение дерева ---
function buildTreeTableRows(parentId: string | null, level = 0, idxOffset = { value: 1 }): TreeTableRow[] {
  return treeStore.items
    .filter(item => item.parent === parentId)
    .map(item => {
      const children = buildTreeTableRows(item.id, level + 1, idxOffset);
      const row: TreeTableRow = {
        id: item.id,
        parent: item.parent,
        label: item.label,
        index: idxOffset.value++,
        category: children.length > 0 ? 'Группа' : 'Элемент',
        children,
        level
      };
      return row;
    });
}

const treeRows = computed(() => buildTreeTableRows(null));

const columns = [
  { name: 'index', label: '№ п/п', align: 'left' as const, field: 'index', style: 'width: 80px;' },
  { name: 'category', label: 'Категория', align: 'left' as const, field: 'category', style: 'width: 120px;' },
  { name: 'label', label: 'Наименование', align: 'left' as const, field: 'label' }
];

const expanded = ref<string[]>([]);

function isExpanded(id: string) {
  return expanded.value.includes(id);
}
function toggleExpand(id: string) {
  if (isExpanded(id)) {
    expanded.value = expanded.value.filter(eid => eid !== id);
  } else {
    expanded.value.push(id);
  }
}

function renderRows(rows: TreeTableRow[]) {
  const result: TreeTableRow[] = [];
  for (const row of rows) {
    result.push(row);
    if (row.children.length > 0 && isExpanded(row.id)) {
      result.push(...renderRows(row.children));
    }
  }
  return result;
}

const flatRows = computed(() => renderRows(treeRows.value));

// --- Редактирование ---
function addChild(parentId: string | null) {
  // Генерируем уникальный id
  const newId = Date.now().toString() + Math.random().toString(36).slice(2, 6);
  treeStore.items.push({ id: newId, parent: parentId ?? null, label: 'Новый элемент' });
  pushHistory();
  // Автоматически раскрываем родителя
  if (typeof parentId === 'string' && !expanded.value.includes(parentId)) {
    expanded.value.push(parentId);
  }
}

function removeItem(id: string) {
  // Рекурсивно удаляем элемент и всех потомков
  function removeRecursive(itemId: string) {
    const children = treeStore.items.filter(i => i.parent === itemId);
    for (const child of children) removeRecursive(child.id);
    const idx = treeStore.items.findIndex(i => i.id === itemId);
    if (idx !== -1) treeStore.items.splice(idx, 1);
  }
  removeRecursive(id);
  pushHistory();
}

function updateLabel(id: string, newLabel: string) {
  const item = treeStore.items.find(i => i.id === id);
  if (item) {
    item.label = newLabel;
    pushHistory();
  }
}

// Следим за изменениями в treeStore.items и не даём истории "раздуваться" при инициализации
const skipHistory = false;
watch(() => treeStore.items, () => {
  if (!skipHistory) pushHistory();
}, { deep: true });

</script>

<template>
  <div class="q-pa-md">
    <div class="q-mb-md row items-center q-gutter-sm">
      <q-btn :label="editMode ? 'Режим просмотра' : 'Режим редактирования'" color="primary"
        @click="editMode = !editMode" />

    </div>
    <q-table :rows="flatRows" :columns="columns" row-key="id" hide-pagination flat :rows-per-page-options="[0]"
      class="tree-table">
      <template #body-cell-index="props">
        <q-td :props="props">
          {{ props.row.index }}
        </q-td>
      </template>
      <template #body-cell-category="props">
        <q-td :props="props">
          {{ props.row.category }}
        </q-td>
      </template>
      <template #body-cell-label="props">
        <q-td :props="props">
          <div :style="{ paddingLeft: (props.row.level * 24) + 'px', display: 'flex', alignItems: 'center' }">
            <template v-if="props.row.children.length > 0">
              <q-btn dense flat round size="sm" :icon="isExpanded(props.row.id) ? 'expand_more' : 'chevron_right'"
                @click.stop="toggleExpand(props.row.id)" class="q-mr-xs" />
            </template>
            <template v-if="editMode">
              <q-input v-model="props.row.label" dense borderless style="min-width: 120px; max-width: 300px;"
                @update:model-value="val => updateLabel(props.row.id, val as string)"
                :style="props.row.children.length > 0 ? 'font-weight: bold' : ''" />
              <q-btn icon="add" size="sm" flat round @click.stop="addChild(props.row.id)" class="q-ml-xs" />
              <q-btn icon="close" size="sm" flat round color="negative" @click.stop="removeItem(props.row.id)"
                class="q-ml-xs" />
            </template>
            <template v-else>
              <span :style="props.row.children.length > 0 ? 'font-weight: bold' : ''">{{ props.row.label }}</span>
            </template>
          </div>
        </q-td>
      </template>
    </q-table>
  </div>
</template>

<style scoped>
.tree-table {
  max-width: 900px;
  margin: 0 auto;
}
</style>
