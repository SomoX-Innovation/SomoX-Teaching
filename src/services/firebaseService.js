import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';

// Generic CRUD operations
export const createDocument = async (collectionName, data) => {
  try {
    const docRef = await addDoc(collection(db, collectionName), {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    console.error(`Error creating document in ${collectionName}:`, error);
    throw error;
  }
};

export const getDocuments = async (collectionName, filters = [], orderByField = null, limitCount = null) => {
  try {
    let q = collection(db, collectionName);
    
    // Apply filters
    filters.forEach(filter => {
      q = query(q, where(filter.field, filter.operator, filter.value));
    });
    
    // Apply ordering
    if (orderByField) {
      q = query(q, orderBy(orderByField.field, orderByField.direction || 'asc'));
    }
    
    // Apply limit
    if (limitCount) {
      q = query(q, limit(limitCount));
    }
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error(`Error getting documents from ${collectionName}:`, error);
    throw error;
  }
};

export const getDocument = async (collectionName, docId) => {
  try {
    const docRef = doc(db, collectionName, docId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data()
      };
    } else {
      throw new Error('Document not found');
    }
  } catch (error) {
    console.error(`Error getting document from ${collectionName}:`, error);
    throw error;
  }
};

export const updateDocument = async (collectionName, docId, data) => {
  try {
    const docRef = doc(db, collectionName, docId);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp()
    });
    return true;
  } catch (error) {
    console.error(`Error updating document in ${collectionName}:`, error);
    throw error;
  }
};

export const deleteDocument = async (collectionName, docId) => {
  try {
    const docRef = doc(db, collectionName, docId);
    await deleteDoc(docRef);
    return true;
  } catch (error) {
    console.error(`Error deleting document from ${collectionName}:`, error);
    throw error;
  }
};

// Users Service
export const usersService = {
  getAll: () => getDocuments('users', [], { field: 'createdAt', direction: 'desc' }),
  getById: (id) => getDocument('users', id),
  create: (userData) => createDocument('users', userData),
  update: (id, userData) => updateDocument('users', id, userData),
  delete: (id) => deleteDocument('users', id),
  getByRole: (role) => getDocuments('users', [{ field: 'role', operator: '==', value: role }]),
  getByStatus: (status) => getDocuments('users', [{ field: 'status', operator: '==', value: status }])
};

// Courses Service
export const coursesService = {
  getAll: () => getDocuments('courses', [], { field: 'createdAt', direction: 'desc' }),
  getById: (id) => getDocument('courses', id),
  create: (courseData) => createDocument('courses', courseData),
  update: (id, courseData) => updateDocument('courses', id, courseData),
  delete: (id) => deleteDocument('courses', id),
  getByStatus: (status) => getDocuments('courses', [{ field: 'status', operator: '==', value: status }])
};

// Recordings Service
export const recordingsService = {
  getAll: () => getDocuments('recordings', [], { field: 'createdAt', direction: 'desc' }),
  getById: (id) => getDocument('recordings', id),
  create: (recordingData) => createDocument('recordings', recordingData),
  update: (id, recordingData) => updateDocument('recordings', id, recordingData),
  delete: (id) => deleteDocument('recordings', id),
  getByMonth: (month) => getDocuments('recordings', [{ field: 'month', operator: '==', value: month }], { field: 'date', direction: 'asc' }),
  getActive: () => getDocuments('recordings', [{ field: 'status', operator: '==', value: 'active' }], { field: 'createdAt', direction: 'desc' })
};

// Tasks Service
export const tasksService = {
  getAll: () => getDocuments('tasks', [], { field: 'createdAt', direction: 'desc' }),
  getById: (id) => getDocument('tasks', id),
  create: (taskData) => createDocument('tasks', taskData),
  update: (id, taskData) => updateDocument('tasks', id, taskData),
  delete: (id) => deleteDocument('tasks', id),
  getByStatus: (status) => getDocuments('tasks', [{ field: 'status', operator: '==', value: status }]),
  getByUser: (userId) => getDocuments('tasks', [{ field: 'userId', operator: '==', value: userId }], { field: 'createdAt', direction: 'desc' })
};

// Blog Posts Service
export const blogService = {
  getAll: () => getDocuments('blogPosts', [], { field: 'createdAt', direction: 'desc' }),
  getById: (id) => getDocument('blogPosts', id),
  create: (postData) => createDocument('blogPosts', postData),
  update: (id, postData) => updateDocument('blogPosts', id, postData),
  delete: (id) => deleteDocument('blogPosts', id),
  getPublished: () => getDocuments('blogPosts', [{ field: 'status', operator: '==', value: 'published' }])
};

// Payments Service
export const paymentsService = {
  getAll: () => getDocuments('payments', [], { field: 'createdAt', direction: 'desc' }),
  getById: (id) => getDocument('payments', id),
  create: (paymentData) => createDocument('payments', paymentData),
  update: (id, paymentData) => updateDocument('payments', id, paymentData),
  getByStatus: (status) => getDocuments('payments', [{ field: 'status', operator: '==', value: status }]),
  getByUser: (userId) => getDocuments('payments', [{ field: 'userId', operator: '==', value: userId }])
};

// Zoom Sessions Service
export const zoomSessionsService = {
  getAll: () => getDocuments('zoomSessions', [], { field: 'date', direction: 'desc' }),
  getById: (id) => getDocument('zoomSessions', id),
  create: (sessionData) => createDocument('zoomSessions', sessionData),
  update: (id, sessionData) => updateDocument('zoomSessions', id, sessionData),
  delete: (id) => deleteDocument('zoomSessions', id),
  getByStatus: (status) => getDocuments('zoomSessions', [{ field: 'status', operator: '==', value: status }], { field: 'date', direction: 'asc' }),
  getUpcoming: () => getDocuments('zoomSessions', [{ field: 'status', operator: '==', value: 'upcoming' }], { field: 'date', direction: 'asc' })
};


