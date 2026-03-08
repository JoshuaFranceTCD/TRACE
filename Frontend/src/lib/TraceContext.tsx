import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Case, Suspect, MOCK_CASES, MOCK_SUSPECTS } from './forensic-data';
import { toast } from 'sonner';

interface AuthState {
  isAuthenticated: boolean;
  operatorId: string | null;
}

interface TraceContextType {
  // Auth
  auth: AuthState;
  login: (operatorId: string) => void;
  logout: () => void;
  
  // Cases
  cases: Case[];
  activeCases: Case[];
  archivedCases: Case[];
  addCase: (newCase: Omit<Case, 'id'>) => void;
  updateCaseStatus: (id: string, status: Case['status']) => void;
  updateCaseAnalysisStatus: (id: string, analysisCompleted: boolean) => void;
  getCaseById: (id: string) => Case | undefined;

  // Suspects
  suspects: Suspect[];
  setSuspects: (newList: Suspect[]) => void;
  updateSuspect: (id: string, updates: Partial<Suspect>) => void;
  getSuspectById: (id: string) => Suspect | undefined;
}

const TraceContext = createContext<TraceContextType | undefined>(undefined);

export function TraceProvider({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useState<AuthState>({
    isAuthenticated: false,
    operatorId: null,
  });

  const [cases, setCases] = useState<Case[]>(MOCK_CASES);
  const [suspects, setSuspects] = useState<Suspect[]>(MOCK_SUSPECTS);

  const login = (operatorId: string) => {
    setAuth({ isAuthenticated: true, operatorId });
    toast.success(`Welcome, Operator ${operatorId}`);
  };

  const logout = () => {
    setAuth({ isAuthenticated: false, operatorId: null });
    toast.info("Logged out successfully");
  };

  const addCase = (newCaseData: Omit<Case, 'id'>) => {
    const newId = `C-${Math.floor(1000 + Math.random() * 9000)}`;
    const newCase: Case = { ...newCaseData, id: newId, analysisCompleted: false };
    setCases(prev => [newCase, ...prev]);
    toast.success(`Case ${newId} created successfully`);
  };

  const updateCaseStatus = (id: string, status: Case['status']) => {
    setCases(prev => prev.map(c => c.id === id ? { ...c, status } : c));
    toast.success(`Case ${id} status updated to ${status}`);
  };

  const updateCaseAnalysisStatus = (id: string, analysisCompleted: boolean) => {
    setCases(prev => prev.map(c => c.id === id ? { ...c, analysisCompleted } : c));
  };

  const getCaseById = (id: string) => cases.find(c => c.id === id);

  const updateSuspect = (id: string, updates: Partial<Suspect>) => {
    setSuspects(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
    toast.success(`Suspect ${id} updated`);
  };

  const getSuspectById = (id: string) => suspects.find(s => s.id === id);

  return (
    <TraceContext.Provider value={{
      auth,
      login,
      logout,
      cases,
      activeCases: cases.filter(c => c.status === 'active'),
      archivedCases: cases.filter(c => c.status === 'archived'),
      addCase,
      updateCaseStatus,
      updateCaseAnalysisStatus,
      getCaseById,
      suspects,
      setSuspects,
      updateSuspect,
      getSuspectById
    }}>
      {children}
    </TraceContext.Provider>
  );
}

export function useTrace() {
  const context = useContext(TraceContext);
  if (context === undefined) {
    throw new Error('useTrace must be used within a TraceProvider');
  }
  return context;
}
