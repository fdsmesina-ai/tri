import { db, storage, auth } from './firebase';
import { StoredImage } from '../types';

// Helper to ensure user is signed in (required for most Firebase rules)
const ensureAuth = async () => {
  if (!auth.currentUser) {
    await auth.signInAnonymously();
  }
  return auth.currentUser;
};

export const saveImage = async (image: StoredImage): Promise<void> => {
  await ensureAuth();

  if (!image.blob) {
    throw new Error("Cannot save image without data (blob)");
  }

  // 1. Upload file to Firebase Storage
  const storageRef = storage.ref(`images/${image.id}`);
  await storageRef.put(image.blob);
  const downloadUrl = await storageRef.getDownloadURL();

  // 2. Prepare metadata (exclude large blob object)
  const { blob, ...metadata } = image;
  const firestoreData = {
    ...metadata,
    url: downloadUrl,
    // Store as plain number or Firestore Timestamp if preferred. 
    // Keeping number for compatibility with existing types.
    createdAt: image.createdAt 
  };

  // 3. Save metadata to Firestore
  await db.collection('images').doc(image.id).set(firestoreData);
};

export const getImages = async (): Promise<StoredImage[]> => {
  await ensureAuth();

  // Query Firestore collection
  const querySnapshot = await db.collection('images').orderBy('createdAt', 'desc').get();

  const results: StoredImage[] = [];
  querySnapshot.forEach((doc) => {
    // Cast the data to StoredImage (runtime validation recommended for prod)
    results.push(doc.data() as StoredImage);
  });

  return results;
};

export const deleteImage = async (id: string): Promise<void> => {
  await ensureAuth();

  // 1. Delete from Firestore
  await db.collection('images').doc(id).delete();

  // 2. Delete from Storage
  // Note: If you have strict rules or the file is missing, this might fail.
  // We'll wrap in try-catch to allow deleting the record even if the file is missing.
  try {
    const storageRef = storage.ref(`images/${id}`);
    await storageRef.delete();
  } catch (e) {
    console.warn("Could not delete file from storage (might not exist):", e);
  }
};