import { db } from "../firebase-config.js";
import {
  doc, getDoc, setDoc, updateDoc, deleteDoc, writeBatch,
  collection, addDoc, onSnapshot, serverTimestamp,
  query, where, getDocs
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

export { db, doc, getDoc, setDoc, updateDoc, deleteDoc, writeBatch,
         collection, addDoc, onSnapshot, serverTimestamp,
         query, where, getDocs };
