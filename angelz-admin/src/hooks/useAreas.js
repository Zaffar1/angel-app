import { useState, useEffect, useCallback } from 'react';
import { addArea, updateArea, deleteArea, getAreas } from '../utils/Api';
import { useSelector } from 'react-redux';

const useAreas = () => {
  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchareas = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getAreas();
      setAreas(data);
    } catch (error) {
      setError(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchareas();
  }, [fetchareas]);

  const addNewArea = async (area) => {
    try {
      setLoading(true);
      const newArea = await addArea(area);
      setAreas((prev) => [...prev, newArea]);
    } catch (error) {
      setError(error);
    } finally {
      setLoading(false);
    }
  };

  const updateExistingArea = async (id, area) => {
    try {
      setLoading(true);
      const updatedArea = await updateArea(id, area);
      setAreas((prev) =>
        prev.map((f) => (f.id === id ? updatedArea : f))
      );
    } catch (error) {
      setError(error);
    } finally {
      setLoading(false);
    }
  };

  const deleteExistingArea = async (id) => {
    try {
      setLoading(true);
      await deleteArea(id);
      setAreas((prev) => prev.filter((f) => f.id !== id));
    } catch (error) {
      setError(error);
    } finally {
      setLoading(false);
    }
  };

  // Add refetchareas method
  const refetchareas = useCallback(() => {
    fetchareas();
  }, [fetchareas]);

  return { areas, loading, error, addNewArea, updateExistingArea, deleteExistingArea, refetchareas };
};

export default useAreas;
