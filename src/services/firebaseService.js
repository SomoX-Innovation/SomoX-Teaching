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
  serverTimestamp,
  getCountFromServer,
  startAfter
} from 'firebase/firestore';
import { db } from '../config/firebase';

// Simple in-memory cache with TTL (Time To Live)
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

const getCacheKey = (collectionName, filters, orderByField, limitCount) => {
  return `${collectionName}_${JSON.stringify(filters)}_${JSON.stringify(orderByField)}_${limitCount}`;
};

const getCachedData = (key) => {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  cache.delete(key);
  return null;
};

const setCachedData = (key, data) => {
  cache.set(key, { data, timestamp: Date.now() });
};

// Clear cache for a specific collection
export const clearCache = (collectionName = null) => {
  if (collectionName) {
    for (const key of cache.keys()) {
      if (key.startsWith(collectionName + '_')) {
        cache.delete(key);
      }
    }
  } else {
    cache.clear();
  }
};

// Generic CRUD operations
export const createDocument = async (collectionName, data) => {
  try {
    console.log(`Creating document in ${collectionName} collection with data:`, data);
    
    const docRef = await addDoc(collection(db, collectionName), {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    console.log(`Document created successfully in ${collectionName} with ID:`, docRef.id);
    return docRef.id;
  } catch (error) {
    console.error(`Error creating document in ${collectionName}:`, error);
    console.error('Error details:', {
      code: error.code,
      message: error.message,
      stack: error.stack
    });
    throw error;
  }
};

// Get count of documents (optimized - doesn't fetch all documents)
export const getDocumentCount = async (collectionName, filters = []) => {
  try {
    let q = query(collection(db, collectionName));
    
    // Apply filters
    if (filters && filters.length > 0) {
      filters.forEach(filter => {
        q = query(q, where(filter.field, filter.operator, filter.value));
      });
    }
    
    // Use getCountFromServer for efficient counting (Firebase v9+)
    try {
      const snapshot = await getCountFromServer(q);
      return snapshot.data().count;
    } catch (countError) {
      // Fallback: if getCountFromServer is not available, use a limited query
      console.warn('getCountFromServer not available, using fallback method');
      const snapshot = await getDocs(q);
      return snapshot.size;
    }
  } catch (error) {
    console.error(`Error getting document count from ${collectionName}:`, error);
    return 0;
  }
};

export const getDocuments = async (collectionName, filters = [], orderByField = null, limitCount = null, useCache = true) => {
  // Define cacheKey at function scope so it's available in catch block
  const cacheKey = getCacheKey(collectionName, filters, orderByField, limitCount);
  
  try {
    // Check cache first
    if (useCache) {
      const cached = getCachedData(cacheKey);
      if (cached) {
        console.log(`✅ Loaded ${cached.length} documents from cache (${collectionName})`);
        return cached;
      }
    }
    
    let q = query(collection(db, collectionName));
    
    // Apply filters
    if (filters && filters.length > 0) {
      filters.forEach(filter => {
        q = query(q, where(filter.field, filter.operator, filter.value));
      });
    }
    
    // Apply ordering (with fallback if orderBy fails)
    if (orderByField && orderByField.field) {
      try {
        q = query(q, orderBy(orderByField.field, orderByField.direction || 'asc'));
      } catch (orderError) {
        console.warn(`Could not apply orderBy for ${collectionName} on field ${orderByField.field}:`, orderError);
        // Continue without ordering
      }
    }
    
    // Apply limit (default to 50 if no limit specified to prevent loading too much)
    const finalLimit = limitCount || 50;
    q = query(q, limit(finalLimit));
    
    const querySnapshot = await getDocs(q);
    const documents = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // Cache the results
    if (useCache) {
      setCachedData(cacheKey, documents);
    }
    
    console.log(`✅ Loaded ${documents.length} documents from ${collectionName} collection`);
    return documents;
  } catch (error) {
    console.error(`❌ Error getting documents from ${collectionName}:`, error);
    console.error('Error details:', {
      code: error.code,
      message: error.message,
      collection: collectionName,
      filters: filters,
      orderBy: orderByField
    });
    
    // If permission denied, return empty array instead of throwing (for better UX)
    if (error.code === 'permission-denied') {
      console.warn(`⚠️ Permission denied for ${collectionName}, returning empty array`);
      return [];
    }
    
    // If orderBy fails, try without it
    if (error.code === 'failed-precondition' || error.message?.includes('index')) {
      console.log(`⚠️ Retrying ${collectionName} without orderBy...`);
      try {
        let q = query(collection(db, collectionName));
        if (filters && filters.length > 0) {
          filters.forEach(filter => {
            q = query(q, where(filter.field, filter.operator, filter.value));
          });
        }
        const finalLimit = limitCount || 50;
        q = query(q, limit(finalLimit));
        const querySnapshot = await getDocs(q);
        const documents = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        console.log(`✅ Loaded ${documents.length} documents from ${collectionName} (without orderBy)`);
        // Cache the results
        if (useCache) {
          setCachedData(cacheKey, documents);
        }
        return documents;
      } catch (retryError) {
        // If retry also fails with permission error, return empty array instead of throwing
        if (retryError.code === 'permission-denied') {
          console.warn(`⚠️ Permission denied for ${collectionName} (retry), returning empty array`);
          return [];
        }
        console.error(`❌ Retry also failed for ${collectionName}:`, retryError);
        throw retryError;
      }
    }
    
    throw error;
  }
};

// Paginated query support
export const getDocumentsPaginated = async (
  collectionName, 
  filters = [], 
  orderByField = null, 
  pageSize = 20,
  lastDoc = null
) => {
  try {
    let q = query(collection(db, collectionName));
    
    // Apply filters
    if (filters && filters.length > 0) {
      filters.forEach(filter => {
        q = query(q, where(filter.field, filter.operator, filter.value));
      });
    }
    
    // Apply ordering
    if (orderByField && orderByField.field) {
      q = query(q, orderBy(orderByField.field, orderByField.direction || 'asc'));
    }
    
    // Apply pagination
    if (lastDoc) {
      q = query(q, startAfter(lastDoc));
    }
    q = query(q, limit(pageSize));
    
    const querySnapshot = await getDocs(q);
    const documents = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    return {
      documents,
      lastDoc: querySnapshot.docs[querySnapshot.docs.length - 1] || null,
      hasMore: querySnapshot.docs.length === pageSize
    };
  } catch (error) {
    console.error(`Error getting paginated documents from ${collectionName}:`, error);
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
  getAll: (limitCount = null, organizationId = null, useCache = true) => {
    const filters = organizationId ? [{ field: 'organizationId', operator: '==', value: organizationId }] : [];
    return getDocuments('users', filters, { field: 'createdAt', direction: 'desc' }, limitCount, useCache);
  },
  getCount: (organizationId = null) => {
    const filters = organizationId ? [{ field: 'organizationId', operator: '==', value: organizationId }] : [];
    return getDocumentCount('users', filters);
  },
  getCountByRole: (role, organizationId = null) => {
    const filters = [
      { field: 'role', operator: '==', value: role.toLowerCase() }
    ];
    if (organizationId) {
      filters.push({ field: 'organizationId', operator: '==', value: organizationId });
    }
    return getDocumentCount('users', filters);
  },
  getById: (id) => getDocument('users', id),
  create: (userData) => {
    clearCache('users');
    return createDocument('users', userData);
  },
  update: (id, userData) => {
    clearCache('users');
    return updateDocument('users', id, userData);
  },
  delete: (id) => {
    clearCache('users');
    return deleteDocument('users', id);
  },
  getByRole: (role, limitCount = null, organizationId = null, useCache = true) => {
    const filters = [{ field: 'role', operator: '==', value: role.toLowerCase() }];
    if (organizationId) {
      filters.push({ field: 'organizationId', operator: '==', value: organizationId });
    }
    return getDocuments('users', filters, null, limitCount, useCache);
  },
  getByStatus: (status, limitCount = null, organizationId = null) => {
    const filters = [{ field: 'status', operator: '==', value: status }];
    if (organizationId) {
      filters.push({ field: 'organizationId', operator: '==', value: organizationId });
    }
    return getDocuments('users', filters, null, limitCount);
  },
  getByOrganization: (organizationId, limitCount = null) => {
    return getDocuments('users', [{ field: 'organizationId', operator: '==', value: organizationId }], { field: 'createdAt', direction: 'desc' }, limitCount);
  },
  getPaginated: (pageSize = 20, lastDoc = null, filters = []) => getDocumentsPaginated('users', filters, { field: 'createdAt', direction: 'desc' }, pageSize, lastDoc)
};

// Courses Service
export const coursesService = {
  getAll: (limitCount = null, organizationId = null, useCache = true) => {
    const filters = organizationId ? [{ field: 'organizationId', operator: '==', value: organizationId }] : [];
    // Don't use orderBy to avoid index requirement - we can sort client-side if needed
    return getDocuments('courses', filters, null, limitCount, useCache);
  },
  getCount: (organizationId = null) => {
    const filters = organizationId ? [{ field: 'organizationId', operator: '==', value: organizationId }] : [];
    return getDocumentCount('courses', filters);
  },
  getById: (id) => getDocument('courses', id),
  create: (courseData) => {
    clearCache('courses');
    return createDocument('courses', courseData);
  },
  update: (id, courseData) => {
    clearCache('courses');
    return updateDocument('courses', id, courseData);
  },
  delete: (id) => {
    clearCache('courses');
    return deleteDocument('courses', id);
  },
  getByStatus: (status, limitCount = null, organizationId = null) => {
    const filters = [{ field: 'status', operator: '==', value: status }];
    if (organizationId) {
      filters.push({ field: 'organizationId', operator: '==', value: organizationId });
    }
    return getDocuments('courses', filters, null, limitCount);
  }
};

// Recordings Service
export const recordingsService = {
  getAll: (limitCount = null, organizationId = null) => {
    const filters = organizationId ? [{ field: 'organizationId', operator: '==', value: organizationId }] : [];
    return getDocuments('recordings', filters, { field: 'createdAt', direction: 'desc' }, limitCount);
  },
  getCount: (organizationId = null) => {
    const filters = organizationId ? [{ field: 'organizationId', operator: '==', value: organizationId }] : [];
    return getDocumentCount('recordings', filters);
  },
  getById: (id) => getDocument('recordings', id),
  create: (recordingData) => {
    clearCache('recordings');
    return createDocument('recordings', recordingData);
  },
  update: (id, recordingData) => {
    clearCache('recordings');
    return updateDocument('recordings', id, recordingData);
  },
  delete: (id) => {
    clearCache('recordings');
    return deleteDocument('recordings', id);
  },
  getByMonth: (month, limitCount = null, organizationId = null) => {
    const filters = [{ field: 'month', operator: '==', value: month }];
    if (organizationId) {
      filters.push({ field: 'organizationId', operator: '==', value: organizationId });
    }
    return getDocuments('recordings', filters, { field: 'date', direction: 'asc' }, limitCount);
  },
  getActive: (limitCount = 10, organizationId = null) => {
    const filters = [{ field: 'status', operator: '==', value: 'active' }];
    if (organizationId) {
      filters.push({ field: 'organizationId', operator: '==', value: organizationId });
    }
    return getDocuments('recordings', filters, { field: 'createdAt', direction: 'desc' }, limitCount);
  }
};

// Tasks Service
export const tasksService = {
  getAll: (limitCount = null, organizationId = null) => {
    const filters = organizationId ? [{ field: 'organizationId', operator: '==', value: organizationId }] : [];
    return getDocuments('tasks', filters, { field: 'createdAt', direction: 'desc' }, limitCount);
  },
  getCount: (organizationId = null) => {
    const filters = organizationId ? [{ field: 'organizationId', operator: '==', value: organizationId }] : [];
    return getDocumentCount('tasks', filters);
  },
  getById: (id) => getDocument('tasks', id),
  create: (taskData) => {
    clearCache('tasks');
    return createDocument('tasks', taskData);
  },
  update: (id, taskData) => {
    clearCache('tasks');
    return updateDocument('tasks', id, taskData);
  },
  delete: (id) => {
    clearCache('tasks');
    return deleteDocument('tasks', id);
  },
  getByStatus: (status, limitCount = null, organizationId = null) => {
    const filters = [{ field: 'status', operator: '==', value: status }];
    if (organizationId) {
      filters.push({ field: 'organizationId', operator: '==', value: organizationId });
    }
    return getDocuments('tasks', filters, null, limitCount);
  },
  getByUser: (userId, limitCount = 50) => getDocuments('tasks', [{ field: 'userId', operator: '==', value: userId }], { field: 'createdAt', direction: 'desc' }, limitCount)
};

// Blog Posts Service
export const blogService = {
  getAll: (limitCount = null, organizationId = null) => {
    const filters = organizationId ? [{ field: 'organizationId', operator: '==', value: organizationId }] : [];
    return getDocuments('blogPosts', filters, { field: 'createdAt', direction: 'desc' }, limitCount);
  },
  getCount: (organizationId = null) => {
    const filters = organizationId ? [{ field: 'organizationId', operator: '==', value: organizationId }] : [];
    return getDocumentCount('blogPosts', filters);
  },
  getById: (id) => getDocument('blogPosts', id),
  create: (postData) => {
    clearCache('blogPosts');
    return createDocument('blogPosts', postData);
  },
  update: (id, postData) => {
    clearCache('blogPosts');
    return updateDocument('blogPosts', id, postData);
  },
  delete: (id) => {
    clearCache('blogPosts');
    return deleteDocument('blogPosts', id);
  },
  getPublished: (limitCount = null, organizationId = null) => {
    const filters = [{ field: 'status', operator: '==', value: 'published' }];
    if (organizationId) {
      filters.push({ field: 'organizationId', operator: '==', value: organizationId });
    }
    return getDocuments('blogPosts', filters, null, limitCount);
  }
};

// Payments Service
export const paymentsService = {
  getAll: (limitCount = null, organizationId = null) => {
    const filters = organizationId ? [{ field: 'organizationId', operator: '==', value: organizationId }] : [];
    return getDocuments('payments', filters, { field: 'createdAt', direction: 'desc' }, limitCount);
  },
  getCount: (organizationId = null) => {
    const filters = organizationId ? [{ field: 'organizationId', operator: '==', value: organizationId }] : [];
    return getDocumentCount('payments', filters);
  },
  getCountByStatus: (status, organizationId = null) => {
    const filters = [{ field: 'status', operator: '==', value: status }];
    if (organizationId) {
      filters.push({ field: 'organizationId', operator: '==', value: organizationId });
    }
    return getDocumentCount('payments', filters);
  },
  getById: (id) => getDocument('payments', id),
  create: (paymentData) => {
    clearCache('payments');
    return createDocument('payments', paymentData);
  },
  update: (id, paymentData) => {
    clearCache('payments');
    return updateDocument('payments', id, paymentData);
  },
  getByStatus: (status, limitCount = null, organizationId = null) => {
    const filters = [{ field: 'status', operator: '==', value: status }];
    if (organizationId) {
      filters.push({ field: 'organizationId', operator: '==', value: organizationId });
    }
    return getDocuments('payments', filters, null, limitCount);
  },
  getByUser: (userId, limitCount = 50) => getDocuments('payments', [{ field: 'userId', operator: '==', value: userId }], null, limitCount)
};

// Zoom Sessions Service
export const zoomSessionsService = {
  getAll: (limitCount = null, organizationId = null) => {
    const filters = organizationId ? [{ field: 'organizationId', operator: '==', value: organizationId }] : [];
    return getDocuments('zoomSessions', filters, { field: 'date', direction: 'desc' }, limitCount);
  },
  getById: (id) => getDocument('zoomSessions', id),
  create: (sessionData) => {
    clearCache('zoomSessions');
    return createDocument('zoomSessions', sessionData);
  },
  update: (id, sessionData) => {
    clearCache('zoomSessions');
    return updateDocument('zoomSessions', id, sessionData);
  },
  delete: (id) => {
    clearCache('zoomSessions');
    return deleteDocument('zoomSessions', id);
  },
  getByStatus: (status, limitCount = null, organizationId = null) => {
    const filters = [{ field: 'status', operator: '==', value: status }];
    if (organizationId) {
      filters.push({ field: 'organizationId', operator: '==', value: organizationId });
    }
    return getDocuments('zoomSessions', filters, { field: 'date', direction: 'asc' }, limitCount);
  },
  getUpcoming: (limitCount = 10, organizationId = null) => {
    const filters = [{ field: 'status', operator: '==', value: 'upcoming' }];
    if (organizationId) {
      filters.push({ field: 'organizationId', operator: '==', value: organizationId });
    }
    return getDocuments('zoomSessions', filters, { field: 'date', direction: 'asc' }, limitCount);
  }
};

// Batches Service
export const batchesService = {
  getAll: (limitCount = null, organizationId = null) => {
    const filters = organizationId ? [{ field: 'organizationId', operator: '==', value: organizationId }] : [];
    return getDocuments('batches', filters, { field: 'createdAt', direction: 'desc' }, limitCount);
  },
  getCount: (organizationId = null) => {
    const filters = organizationId ? [{ field: 'organizationId', operator: '==', value: organizationId }] : [];
    return getDocumentCount('batches', filters);
  },
  getById: (id) => getDocument('batches', id),
  create: (batchData) => {
    clearCache('batches');
    return createDocument('batches', batchData);
  },
  update: (id, batchData) => {
    clearCache('batches');
    return updateDocument('batches', id, batchData);
  },
  delete: (id) => {
    clearCache('batches');
    return deleteDocument('batches', id);
  },
  getByCourse: (courseId, limitCount = null) => getDocuments('batches', [{ field: 'courseId', operator: '==', value: courseId }], { field: 'number', direction: 'asc' }, limitCount),
  getByStatus: (status, limitCount = null, organizationId = null) => {
    const filters = [{ field: 'status', operator: '==', value: status }];
    if (organizationId) {
      filters.push({ field: 'organizationId', operator: '==', value: organizationId });
    }
    return getDocuments('batches', filters, null, limitCount);
  }
};


