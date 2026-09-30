// localDb.js

const dummyUsers = [
    { id: '1', name: 'John Doe', email: 'john.doe@example.com', phone: '123-456-7890', address: '123 Main St' },
    { id: '2', name: 'Jane Smith', email: 'jane.smith@example.com', phone: '456-789-0123', address: '456 Oak St' },
    { id: '3', name: 'Alice Johnson', email: 'alice.johnson@example.com', phone: '789-012-3456', address: '789 Pine St' },
  ];
  
  export const getAllUsers = async () => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(dummyUsers);
      }, 1000); // Simulate network delay
    });
  };
  
  export const getUserById = async (id) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const user = dummyUsers.find(user => user.id === id);
        if (user) {
          resolve(user);
        } else {
          reject(new Error('User not found'));
        }
      }, 1000); // Simulate network delay
    });
  };
  