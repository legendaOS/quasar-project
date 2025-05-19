import { setActivePinia, createPinia } from 'pinia';
import { useTreeStore } from '../TreeStore';

describe('TreeStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  describe('initialize', () => {
    it('should initialize store with items', () => {
      const store = useTreeStore();
      const initialItems = [
        { id: '1', parent: null, label: 'Root' },
        { id: '2', parent: '1', label: 'Child 1' },
        { id: '3', parent: '1', label: 'Child 2' }
      ];

      store.initialize(initialItems);

      expect(store.items).toHaveLength(3);
      expect(store.getItemById('1')).toBeDefined();
      expect(store.getItemById('2')).toBeDefined();
      expect(store.getItemById('3')).toBeDefined();
    });

    it('should convert numeric ids to strings', () => {
      const store = useTreeStore();
      const initialItems = [
        { id: 1, parent: null, label: 'Root' },
        { id: 2, parent: 1, label: 'Child' }
      ];

      store.initialize(initialItems);

      expect(store.getItemById('1')).toBeDefined();
      expect(store.getItemById('2')).toBeDefined();
    });
  });

  describe('getItemById', () => {
    it('should return item by id', () => {
      const store = useTreeStore();
      store.initialize([
        { id: '1', parent: null, label: 'Root' },
        { id: '2', parent: '1', label: 'Child' }
      ]);

      const item = store.getItemById('2');
      expect(item).toBeDefined();
      expect(item?.label).toBe('Child');
    });

    it('should return undefined for non-existent id', () => {
      const store = useTreeStore();
      store.initialize([{ id: '1', parent: null, label: 'Root' }]);

      const item = store.getItemById('999');
      expect(item).toBeUndefined();
    });
  });

  describe('getChildren', () => {
    it('should return direct children of a node', () => {
      const store = useTreeStore();
      store.initialize([
        { id: '1', parent: null, label: 'Root' },
        { id: '2', parent: '1', label: 'Child 1' },
        { id: '3', parent: '1', label: 'Child 2' },
        { id: '4', parent: '2', label: 'Grandchild' }
      ]);

      const children = store.getChildren('1');
      expect(children).toHaveLength(2);
      expect(children.map(c => c.id)).toEqual(['2', '3']);
    });

    it('should return empty array for node without children', () => {
      const store = useTreeStore();
      store.initialize([{ id: '1', parent: null, label: 'Root' }]);

      const children = store.getChildren('1');
      expect(children).toHaveLength(0);
    });
  });

  describe('getAllChildren', () => {
    it('should return all descendants recursively', () => {
      const store = useTreeStore();
      store.initialize([
        { id: '1', parent: null, label: 'Root' },
        { id: '2', parent: '1', label: 'Child 1' },
        { id: '3', parent: '1', label: 'Child 2' },
        { id: '4', parent: '2', label: 'Grandchild 1' },
        { id: '5', parent: '2', label: 'Grandchild 2' }
      ]);

      const allChildren = store.getAllChildren('1');
      expect(allChildren).toHaveLength(4);
      expect(allChildren.map(c => c.id)).toEqual(['2', '3', '4', '5']);
    });
  });

  describe('getAllParents', () => {
    it('should return all ancestors in order', () => {
      const store = useTreeStore();
      store.initialize([
        { id: '1', parent: null, label: 'Root' },
        { id: '2', parent: '1', label: 'Child' },
        { id: '3', parent: '2', label: 'Grandchild' }
      ]);

      const parents = store.getAllParents('3');
      expect(parents).toHaveLength(2);
      expect(parents.map(p => p.id)).toEqual(['2', '1']);
    });

    it('should return empty array for root node', () => {
      const store = useTreeStore();
      store.initialize([{ id: '1', parent: null, label: 'Root' }]);

      const parents = store.getAllParents('1');
      expect(parents).toHaveLength(0);
    });
  });

  describe('addItem', () => {
    it('should add new item to store', () => {
      const store = useTreeStore();
      store.initialize([{ id: '1', parent: null, label: 'Root' }]);

      store.addItem({ id: '2', parent: '1', label: 'Child' });
      expect(store.items).toHaveLength(2);
      expect(store.getItemById('2')).toBeDefined();
    });

    it('should throw error when adding item with existing id', () => {
      const store = useTreeStore();
      store.initialize([{ id: '1', parent: null, label: 'Root' }]);

      expect(() => {
        store.addItem({ id: '1', parent: null, label: 'Duplicate' });
      }).toThrow('Элемент с id 1 уже существует');
    });

    it('should throw error when parent does not exist', () => {
      const store = useTreeStore();
      store.initialize([{ id: '1', parent: null, label: 'Root' }]);

      expect(() => {
        store.addItem({ id: '2', parent: '999', label: 'Child' });
      }).toThrow('Родитель с id 999 не найден');
    });
  });

  describe('removeItem', () => {
    it('should remove item and all its children', () => {
      const store = useTreeStore();
      store.initialize([
        { id: '1', parent: null, label: 'Root' },
        { id: '2', parent: '1', label: 'Child 1' },
        { id: '3', parent: '1', label: 'Child 2' },
        { id: '4', parent: '2', label: 'Grandchild' }
      ]);

      store.removeItem('2');
      expect(store.items).toHaveLength(2);
      expect(store.getItemById('2')).toBeUndefined();
      expect(store.getItemById('4')).toBeUndefined();
    });

    it('should throw error when removing non-existent item', () => {
      const store = useTreeStore();
      store.initialize([{ id: '1', parent: null, label: 'Root' }]);

      expect(() => {
        store.removeItem('999');
      }).toThrow('Элемент с id 999 не найден');
    });
  });

  describe('updateItem', () => {
    it('should update existing item', () => {
      const store = useTreeStore();
      store.initialize([
        { id: '1', parent: null, label: 'Root' },
        { id: '2', parent: '1', label: 'Child' }
      ]);

      store.updateItem({ id: '2', parent: '1', label: 'Updated Child' });
      const updatedItem = store.getItemById('2');
      expect(updatedItem?.label).toBe('Updated Child');
    });

    it('should throw error when updating non-existent item', () => {
      const store = useTreeStore();
      store.initialize([{ id: '1', parent: null, label: 'Root' }]);

      expect(() => {
        store.updateItem({ id: '999', parent: null, label: 'New' });
      }).toThrow('Элемент с id 999 не найден');
    });

    it('should throw error when new parent does not exist', () => {
      const store = useTreeStore();
      store.initialize([
        { id: '1', parent: null, label: 'Root' },
        { id: '2', parent: '1', label: 'Child' }
      ]);

      expect(() => {
        store.updateItem({ id: '2', parent: '999', label: 'Child' });
      }).toThrow('Новый родитель с id 999 не найден');
    });

    it('should throw error when creating circular dependency', () => {
      const store = useTreeStore();
      store.initialize([
        { id: '1', parent: null, label: 'Root' },
        { id: '2', parent: '1', label: 'Child' }
      ]);

      expect(() => {
        store.updateItem({ id: '1', parent: '2', label: 'Root' });
      }).toThrow('Невозможно установить родителем потомка');
    });
  });
}); 