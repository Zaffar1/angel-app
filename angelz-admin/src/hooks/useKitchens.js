import { useState, useEffect, useCallback } from 'react';
import { addKitchen, updateKitchen, deleteKitchen, getKitchens } from '../utils/Api';
import { useSelector } from 'react-redux';

const useKitchens = () => {
  const [kitchens, setKitchens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchKitchens = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getKitchens();
      setKitchens(data);
    } catch (error) {
      setError(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchKitchens();
  }, [fetchKitchens]);

  const addNewKitchen = async (kitchen) => {
    try {
      setLoading(true);
      const newKitchen = await addKitchen(kitchen);
      setKitchens((prev) => [...prev, newKitchen]);
    } catch (error) {
      setError(error);
    } finally {
      setLoading(false);
    }
  };

  const updateExistingKitchen = async (id, kitchen) => {
    try {
      setLoading(true);
      const updatedKitchen = await updateKitchen(id, kitchen);
      setKitchens((prev) =>
        prev.map((f) => (f.id === id ? updatedKitchen : f))
      );
    } catch (error) {
      setError(error);
    } finally {
      setLoading(false);
    }
  };

  const deleteExistingKitchen = async (id) => {
    try {
      setLoading(true);
      await deleteKitchen(id);
      setKitchens((prev) => prev.filter((f) => f.id !== id));
    } catch (error) {
      setError(error);
    } finally {
      setLoading(false);
    }
  };

  // Add refetchKitchens method
  const refetchKitchens = useCallback(() => {
    fetchKitchens();
  }, [fetchKitchens]);

  return { kitchens, loading, error, addNewKitchen, updateExistingKitchen, deleteExistingKitchen, refetchKitchens };
};

export default useKitchens;
