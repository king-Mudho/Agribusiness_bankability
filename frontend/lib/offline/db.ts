import { type DBSchema, type IDBPDatabase, openDB } from "idb";

export interface WizardResponse {
  questionCode: string;
  scaleValue: number;
}

export interface WizardGate {
  gateCode: string;
  result: "PASS" | "CAUTION" | "NOT_MET";
  note?: string;
}

export interface WizardEvidence {
  questionCode?: string;
  dimensionCode?: string;
  evidenceLevel: number;
  description?: string;
}

export interface DraftAssessment {
  assessmentId: string;
  enterpriseId: string | null;
  enterpriseDraft: Record<string, unknown>;
  consentGiven: boolean;
  frameworkVersionLabel: string | null;
  currentStep: number;
  responses: Record<string, WizardResponse>;
  gates: Record<string, WizardGate>;
  evidence: Record<string, WizardEvidence>;
  updatedAt: number;
}

export type SyncOperationType = "responses" | "gates" | "evidence" | "submit";

export interface SyncQueueItem {
  id?: number;
  assessmentId: string;
  type: SyncOperationType;
  payload: unknown;
  createdAt: number;
}

interface AbiOfflineDB extends DBSchema {
  draftAssessments: {
    key: string;
    value: DraftAssessment;
  };
  syncQueue: {
    key: number;
    value: SyncQueueItem;
    indexes: { "by-assessment": string };
  };
}

const DB_NAME = "abi-offline";
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<AbiOfflineDB>> | null = null;

export function getDb(): Promise<IDBPDatabase<AbiOfflineDB>> {
  if (typeof indexedDB === "undefined") {
    throw new Error("IndexedDB is not available in this environment.");
  }
  if (!dbPromise) {
    dbPromise = openDB<AbiOfflineDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains("draftAssessments")) {
          db.createObjectStore("draftAssessments", { keyPath: "assessmentId" });
        }
        if (!db.objectStoreNames.contains("syncQueue")) {
          const store = db.createObjectStore("syncQueue", {
            keyPath: "id",
            autoIncrement: true,
          });
          store.createIndex("by-assessment", "assessmentId");
        }
      },
    });
  }
  return dbPromise;
}
