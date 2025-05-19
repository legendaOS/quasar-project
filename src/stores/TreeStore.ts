import { defineStore } from 'pinia';

interface TreeNode {
  id: string;
  parent: string | null;
  label: string;
}

interface TreeState {
  items: TreeNode[];
}

interface TreeStore {
  items: TreeNode[];
  getItemById: (id: string) => TreeNode | undefined;
  getChildren: (id: string) => TreeNode[];
  initialize: (items: Array<{ id: number | string; parent: number | string | null; label: string }>) => void;
  getAllChildren: (id: string) => TreeNode[];
  getAllParents: (id: string) => TreeNode[];
  addItem: (item: { id: number | string; parent: number | string | null; label: string }) => void;
  removeItem: (id: string) => void;
  updateItem: (updatedItem: { id: number | string; parent: number | string | null; label: string }) => void;
}

export const useTreeStore = defineStore('tree', {
  state: (): TreeState => ({
    items: []
  }),

  getters: {
    /**
     * Получает все элементы дерева
     */
    getAllItems: (state: TreeState) => state.items,

    /**
     * Находит элемент по его идентификатору
     */
    getItemById: (state: TreeState) => (id: string) => {
      return state.items.find(item => item.id === id);
    },

    /**
     * Получает прямых потомков элемента
     */
    getChildren: (state: TreeState) => (id: string) => {
      return state.items.filter(item => item.parent === id);
    }
  },

  actions: {
    /**
     * Инициализирует хранилище начальными данными
     * @param items - Массив элементов для инициализации дерева
     */
    initialize(this: TreeStore, items: Array<{ id: number | string; parent: number | string | null; label: string }>) {
      this.items = items.map(item => ({
        ...item,
        id: String(item.id),
        parent: item.parent ? String(item.parent) : null
      }));
    },

    /**
     * Получает всех потомков элемента рекурсивно
     * @param id - Идентификатор родительского элемента
     * @returns Массив всех потомков (включая потомков потомков)
     */
    getAllChildren(this: TreeStore, id: string): TreeNode[] {
      const children = this.getChildren(id);
      const result = [...children];
      
      children.forEach((child: TreeNode) => {
        result.push(...this.getAllChildren(child.id));
      });
      
      return result;
    },

    /**
     * Получает всех предков элемента
     * @param id - Идентификатор элемента
     * @returns Массив всех предков (от ближайшего к дальнему)
     */
    getAllParents(this: TreeStore, id: string): TreeNode[] {
      const item = this.getItemById(id);
      if (!item || !item.parent) return [];
      
      const parent = this.getItemById(item.parent);
      if (!parent) return [];
      
      return [parent, ...this.getAllParents(parent.id)];
    },

    /**
     * Добавляет новый элемент в дерево
     * @param item - Новый элемент для добавления
     * @throws {Error} Если элемент с таким id уже существует
     * @throws {Error} Если указанный родитель не существует
     */
    addItem(this: TreeStore, item: { id: number | string; parent: number | string | null; label: string }): void {
      const newItem: TreeNode = {
        ...item,
        id: String(item.id),
        parent: item.parent ? String(item.parent) : null
      };

      // Проверка на существование элемента с таким id
      if (this.getItemById(newItem.id)) {
        throw new Error(`Элемент с id ${newItem.id} уже существует`);
      }

      // Если указан родитель, проверяем его существование
      if (newItem.parent !== null) {
        const parent = this.getItemById(newItem.parent);
        if (!parent) {
          throw new Error(`Родитель с id ${newItem.parent} не найден`);
        }
      }

      // Добавляем новый элемент
      this.items.push(newItem);
    },

    /**
     * Удаляет элемент и всех его потомков
     * @param id - Идентификатор удаляемого элемента
     * @throws {Error} Если элемент с указанным id не найден
     */
    removeItem(this: TreeStore, id: string): void {
      const item = this.getItemById(id);
      if (!item) {
        throw new Error(`Элемент с id ${id} не найден`);
      }

      // Получаем всех потомков рекурсивно
      const allChildren = this.getAllChildren(id);
      
      // Сначала удаляем всех потомков
      allChildren.forEach(child => {
        this.items = this.items.filter(item => item.id !== child.id);
      });

      // Удаляем сам элемент
      this.items = this.items.filter(item => item.id !== id);
    },

    /**
     * Обновляет существующий элемент
     * @param updatedItem - Обновленные данные элемента
     * @throws {Error} Если элемент с указанным id не найден
     * @throws {Error} Если новый родитель не существует
     * @throws {Error} Если обновление создаст циклическую зависимость
     */
    updateItem(this: TreeStore, updatedItem: { id: number | string; parent: number | string | null; label: string }): void {
      const newItem: TreeNode = {
        ...updatedItem,
        id: String(updatedItem.id),
        parent: updatedItem.parent ? String(updatedItem.parent) : null
      };

      const existingItem = this.getItemById(newItem.id);
      if (!existingItem) {
        throw new Error(`Элемент с id ${newItem.id} не найден`);
      }

      // Если меняется родитель, проверяем существование нового родителя
      if (newItem.parent !== existingItem.parent && newItem.parent !== null) {
        const newParent = this.getItemById(newItem.parent);
        if (!newParent) {
          throw new Error(`Новый родитель с id ${newItem.parent} не найден`);
        }

        // Проверка на циклическую зависимость
        const allParents = this.getAllParents(existingItem.id);
        if (allParents.some(parent => parent.id === newItem.parent)) {
          throw new Error(`Невозможно установить родителем потомка (создастся циклическая зависимость)`);
        }
      }

      // Обновляем элемент
      this.items = this.items.map(item => 
        item.id === newItem.id ? newItem : item
      );
    }
  }
}); 