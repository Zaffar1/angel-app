import { useState, useEffect, useCallback } from 'react';
import { addAtmosphere, updateAtmosphere, deleteAtmosphere, getAtmospheres } from '../utils/Api';
import { useSelector } from 'react-redux';

const useAtmospheres = () => {
  const [atmospheres, setAtmospheres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAtmospheres = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getAtmospheres();
      setAtmospheres(data);
    } catch (error) {
      setError(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAtmospheres();
  }, [fetchAtmospheres]);

  const addNewAtmosphere = async (atmosphere) => {
    try {
      setLoading(true);
      const newAtmosphere = await addAtmosphere(atmosphere);
      setAtmospheres((prev) => [...prev, newAtmosphere]);
    } catch (error) {
      setError(error);
    } finally {
      setLoading(false);
    }
  };

  const updateExistingAtmosphere = async (id, atmosphere) => {
    try {
      setLoading(true);
      const updatedAtmosphere = await updateAtmosphere(id, atmosphere);
      setAtmospheres((prev) =>
        prev.map((a) => (a.id === id ? updatedAtmosphere : a))
      );
    } catch (error) {
      setError(error);
    } finally {
      setLoading(false);
    }
  };

  const deleteExistingAtmosphere = async (id) => {
    try {
      setLoading(true);
      await deleteAtmosphere(id);
      setAtmospheres((prev) => prev.filter((a) => a.id !== id));
    } catch (error) {
      setError(error);
    } finally {
      setLoading(false);
    }
  };

  // Add refetchAtmospheres method
  const refetchAtmospheres = useCallback(() => {
    fetchAtmospheres();
  }, [fetchAtmospheres]);

  return { atmospheres, loading, error, addNewAtmosphere, updateExistingAtmosphere, deleteExistingAtmosphere, refetchAtmospheres };
};

export default useAtmospheres;
