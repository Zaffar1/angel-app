import { useState, useEffect, useCallback } from 'react';
import { getFacilities, addFacility, updateFacility, deleteFacility } from '../utils/Api';
import { useSelector } from 'react-redux';

const useFacilities = () => {
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const token = useSelector((state) => state.auth.userData?.token);

  const fetchFacilities = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getFacilities(); // No need to pass token
      console.log('Fetched facilities:', data); // Debugging
      setFacilities(data);
    } catch (error) {
      console.error('Error fetching facilities:', error); // Debugging
      setError(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFacilities();
  }, [fetchFacilities]);

  const addNewFacility = async (facility) => {
    try {
      setLoading(true);
      const newFacility = await addFacility(facility);
      console.log('New facility added:', newFacility); // Debugging
      setFacilities((prev) => [...prev, newFacility]);
    } catch (error) {
      console.error('Error adding facility:', error); // Debugging
      setError(error);
    } finally {
      setLoading(false);
    }
  };

  const updateExistingFacility = async (id, facility) => {
    try {
      setLoading(true);
      const updatedFacility = await updateFacility(id, facility);
      console.log('Facility updated:', updatedFacility); // Debugging
      setFacilities((prev) =>
        prev.map((f) => (f.id === id ? updatedFacility : f))
      );
    } catch (error) {
      console.error('Error updating facility:', error); // Debugging
      setError(error);
    } finally {
      setLoading(false);
    }
  };

  const deleteExistingFacility = async (id) => {
    try {
      setLoading(true);
      await deleteFacility(id);
      console.log('Facility deleted:', id); // Debugging
      setFacilities((prev) => prev.filter((f) => f.id !== id));
    } catch (error) {
      console.error('Error deleting facility:', error); // Debugging
      setError(error);
    } finally {
      setLoading(false);
    }
  };

  // Add refetchFacilities method
  const refetchFacilities = useCallback(() => {
    fetchFacilities();
  }, [fetchFacilities]);

  return { facilities, loading, error, addNewFacility, updateExistingFacility, deleteExistingFacility, refetchFacilities };
};

export default useFacilities;
