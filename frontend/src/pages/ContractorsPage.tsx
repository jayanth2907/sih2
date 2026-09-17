import React, { useEffect, useState } from 'react';
import { useMineContext } from '../context/MineContext';
import { governanceService } from '../services';
import { Contractor, Contract } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { Building2, FileText, ShieldAlert, CheckCircle2 } from 'lucide-react';

export const ContractorsPage: React.FC = () => {
  const { selectedMine } = useMineContext();
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedContractor, setSelectedContractor] = useState<Contractor | null>(null);

  const fetchData = async () => {
    if (!selectedMine) return;
    setIsLoading(true);
    try {
      const [contractorsData, contractsData] = await Promise.all([
        governanceService.getContractors(),
        governanceService.getContracts(selectedMine.id)
      ]);
      setContractors(contractorsData);
      setContracts(contractsData);
      if (contractorsData.length > 0) {
        setSelectedContractor(contractorsData[0]);
      }
    } catch (err) {
      console.error('Failed to load contractor data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedMine?.id]);

  if (!selectedMine) return null;

  const totalContractors = contractors.length;
  const activeContracts = contracts.filter((c) => c.status === 'ACTIVE').length;
  const expiringContracts = contracts.filter((c) => c.status === 'EXPIRING_SOON').length;
  const compliantContractors = contracts.filter((c) => c.compliance_status === 'COMPLIANT').length;

  const selectedContractorContracts = contracts.filter(
    (c) => selectedContractor && c.contractor_id === selectedContractor.id
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <Building2 className="w-5 h-5 text-amber-400" />
              Contractor Governance & Compliance Management
            </h2>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-950/80 text-amber-400 border border-amber-800">
              AUDITED VENDORS
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Monitor outsourced mining operations, equipment contracts, statutory certifications, and contract expiry SLAs.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 font-mono text-xs">
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-md space-y-1">
          <span className="text-slate-500 text-[10px] uppercase">Registered Agencies</span>
          <p className="text-2xl font-bold text-white">{totalContractors}</p>
        </div>
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-md space-y-1">
          <span className="text-slate-500 text-[10px] uppercase">Active Contracts</span>
          <p className="text-2xl font-bold text-emerald-400">{activeContracts}</p>
        </div>
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-md space-y-1">
          <span className="text-slate-500 text-[10px] uppercase">Expiring / Reviews</span>
          <p className="text-2xl font-bold text-amber-400">{expiringContracts}</p>
        </div>
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-md space-y-1">
          <span className="text-slate-500 text-[10px] uppercase">Compliant Contracts</span>
          <p className="text-2xl font-bold text-cyan-400">
            {contracts.length > 0 ? ((compliantContractors / contracts.length) * 100).toFixed(0) : 100}%
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Contractor List */}
        <div className="lg:col-span-1 bg-slate-900/80 border border-slate-800 rounded-2xl p-4 backdrop-blur-md space-y-3 font-mono text-xs">
          <h3 className="font-bold text-white flex items-center justify-between">
            <span>Contracting Entities</span>
            <span className="text-[10px] text-slate-500">{contractors.length} active</span>
          </h3>

          <div className="space-y-2">
            {contractors.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedContractor(c)}
                className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer ${
                  selectedContractor?.id === c.id
                    ? 'bg-amber-500/10 border-amber-500/50 text-white shadow-md'
                    : 'bg-slate-950/60 border-slate-800/80 text-slate-300 hover:bg-slate-800/40'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-amber-400">{c.contractor_code}</span>
                  <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                    Rating: {c.safety_rating}/5.0
                  </span>
                </div>
                <p className="font-semibold text-xs text-white">{c.company_name}</p>
                <p className="text-[10px] text-slate-500 mt-1">Contact: {c.contact_person} ({c.phone})</p>
              </button>
            ))}
          </div>
        </div>

        {/* Contractor Detail & Active Contracts */}
        <div className="lg:col-span-2 space-y-4">
          {selectedContractor ? (
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 backdrop-blur-md space-y-5 font-mono text-xs">
              <div className="flex items-start justify-between border-b border-slate-800/80 pb-4">
                <div>
                  <span className="text-[10px] text-amber-400 uppercase tracking-wider">{selectedContractor.contractor_code} • Vendor Dossier</span>
                  <h3 className="text-lg font-bold text-white mt-0.5">{selectedContractor.company_name}</h3>
                  <p className="text-slate-400 text-xs mt-1">{selectedContractor.email} • {selectedContractor.phone}</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-500 uppercase">GST / Reg Number</span>
                  <p className="font-bold text-slate-300">{selectedContractor.registration_number}</p>
                </div>
              </div>

              {/* Associated Contracts */}
              <div className="space-y-3">
                <h4 className="font-bold text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-amber-400" />
                  Active & Scheduled Work Contracts
                </h4>

                {selectedContractorContracts.length === 0 ? (
                  <p className="text-slate-500 py-4 text-center">No contracts assigned to this contractor for the current mine.</p>
                ) : (
                  selectedContractorContracts.map((contract) => (
                    <div key={contract.id} className="p-4 bg-slate-950 border border-slate-800/80 rounded-xl space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-amber-400">{contract.contract_code}</span>
                            <span className="text-white font-semibold">{contract.work_scope}</span>
                          </div>
                          {contract.description && <p className="text-slate-400 text-xs mt-1">{contract.description}</p>}
                        </div>
                        <StatusBadge status={contract.status} size="sm" />
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-900 text-[11px]">
                        <div>
                          <span className="text-slate-500 text-[10px] block">Effective Date</span>
                          <span className="text-slate-300">{contract.start_date}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 text-[10px] block">Expiry Date</span>
                          <span className="text-slate-300 font-semibold">{contract.end_date}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 text-[10px] block">Contract Value</span>
                          <span className="text-amber-400 font-bold">
                            ₹{contract.total_value?.toLocaleString()}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500 text-[10px] block">Compliance State</span>
                          <span className={`font-bold ${
                            contract.compliance_status === 'COMPLIANT' ? 'text-emerald-400' : 'text-amber-400'
                          }`}>
                            {contract.compliance_status}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : (
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-8 text-center text-slate-500 font-mono text-xs">
              Select a contractor from the left panel to inspect contract terms and compliance status.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
