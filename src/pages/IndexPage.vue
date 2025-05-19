/**
* Компонент для отображения и редактирования древовидной структуры данных
* Реализует функционал:
* - Отображение иерархической структуры в виде таблицы
* - Добавление/удаление элементов
* - Редактирование названий элементов
* - История изменений с возможностью отмены/возврата действий
* - Анимации для улучшения пользовательского опыта
*/

<script setup lang="ts">
import { useTreeStore } from 'src/stores/TreeStore';
import { onMounted, ref, computed, watch } from 'vue';
import { QTable, QBtn, QInput } from 'quasar';

/**
 * Интерфейс для базового элемента дерева
 * @property {string} id - Уникальный идентификатор элемента
 * @property {string|null} parent - ID родительского элемента (null для корневых элементов)
 * @property {string} label - Название элемента
 * @property {boolean} [isNew] - Флаг нового элемента для анимации
 * @property {boolean} [isRemoving] - Флаг удаляемого элемента для анимации
 */
interface Item {
  id: string;
  parent: string | null;
  label: string;
  isNew?: boolean;
  isRemoving?: boolean;
}

/**
 * Интерфейс для строки в таблице дерева
 * Расширяет базовый Item дополнительными свойствами для отображения
 */
interface TreeTableRow {
  id: string;
  parent: string | null;
  label: string;
  index: number;
  category: string;
  children: TreeTableRow[];
  level: number;
  isNew?: boolean;
  isRemoving?: boolean;
}

// Инициализация хранилища состояния
const treeStore = useTreeStore();

// Начальные данные для дерева
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

// Инициализация при монтировании компонента
onMounted(() => {
  treeStore.initialize(items);
  pushHistory();
});

// --- Управление историей изменений ---
const history = ref<Item[][]>([]);
const historyIndex = ref(0);

/**
 * Добавляет текущее состояние в историю изменений
 * Удаляет "будущие" состояния при создании новой ветки истории
 */
function pushHistory() {
  if (historyIndex.value < history.value.length - 1) {
    history.value = history.value.slice(0, historyIndex.value + 1);
  }
  history.value.push(treeStore.items.map(item => ({ ...item })));
  historyIndex.value = history.value.length - 1;
}

// --- Управление режимом редактирования ---
const editMode = ref(false);

/**
 * Рекурсивно строит строки таблицы из дерева элементов
 * @param {string|null} parentId - ID родительского элемента
 * @param {number} level - Уровень вложенности
 * @param {Object} idxOffset - Счетчик для нумерации строк
 * @returns {TreeTableRow[]} Массив строк таблицы
 */
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

// Вычисляемое свойство для строк таблицы
const treeRows = computed(() => buildTreeTableRows(null));

// Конфигурация колонок таблицы
const columns = [
  { name: 'index', label: '№ п/п', align: 'center' as const, field: 'index', style: 'width: 80px;' },
  { name: 'category', label: 'Категория', align: 'center' as const, field: 'category', style: 'width: 120px;' },
  { name: 'label', label: 'Наименование', align: 'left' as const, field: 'label' },
  { name: 'actions', label: '', align: 'center' as const, field: 'actions', style: 'width: 90px;' }
];

// --- Управление развернутыми элементами ---
const expanded = ref<string[]>([]);

/**
 * Проверяет, развернут ли элемент
 * @param {string} id - ID элемента
 * @returns {boolean} Результат проверки
 */
function isExpanded(id: string) {
  return expanded.value.includes(id);
}

/**
 * Переключает состояние развернутости элемента
 * @param {string} id - ID элемента
 */
function toggleExpand(id: string) {
  if (isExpanded(id)) {
    expanded.value = expanded.value.filter(eid => eid !== id);
  } else {
    expanded.value.push(id);
  }
}

/**
 * Рекурсивно формирует плоский список строк для отображения
 * @param {TreeTableRow[]} rows - Массив строк
 * @returns {TreeTableRow[]} Плоский список строк
 */
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

// Вычисляемое свойство для плоского списка строк
const flatRows = computed(() => renderRows(treeRows.value));

// --- Функции редактирования ---
/**
 * Добавляет новый дочерний элемент
 * @param {string|null} parentId - ID родительского элемента
 */
function addChild(parentId: string | null) {
  const newId = Date.now().toString() + Math.random().toString(36).slice(2, 6);
  const newItem = { id: newId, parent: parentId ?? null, label: 'Новый элемент', isNew: true };
  treeStore.items.push(newItem);
  pushHistory();
  if (typeof parentId === 'string' && !expanded.value.includes(parentId)) {
    expanded.value.push(parentId);
  }
  setTimeout(() => {
    const item = treeStore.items.find(i => i.id === newId);
    if (item) {
      delete item.isNew;
    }
  }, 400);
}

/**
 * Рекурсивно удаляет элемент и всех его потомков
 * @param {string} id - ID удаляемого элемента
 */
function removeItem(id: string) {
  function removeRecursive(itemId: string) {
    const children = treeStore.items.filter(i => i.parent === itemId);
    for (const child of children) removeRecursive(child.id);
    const idx = treeStore.items.findIndex(i => i.id === itemId);
    if (idx !== -1) {
      const item = treeStore.items[idx];
      if (item) {
        item.isRemoving = true;
        setTimeout(() => {
          const newIdx = treeStore.items.findIndex(i => i.id === itemId);
          if (newIdx !== -1) {
            treeStore.items.splice(newIdx, 1);
            pushHistory();
          }
        }, 400);
      }
    }
  }
  removeRecursive(id);
}

/**
 * Обновляет название элемента
 * @param {string} id - ID элемента
 * @param {string} newLabel - Новое название
 */
function updateLabel(id: string, newLabel: string) {
  const item = treeStore.items.find(i => i.id === id);
  if (item) {
    item.label = newLabel;
    pushHistory();
  }
}

// Отслеживание изменений в хранилище
const skipHistory = false;
watch(() => treeStore.items, () => {
  if (!skipHistory) pushHistory();
}, { deep: true });

/**
 * Отменяет последнее действие
 */
function undo() {
  if (historyIndex.value > 0) {
    historyIndex.value--;
    const state = history.value[historyIndex.value];
    if (state) {
      treeStore.resetItems(state);
    }
  }
}

/**
 * Возвращает отмененное действие
 */
function redo() {
  if (historyIndex.value < history.value.length - 1) {
    historyIndex.value++;
    const state = history.value[historyIndex.value];
    if (state) {
      treeStore.resetItems(state);
    }
  }
}

</script>

<template>
  <div class="q-pa-md">
    <div class="q-mb-md row items-center q-gutter-sm">
      <q-btn :label="editMode ? 'Режим просмотра' : 'Режим редактирования'" color="primary"
        @click="editMode = !editMode" />
      <!-- Кнопки возврата/отмены -->
      <q-btn icon="undo" flat round class="q-ml-sm" :disable="historyIndex === 0" @click="undo" />
      <q-btn icon="redo" flat round class="q-ml-xs" :disable="historyIndex === history.length - 1" @click="redo" />
    </div>
    <q-table :rows="flatRows" :columns="columns" row-key="id" hide-pagination flat :rows-per-page-options="[0]"
      class="tree-table">
      <template #header="props">
        <q-tr :props="props">
          <q-th v-for="col in props.cols" :key="col.name" :props="props" class="header-bold">
            {{ col.label }}
          </q-th>
        </q-tr>
      </template>
      <template #body-cell-index="props">
        <q-td :props="props" :class="{ 'row-enter': props.row.isNew, 'row-leave': props.row.isRemoving }"
          style="text-align: center;">
          {{ props.row.index }}
        </q-td>
      </template>
      <template #body-cell-category="props">
        <q-td :props="props" :class="{ 'row-enter': props.row.isNew, 'row-leave': props.row.isRemoving }"
          style="text-align: center;">
          <div style="display: flex; align-items: center; justify-content: center;">
            <template v-if="props.row.children.length > 0">
              <q-btn dense flat round size="sm" :icon="isExpanded(props.row.id) ? 'expand_more' : 'chevron_right'"
                @click.stop="toggleExpand(props.row.id)" class="q-mr-xs" />
            </template>
            <span style="font-weight: bold;">{{ props.row.category }}</span>
          </div>
        </q-td>
      </template>
      <template #body-cell-label="props">
        <q-td :props="props" :class="{ 'row-enter': props.row.isNew, 'row-leave': props.row.isRemoving }">
          <div :style="{ paddingLeft: (props.row.level * 24) + 'px', display: 'flex', alignItems: 'center' }">
            <template v-if="editMode">
              <q-input v-model="props.row.label" dense borderless style="min-width: 120px; max-width: 300px;"
                @update:model-value="val => updateLabel(props.row.id, val as string)"
                :style="props.row.children.length > 0 ? 'font-weight: bold' : ''" />
            </template>
            <template v-else>
              <span :style="props.row.children.length > 0 ? 'font-weight: bold' : ''">{{ props.row.label }}</span>
            </template>
          </div>
        </q-td>
      </template>
      <template #body-cell-actions="props">
        <q-td :props="props" style="text-align: center; min-width: 80px;">
          <template v-if="editMode">
            <q-btn icon="add" size="sm" flat round @click.stop="addChild(props.row.id)" class="q-mr-xs" />
            <q-btn icon="close" size="sm" flat round color="negative" @click.stop="removeItem(props.row.id)" />
          </template>
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

/* Анимации для строк таблицы */
.tree-table tr {
  transition: all 0.3s ease;
}

/* Анимация для кнопок */
.q-btn {
  transition: transform 0.2s ease, opacity 0.2s ease;
}

.q-btn:hover {
  transform: scale(1.1);
}

/* Анимация для иконки разворачивания/сворачивания */
.q-btn[icon="expand_more"],
.q-btn[icon="chevron_right"] {
  transition: transform 0.3s ease;
}

/* Анимация для добавления строк */
.row-enter {
  animation: fadeIn 0.4s ease-out;
}

@keyframes fadeIn {
  0% {
    opacity: 0;
  }

  100% {
    opacity: 1;
  }
}

/* Анимация для удаления строк */
.row-leave {
  animation: fadeOut 0.4s ease-in;
  position: relative;
}

@keyframes fadeOut {
  0% {
    opacity: 1;
  }

  100% {
    opacity: 0;
  }
}

/* Анимация для редактирования текста */
.q-input {
  transition: all 0.3s ease;
}

.q-input:focus-within {
  transform: scale(1.02);
}

/* Анимация для кнопок действий */
.q-btn[icon="add"],
.q-btn[icon="close"] {
  opacity: 0.7;
  transition: all 0.2s ease;
}

.q-btn[icon="add"]:hover {
  opacity: 1;
  color: var(--q-primary);
}

.q-btn[icon="close"]:hover {
  opacity: 1;
  color: var(--q-negative);
}

.header-bold {
  font-weight: bold;
  font-size: 15px;
}
</style>
