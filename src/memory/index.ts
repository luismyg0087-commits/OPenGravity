import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { config } from '../config.js';

// Initialize Firebase Admin SDK
let credential;
if (config.FIREBASE_SERVICE_ACCOUNT_JSON) {
  try {
    credential = cert(JSON.parse(config.FIREBASE_SERVICE_ACCOUNT_JSON));
  } catch (e) {
    console.error("❌ Error parsing FIREBASE_SERVICE_ACCOUNT_JSON:", e);
    credential = cert(config.FIREBASE_SERVICE_ACCOUNT_PATH);
  }
} else {
  credential = cert(config.FIREBASE_SERVICE_ACCOUNT_PATH);
}

initializeApp({ credential });

const db = getFirestore();
const messagesCollection = db.collection('messages');

export type MessageRow = {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  name?: string | null;
  tool_call_id?: string | null;
  created_at?: any;
};

export const memory = {
  async addMessage(userId: number, msg: MessageRow) {
    console.log(`💾 Saving message to Firestore for user ${userId}: ${msg.role}`);
    await messagesCollection.add({
      user_id: userId,
      role: msg.role,
      content: msg.content || '',
      name: msg.name || null,
      tool_call_id: msg.tool_call_id || null,
      created_at: FieldValue.serverTimestamp(),
    });
  },
  
  async getMessages(userId: number, limit: number = 50): Promise<MessageRow[]> {
    const snapshot = await messagesCollection
      .where('user_id', '==', userId)
      .orderBy('created_at', 'desc')
      .limit(limit)
      .get();

    const rows = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        role: data.role as MessageRow['role'],
        content: data.content,
        name: data.name,
        tool_call_id: data.tool_call_id,
        created_at: data.created_at,
      };
    });

    return rows.reverse().map(row => ({
      ...row,
      created_at: undefined // Clean up if needed before passing to LLM
    }));
  },

  async clearMessages(userId: number) {
    const snapshot = await messagesCollection
      .where('user_id', '==', userId)
      .get();
      
    const batch = db.batch();
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });
    
    await batch.commit();
  }
};
