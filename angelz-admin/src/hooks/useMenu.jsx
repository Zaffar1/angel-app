import { useState, useEffect, useCallback } from 'react';
import { addMenu, updateMenu, deleteMenu, getMenus } from '../utils/Api';
import { useSelector } from 'react-redux';

const useMenu = () => {
  const [menus, setMenus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchMenus = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getMenus();
      setMenus(data);
    } catch (error) {
      setError(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMenus();
  }, [fetchMenus]);

  const addNewMenu = async (menu) => {
    try {
      setLoading(true);
      const newMenu = await addMenu(menu);
      setMenus((prev) => [...prev, newMenu]);
    } catch (error) {
      setError(error);
    } finally {
      setLoading(false);
    }
  };

  const updateExistingMenu = async (id, menu) => {
    try {
      setLoading(true);
      const updatedMenu = await updateMenu(id, menu);
      setMenus((prev) =>
        prev.map((m) => (m.id === id ? updatedMenu : m))
      );
    } catch (error) {
      setError(error);
    } finally {
      setLoading(false);
    }
  };

  const deleteExistingMenu = async (id) => {
    try {
      setLoading(true);
      await deleteMenu(id);
      setMenus((prev) => prev.filter((m) => m.id !== id));
    } catch (error) {
      setError(error);
    } finally {
      setLoading(false);
    }
  };

  const refetchMenus = useCallback(() => {
    fetchMenus();
  }, [fetchMenus]);

  return { menus, loading, error, addNewMenu, updateExistingMenu, deleteExistingMenu, refetchMenus };
};

export default useMenu;
